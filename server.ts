import express from "express";
import cors from "cors";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import http from "http";
import { WebSocketServer, WebSocket } from "ws";
import admin from "firebase-admin";

import { GoogleGenAI } from "@google/genai";

dotenv.config();

// Initialize Firebase Admin
admin.initializeApp({
    credential: admin.credential.applicationDefault()
});
const db = admin.firestore();

// Initialize Gemini
const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
}) : null;

// Helper to sync to Firestore
async function syncToFirebase(symbol: string, data: any) {
  try {
    await db.collection('market_data').doc(symbol).set({
      ...data,
      lastUpdate: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  } catch (e) {
    console.warn(`Firebase sync failed for ${symbol}:`, e.message);
  }
}

// Simple in-memory cache
const signalCache = new Map<string, { data: any, timestamp: number }>();
const CACHE_DURATION = 60 * 60 * 1000; // 60 minutes

// Prevent concurrent Gemini calls
let geminiPromise: Promise<any> | null = null;
let retryCount = 0;
const MAX_RETRIES = 3;

async function startServer() {
  const app = express();
  const PORT = 3000;
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server });
  
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // Custom middleware to handle JSON parse errors gracefully
  app.use((err: any, req: any, res: any, next: any) => {
    if (err instanceof SyntaxError && 'body' in err) {
      console.error("JSON Parse Error:", err);
      return res.status(400).json({ error: "Invalid JSON payload" });
    }
    next();
  });

  // API route for receiving transfer from external banking app
  app.post(["/api/receive-transfer", "/api/terima-transfer"], async (req, res) => {
    try {
      console.log("Received transfer request payload:", req.body);
      
      let body: any = req.body || {};
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body);
        } catch (e) {
          // Ignore
        }
      }
      
      // Case insensitive extraction
      const findKey = (obj: any, keyName: string) => {
        const key = Object.keys(obj).find(k => k.toLowerCase() === keyName.toLowerCase());
        return key ? obj[key] : undefined;
      };

      const receiverUid = findKey(body, 'receiveruid') || findKey(body, 'penerimauid');
      const receiverAccountNumber = findKey(body, 'receiveraccountnumber') || findKey(body, 'nomorakunpenerima');
      const senderAccountNumber = findKey(body, 'senderaccountnumber') || findKey(body, 'nomorakunpengirim') || "External";
      const jumlah = findKey(body, 'jumlah') || findKey(body, 'amount');
      const secretKey = findKey(body, 'secretkey');

      const authHeader = req.headers.authorization || '';
      const headerSecretKey = authHeader.replace(/^Bearer\s+/i, '').trim();
      const providedSecret = headerSecretKey || secretKey;

      const expectedSecret = process.env.RAHASIA_TRANSFER_EKSTERNAL || "reivbyteio4b7b3r3vrriy7tov889";

      if (providedSecret !== expectedSecret) {
        return res.status(401).json({ error: "Unauthorized: Invalid secret key" });
      }

      if ((!receiverUid && !receiverAccountNumber) || jumlah === undefined) {
        return res.status(400).json({ error: "Missing required fields (receiverUid or receiverAccountNumber and jumlah)" });
      }

      const numericJumlah = typeof jumlah === 'string' ? parseFloat(jumlah) : jumlah;
      if (typeof numericJumlah !== 'number' || isNaN(numericJumlah) || numericJumlah <= 0) {
        return res.status(400).json({ error: "Invalid amount" });
      }

      // 1. Resolve receiver UID if only accountNumber provided
      let finalUid = receiverUid;
      if (!finalUid && receiverAccountNumber) {
        const userQuery = await db.collection('users').where('accountNumber', '==', receiverAccountNumber).limit(1).get();
        if (userQuery.empty) {
          return res.status(404).json({ error: "Receiver account number not found" });
        }
        finalUid = userQuery.docs[0].id;
      }

      await db.runTransaction(async (transaction) => {
        const userRef = db.collection('users').doc(finalUid);
        const exchangeWalletRef = db.collection('exchange_wallets').doc(finalUid);
        
        const userSnap = await transaction.get(userRef);
        if (!userSnap.exists) {
            throw new Error('User not found');
        }

        const exchangeWalletSnap = await transaction.get(exchangeWalletRef);
        if (!exchangeWalletSnap.exists) {
            // Create if missing
            transaction.set(exchangeWalletRef, {
                idr: numericJumlah,
                btc: 0,
                eth: 0,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
        } else {
            transaction.update(exchangeWalletRef, { 
                idr: admin.firestore.FieldValue.increment(numericJumlah),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
        }

        // 2. Log in 'external_transfers' (New Requirement)
        const extTxRef = db.collection('external_transfers').doc();
        transaction.set(extTxRef, {
            senderAccountNumber,
            receiverUid: finalUid,
            receiverAccountNumber: receiverAccountNumber || userSnap.data()?.accountNumber || "",
            jumlah: numericJumlah,
            status: 'SUCCESS',
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        // 3. Keep legacy logs for UI compatibility if needed
        const txRef = db.collection('transactions').doc();
        transaction.set(txRef, {
            userId: finalUid,
            jumlah: numericJumlah,
            amount: numericJumlah,
            description: `Deposit IDR from ${senderAccountNumber}`,
            type: 'deposit',
            status: 'filled',
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
      });
      
      console.log("Transfer successful to:", finalUid, "amount:", numericJumlah);
      res.json({ success: true, message: "Transfer processed successfully" });
    } catch (error: any) {
      console.error('Transfer Error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/ai-signal", async (req, res) => {
    try {
      if (!ai) {
        return res.json({ signal: "Neutral (AI Not Configured)", confidence: 50, summary: "Configure GEMINI_API_KEY for real AI insights." });
      }

      const { symbol } = req.query;
      if (typeof symbol !== 'string') return res.status(400).json({ error: "Symbol is required" });

      // Check cache
      const cached = signalCache.get(symbol);
      if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
        return res.json(cached.data);
      }

      // If already fetching, wait for single active promise
      if (geminiPromise) {
          await geminiPromise;
          const cachedAgain = signalCache.get(symbol);
          if (cachedAgain) return res.json(cachedAgain.data);
      }

      const fetchTask = async (attempt = 0): Promise<any> => {
          const idxStocks = ['BBCA', 'BBRI', 'TLKM', 'ASII', 'GOTO', 'BMRI'];
          const usStocks = ['NVDA', 'AAPL', 'MSFT', 'TSLA', 'GOOGL'];
          const stocks = [...idxStocks, ...usStocks];

          // Fetch some context: news and market data
          const [newsRes, marketData] = await Promise.all([
            fetch(`https://min-api.cryptocompare.com/data/v2/news/?lang=EN&limit=5${process.env.CRYPTO_NEWS_API_KEY ? `&api_key=${process.env.CRYPTO_NEWS_API_KEY}` : ""}`).catch(() => ({ json: () => ({ Data: [] }) })),
            (async () => {
              if (stocks.includes(symbol as string)) {
                const stockPrices: Record<string, number> = {
                  BBCA: 10450, BBRI: 4720, TLKM: 2840, ASII: 4420, GOTO: 62, BMRI: 6250,
                  NVDA: 924.79, AAPL: 189.98, MSFT: 420.55, TSLA: 174.60, GOOGL: 171.95,
                };
                const price = stockPrices[symbol as string] || 1000;
                return { PRICE: idxStocks.includes(symbol as string) ? price : price * 16150, VOLUME24HOUR: 1000000, MKTCAP: 1000000000 };
              }
              try {
                const apiKey = process.env.CRYPTO_NEWS_API_KEY;
                const url = `https://min-api.cryptocompare.com/data/pricemultifull?fsyms=${symbol}&tsyms=IDR${apiKey ? `&api_key=${apiKey}` : ""}`;
                const res = await fetch(url);
                const data = await res.json();
                if (data.RAW && data.RAW[symbol]) return data.RAW[symbol].IDR;
                throw new Error("No data");
              } catch (e) {
                // Fallback: Binance Public API for price
                try {
                  const bRes = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}USDT`);
                  const bData = await bRes.json();
                  return { PRICE: parseFloat(bData.lastPrice) * 16000, VOLUME24HOUR: parseFloat(bData.volume), MKTCAP: 0 };
                } catch (e2) {
                  return { PRICE: 0, VOLUME24HOUR: 0, MKTCAP: 0 };
                }
              }
            })()
          ]);
          
          const newsData = await newsRes.json();
          const newsTitles = newsData.Data?.map((n: any) => n.title).join(". ") || "";

          try {
              const response = await ai.models.generateContent({
                model: "gemini-3-flash-preview",
                contents: `Analyze the current market sentiment for ${symbol}. 
                Market Data: Price: ${marketData.PRICE}, 24h Volume: ${marketData.VOLUME24HOUR}, Market Cap: ${marketData.MKTCAP}.
                Recent News: "${newsTitles}". 
                Return a JSON object with: 
                { "signal": "Strong Buy" | "Buy" | "Neutral" | "Sell" | "Strong Sell", "confidence": number (0-100), "summary": "one short sentence" }`,
                config: {
                  responseMimeType: "application/json"
                }
              });
              
              const text = response.text || "{}";
              const data = JSON.parse(text);
              
              // Update cache
              signalCache.set(symbol, { data, timestamp: Date.now() });
              return data;
          } catch (e: any) {
              if (e.status === 429 && attempt < MAX_RETRIES) {
                  const delay = Math.pow(2, attempt) * 1000 * 5;
                  await new Promise(resolve => setTimeout(resolve, delay));
                  return fetchTask(attempt + 1);
              }
              throw e;
          }
      };

      geminiPromise = fetchTask();
      const data = await geminiPromise;
      geminiPromise = null;

      res.json(data);
    } catch (error: any) {
      geminiPromise = null;
      console.error("Gemini Error:", error);
      
      // If we have stale cached data, return it even if expired to avoid showing an error
      const staleCached = signalCache.get(req.query.symbol as string);
      if (staleCached) {
        return res.json(staleCached.data);
      }

      res.json({ signal: "Neutral", confidence: 50, summary: "AI service is currently busy or unavailable." });
    }
  });
  const subscriptions = new Map<WebSocket, string>();

  // Broadcast to all clients
  const broadcast = (data: any) => {
    const message = JSON.stringify(data);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  };

  wss.on("connection", (ws) => {
    ws.on("message", (message) => {
      try {
        const data = JSON.parse(message.toString());
        if (data.type === "SUBSCRIBE_ORDERBOOK") {
          subscriptions.set(ws, data.symbol);
        } else if (data.type === "UNSUBSCRIBE_ORDERBOOK") {
          subscriptions.delete(ws);
        }
      } catch (e) {
        // Ignore parsing errors
      }
    });

    ws.on("close", () => {
      subscriptions.delete(ws);
    });
  });

  // Periodically send orderbook updates to subscribed clients
  setInterval(() => {
    subscriptions.forEach((symbol, ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        // Base price for generation
        const mockPrices = getMockPrices().RAW as any;
        const basePrice = mockPrices[symbol]?.IDR?.PRICE || 1000;
        
        const generateOrders = (base: number, isAsk: boolean) => {
          const orders = [];
          for (let i = 0; i < 15; i++) {
            const spread = (i + 1) * 0.0005 * base;
            const price = isAsk ? base + spread : base - spread;
            const amount = Math.random() * 2 + 0.1;
            orders.push({ price, amount, total: price * amount });
          }
          return isAsk ? orders.reverse() : orders;
        };

        ws.send(JSON.stringify({
          type: "ORDERBOOK_UPDATE",
          symbol,
          bids: generateOrders(basePrice, false),
          asks: generateOrders(basePrice, true)
        }));
      }
    });
  }, 2000); // Update every 2 seconds

  // Stock Polling Logic
  const idxStocks = ['BBCA', 'BBRI', 'TLKM', 'ASII', 'GOTO', 'BMRI'];
  const usStocks = ['NVDA', 'AAPL', 'MSFT', 'TSLA', 'GOOGL'];
  const stockSymbols = [...idxStocks, ...usStocks];
  const yahooSymbolsList = [
    ...idxStocks.map(s => `${s}.JK`),
    ...usStocks,
    '^JKSE', // IHSG
    '^GSPC', // S&P 500
  ].join(',');

  // Poll Yahoo every 5 seconds
  setInterval(async () => {
    try {
      const yahooRes = await fetch(`https://query1.finance.yahoo.com/v7/finance/quote?symbols=${yahooSymbolsList}`, {
         headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      const yahooData = await yahooRes.json();

      if (yahooData.quoteResponse && yahooData.quoteResponse.result) {
        yahooData.quoteResponse.result.forEach((quote: any) => {
          const rawSymbol = quote.symbol === '^JKSE' ? 'IHSG' : quote.symbol === '^GSPC' ? 'SP500' : quote.symbol.replace('.JK', '');
          const isIdx = quote.symbol.endsWith('.JK') || quote.symbol === '^JKSE';
          const isUs = usStocks.includes(quote.symbol) || quote.symbol === '^GSPC';
          
          const update = {
            symbol: rawSymbol,
            price: quote.regularMarketPrice,
            change: quote.regularMarketChangePercent,
            mktcap: quote.marketCap || 0,
            volume: quote.regularMarketVolume || 0,
            isStock: true,
            isIdx: isIdx,
            isIndex: quote.symbol.startsWith('^')
          };

          broadcast({
            type: "PRICE_UPDATE",
            ...update
          });

          // Sync to Firebase
          syncToFirebase(rawSymbol, update);
        });
      }
    } catch (err) {
      // Ignore polling errors quietly
    }
  }, 5000);

  // External CryptoCompare WebSocket logic
  const apiKey = process.env.CRYPTO_NEWS_API_KEY;
  let ccWs: WebSocket | null = null;
  const symbols = ["BTC", "ETH", "SOL", "USDT"];

  const connectToCC = () => {
    if (!apiKey) {
      console.warn("CRYPTO_NEWS_API_KEY not found. WebSocket bridge disabled.");
      return;
    }

    console.log("Connecting to CryptoCompare WebSocket...");
    ccWs = new WebSocket(`wss://streamer.cryptocompare.com/v2?api_key=${apiKey}`);

    ccWs.on("open", () => {
      console.log("Connected to CryptoCompare WebSocket");
      const subs = symbols.map(s => `5~CCCAGG~${s}~IDR`);
      ccWs?.send(JSON.stringify({
        action: "SubAdd",
        subs: subs
      }));
    });

    ccWs.on("message", (data) => {
      try {
        const msg = JSON.parse(data.toString());
        // TYPE 5 is CCCAGG (Current Aggregate)
        if (msg.TYPE === "5" && (msg.FLAGS === "1" || msg.FLAGS === "2" || msg.FLAGS === "4")) {
          // Broadcast price updates to local clients
          broadcast({
            type: "PRICE_UPDATE",
            symbol: msg.FROMSYMBOL,
            price: msg.PRICE,
            volume: msg.VOLUME24HOUR,
            change: msg.CHANGEPCT24HOUR,
            mktcap: msg.MKTCAP
          });
        }
      } catch (e) {
        // Ignore parsing errors
      }
    });

    ccWs.on("error", (err) => {
      console.error("CryptoCompare WebSocket error:", err);
    });

    ccWs.on("close", () => {
      console.log("CryptoCompare WebSocket closed. Reconnecting in 5s...");
      setTimeout(connectToCC, 5000);
    });
  };

  if (apiKey) {
    connectToCC();
  } else {
    // Simulate real-time updates for demonstration when no API key is present
    // Initialize all prices from mock data for simulation
    const mockRaw = getMockPrices().RAW as any;
    const currentSimulatedPrices: Record<string, number> = {};
    Object.keys(mockRaw).forEach(s => {
      currentSimulatedPrices[s] = mockRaw[s].IDR.PRICE;
    });

    setInterval(() => {
      const simSymbols = Object.keys(currentSimulatedPrices);
      const symbol = simSymbols[Math.floor(Math.random() * simSymbols.length)];
      
      // Dynamic volatility (more for meme coins, less for BTC)
      const volatility = symbol === 'BTC' ? 0.003 : 0.008;
      const variation = (Math.random() - 0.5) * volatility; 
      currentSimulatedPrices[symbol] *= (1 + variation);
      
      broadcast({
        type: "PRICE_UPDATE",
        symbol: symbol,
        price: currentSimulatedPrices[symbol],
        change: ((currentSimulatedPrices[symbol] / mockRaw[symbol].IDR.PRICE) - 1) * 100,
        mktcap: mockRaw[symbol].IDR.MKTCAP * (currentSimulatedPrices[symbol] / mockRaw[symbol].IDR.PRICE)
      });
    }, 400); // Super fast 400ms updates
  }

  // API route for news
  app.get("/api/news", async (req, res) => {
    console.log('API /api/news called');
    try {
      const apiKey = process.env.CRYPTO_NEWS_API_KEY;
      if (!apiKey) {
        console.warn('CRYPTO_NEWS_API_KEY is not defined, returning mock news.');
        res.json({ results: getMockNews() });
        return;
      }

      console.log('Fetching news from CryptoCompare...');
      const response = await fetch(`https://min-api.cryptocompare.com/data/v2/news/?lang=EN&api_key=${apiKey}`);
      
      console.log('CryptoCompare status:', response.status);
      if (!response.ok) {
        throw new Error(`Failed to fetch news: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('CryptoCompare response received');
      
      if (!data.Data) {
        throw new Error(`API Error: ${data.Message || 'No Data'}`);
      }

      // Map CryptoCompare data to the expected format
      const formattedNews = ((data.Data && Array.isArray(data.Data)) ? data.Data : []).slice(0, 15).map((item: any) => ({
        title: item.title,
        time: new Date(item.published_on * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: item.published_on * 1000,
        image: item.imageurl,
        categories: item.categories ? item.categories.split('|') : [],
      }));
      res.json({ results: formattedNews });
    } catch (error) {
      console.error('Error fetching news:', error);
      // Fallback to mock news on any error
      res.status(200).json({ results: getMockNews() });
    }
  });

  // API route for crypto prices
  app.get("/api/prices", async (req, res) => {
    console.log('Fetching prices...');
    try {
      const apiKey = process.env.CRYPTO_NEWS_API_KEY;
      const symbolsList = ["BTC", "ETH", "SOL", "USDT", "XRP", "ADA", "DOT", "DOGE", "MATIC", "AVAX"];
      const symbols = symbolsList.join(",");
      const url = `https://min-api.cryptocompare.com/data/pricemultifull?fsyms=${symbols}&tsyms=IDR${apiKey ? `&api_key=${apiKey}` : ""}`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); 

      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      let cryptoData: any = { RAW: {}, DISPLAY: {} };
      if (response.ok) {
        const data = await response.json();
        if (data.RAW && data.DISPLAY) {
          cryptoData = data;
        }
      }

      // Fetch Stock Data from Yahoo Finance
      const idxStocks = ['BBCA', 'BBRI', 'TLKM', 'ASII', 'GOTO', 'BMRI'];
      const usStocks = ['NVDA', 'AAPL', 'MSFT', 'TSLA', 'GOOGL'];
      
      const yahooSymbols = [
        ...idxStocks.map(s => `${s}.JK`),
        ...usStocks,
        '^JKSE',
        '^GSPC'
      ].join(',');

      try {
        const yahooRes = await fetch(`https://query1.finance.yahoo.com/v7/finance/quote?symbols=${yahooSymbols}`);
        const yahooData = await yahooRes.json();

        if (yahooData.quoteResponse && yahooData.quoteResponse.result) {
          const usdtRate = cryptoData.RAW?.USDT?.IDR?.PRICE || 16150;
          
          yahooData.quoteResponse.result.forEach((quote: any) => {
            const rawSymbol = quote.symbol === '^JKSE' ? 'IHSG' : quote.symbol === '^GSPC' ? 'SP500' : quote.symbol.replace('.JK', '');
            const isIdx = quote.symbol.endsWith('.JK') || quote.symbol === '^JKSE';
            const currentPrice = quote.regularMarketPrice;
            const changePct = quote.regularMarketChangePercent;
            const mktCap = quote.marketCap || 0;
            const volume = quote.regularMarketVolume || 0;

            const priceIdr = (isIdx || quote.symbol.startsWith('^')) ? currentPrice : currentPrice * usdtRate;
            const priceUsdt = (isIdx || quote.symbol.startsWith('^')) ? currentPrice / usdtRate : currentPrice;

            cryptoData.RAW[rawSymbol] = {
              IDR: {
                PRICE: priceIdr,
                PRICE_USDT: priceUsdt,
                CHANGEPCT24HOUR: changePct,
                MKTCAP: mktCap,
                VOLUME24HOUR: volume
              }
            };

            const formatValue = (val: number) => {
              if (val >= 1e12) return `${(val / 1e12).toFixed(2)}T`;
              if (val >= 1e9) return `${(val / 1e9).toFixed(2)}B`;
              if (val >= 1e6) return `${(val / 1e6).toFixed(2)}M`;
              return val.toLocaleString();
            };

            cryptoData.DISPLAY[rawSymbol] = {
              IDR: {
                PRICE: isIdx ? `Rp ${priceIdr.toLocaleString('id-ID')}` : `$${currentPrice.toLocaleString('en-US')}`,
                CHANGEPCT24HOUR: changePct.toFixed(2),
                MKTCAP: formatValue(mktCap),
                VOLUME24HOUR: formatValue(volume),
                IMAGEURL: null
              }
            };
          });
        }
      } catch (err) {
        console.error("Failed to fetch yahoo finance data:", err);
      }

      if (Object.keys(cryptoData.RAW).length === 0) {
        throw new Error("No data fetched");
      }

      console.log('Prices fetched successfully');
      res.json(cryptoData);
    } catch (error) {
      console.error('Primary price fetch failed, trying public Binance fallback:', error);
      try {
         // Fallback: Fetch a few major pairs from Binance Public API and construct a partial RAW/DISPLAY object
         const btcRes = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT');
         const btcData = await btcRes.json();
         const btcPrice = parseFloat(btcData.price);
         const rate = 16150; // Fallback rate

         const fallbackData = {
           RAW: {
             BTC: { IDR: { PRICE: btcPrice * rate, PRICE_USDT: btcPrice, CHANGEPCT24HOUR: 0, MKTCAP: 0, VOLUME24HOUR: 0 } },
             USDT: { IDR: { PRICE: rate, PRICE_USDT: 1, CHANGEPCT24HOUR: 0, MKTCAP: 0, VOLUME24HOUR: 0 } }
           },
           DISPLAY: {
             BTC: { IDR: { PRICE: `Rp ${(btcPrice * rate).toLocaleString()}`, CHANGEPCT24HOUR: "0", MKTCAP: "0", VOLUME24HOUR: "0" } },
             USDT: { IDR: { PRICE: `Rp ${rate.toLocaleString()}`, CHANGEPCT24HOUR: "0", MKTCAP: "0", VOLUME24HOUR: "0" } }
           }
         };
         res.json(fallbackData);
      } catch (fallbackError) {
         res.json(getMockPrices());
      }
    }
  });

function getMockPrices() {
  return {
    RAW: {
      BTC: { IDR: { PRICE: 1100000000, CHANGEPCT24HOUR: 2.5, MKTCAP: 21000000000000, VOLUME24HOUR: 450000000000 } },
      ETH: { IDR: { PRICE: 50000000, CHANGEPCT24HOUR: 1.8, MKTCAP: 6000000000000, VOLUME24HOUR: 220000000000 } },
      SOL: { IDR: { PRICE: 2000000, CHANGEPCT24HOUR: 5.2, MKTCAP: 900000000000, VOLUME24HOUR: 85000000000 } },
      USDT: { IDR: { PRICE: 16000, CHANGEPCT24HOUR: 0.1, MKTCAP: 1600000000000, VOLUME24HOUR: 1100000000000 } }
    },
    DISPLAY: {
      BTC: { IDR: { PRICE: "Rp 1.100.000.000", CHANGEPCT24HOUR: "2.5", MKTCAP: "Rp 21.000 T", VOLUME24HOUR: "Rp 450 T" } },
      ETH: { IDR: { PRICE: "Rp 50.000.000", CHANGEPCT24HOUR: "1.8", MKTCAP: "Rp 6.000 T", VOLUME24HOUR: "Rp 220 T" } },
      SOL: { IDR: { PRICE: "Rp 2.000.000", CHANGEPCT24HOUR: "5.2", MKTCAP: "Rp 900 T", VOLUME24HOUR: "Rp 85 T" } },
      USDT: { IDR: { PRICE: "Rp 16.000", CHANGEPCT24HOUR: "0.1", MKTCAP: "Rp 1.600 T", VOLUME24HOUR: "Rp 1.100 T" } }
    }
  };
}

function getMockNews() {
  const now = Date.now();
  return [
    { 
      title: "Bitcoin Reaches New Highs", 
      time: "10:30",
      timestamp: now - 3600000, // 1h ago
      image: "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=200&h=200&fit=crop",
      categories: ["Macroeconomics", "Technology"]
    },
    { 
      title: "Ethereum Network Upgrade Announced", 
      time: "11:15",
      timestamp: now - 7200000, // 2h ago
      image: "https://images.unsplash.com/photo-1622790698141-94e30457ef12?w=200&h=200&fit=crop",
      categories: ["Technology"]
    },
    { 
      title: "New Regulation Framework for DeFi", 
      time: "12:00",
      timestamp: now - 86400000, // 1 day ago
      image: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=200&h=200&fit=crop",
      categories: ["Regulation"]
    },
    { 
      title: "Global Markets React to Fed Statements", 
      time: "14:20",
      timestamp: now - 172800000, // 2 days ago
      image: "https://images.unsplash.com/photo-1611974714658-66d2c130094e?w=200&h=200&fit=crop",
      categories: ["Macroeconomics"]
    },
    { 
      title: "AI Integration in Crypto Exchanges", 
      time: "09:45",
      timestamp: now - 10800000, // 3h ago
      image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=200&h=200&fit=crop",
      categories: ["Technology"]
    }
  ];
}

  // API route for crypto history
  app.get("/api/history", async (req, res) => {
    const { symbol, range } = req.query;
    if (!symbol) return res.status(400).json({ error: "Symbol is required" });

    try {
      const apiKey = process.env.CRYPTO_NEWS_API_KEY;
      
      // Stock lists (must match client lists)
      const idxStocks = ['BBCA', 'BBRI', 'TLKM', 'ASII', 'GOTO', 'BMRI'];
      const usStocks = ['NVDA', 'AAPL', 'MSFT', 'TSLA', 'GOOGL'];
      const stocks = [...idxStocks, ...usStocks];

      if (stocks.includes(symbol as string)) {
        // Try fetching Yahoo finance chart first for history!
        const isIdx = idxStocks.includes(symbol as string);
        const ySymbol = isIdx ? `${symbol}.JK` : symbol;
        
        // Map range to Yahoo interval/range
        let interval = '1h';
        let yRange = '1d';
        
        if (range === '24h') { interval = '5m'; yRange = '1d'; }
        else if (range === '7d') { interval = '1h'; yRange = '7d'; }
        else if (range === '1m') { interval = '1d'; yRange = '1mo'; }
        else if (range === '1y') { interval = '1wk'; yRange = '1y'; }
        
        try {
          const yRes = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${ySymbol}?range=${yRange}&interval=${interval}`, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
          });
          const yData = await yRes.json();
          const result = yData.chart?.result?.[0];
          
          if (result && result.timestamp && result.indicators?.quote?.[0]?.close) {
             const timestamps = result.timestamp;
             const closes = result.indicators.quote[0].close;
             
             let history = [];
             for(let i=0; i<timestamps.length; i++) {
                if (closes[i] !== null) {
                  const date = new Date(timestamps[i] * 1000);
                  history.push({
                    time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    fullTime: date.toLocaleString(),
                    price: closes[i],
                    volume: result.indicators.quote[0].volume?.[i] || 0
                  });
                }
             }

             // Ensure the last point matches the ABSOLUTE LATEST "current price" from Yahoo
             // This prevents the "last price vs chart" mismatch
             try {
               const quoteRes = await fetch(`https://query1.finance.yahoo.com/v7/finance/quote?symbols=${ySymbol}`, {
                 headers: { 'User-Agent': 'Mozilla/5.0' }
               });
               const quoteData = await quoteRes.json();
               const quote = quoteData.quoteResponse?.result?.[0];
               if (quote && quote.regularMarketPrice) {
                 const now = new Date();
                 const lastH = history[history.length - 1];
                 // If the quote is newer or different from the last history point
                 if (!lastH || Math.abs(lastH.price - quote.regularMarketPrice) > 0.0001) {
                    history.push({
                      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                      fullTime: now.toLocaleString(),
                      price: quote.regularMarketPrice,
                      volume: quote.regularMarketVolume || 0
                    });
                 }
               }
             } catch (e) {
               // Ignore quote fetch error
             }

             return res.json(history);
          }
        } catch(err) {
           console.error("Failed to fetch yahoo chart:", err);
        }

        // Fallback generated history for stocks
        const stockPrices: Record<string, number> = {
          BBCA: 10450, BBRI: 4720, TLKM: 2840, ASII: 4420, GOTO: 62, BMRI: 6250,
          NVDA: 924.79, AAPL: 189.98, MSFT: 420.55, TSLA: 174.60, GOOGL: 171.95,
        };
        const basePrice = stockPrices[symbol as string] || 1000;
        const multiplier = idxStocks.includes(symbol as string) ? 1 : 1; // already handled by basePrice
        
        const count = range === '7d' ? 168 : range === '1m' ? 30 : range === '1y' ? 365 : 24;
        const history = Array.from({ length: count }, (_, i) => {
          const time = new Date(Date.now() - (count - i) * (count <= 24 ? 3600000 : 86400000));
          return {
            time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            fullTime: time.toLocaleString(),
            price: basePrice * (1 + (Math.random() * 0.04 - 0.02))
          };
        });
        return res.json(history);
      }

      // Map range to CryptoCompare API params
      let limit = 24;
      let type = "histohour";
      
      if (range === "7d") { limit = 168; type = "histohour"; }
      else if (range === "1m") { limit = 30; type = "histoday"; }
      else if (range === "1y") { limit = 365; type = "histoday"; }

      const url = `https://min-api.cryptocompare.com/data/v2/${type}?fsym=${symbol}&tsym=IDR&limit=${limit}${apiKey ? `&api_key=${apiKey}` : ""}`;
      
            const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const data = await response.json();

      if (data.Response === "Error") {
        throw new Error(data.Message);
      }

      const history = data.Data.Data.map((item: any) => ({
        time: new Date(item.time * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        fullTime: new Date(item.time * 1000).toLocaleString(),
        price: item.close,
      }));

      res.json(history);
    } catch (error) {
      console.error("Error fetching history for", symbol, ":", (error as Error).message);
      // Fallback mock history if API fails
      const mockHistory = Array.from({ length: 24 }, (_, i) => ({
        time: `${i}:00`,
        price: 100 + Math.random() * 20
      }));
      res.json(mockHistory);
    }
  });

  // API route for order book
  app.get("/api/orderbook", async (req, res) => {
    const { symbol } = req.query;
    if (!symbol) return res.status(400).json({ error: "Symbol is required" });

    try {
      const apiKey = process.env.CRYPTO_NEWS_API_KEY;

      const idxStocks = ['BBCA', 'BBRI', 'TLKM', 'ASII', 'GOTO', 'BMRI'];
      const usStocks = ['NVDA', 'AAPL', 'MSFT', 'TSLA', 'GOOGL'];
      const stocks = [...idxStocks, ...usStocks];

      let currentPrice = 1000;

      if (stocks.includes(symbol as string)) {
        const isIdx = idxStocks.includes(symbol as string);
        const ySymbol = isIdx ? `${symbol}.JK` : symbol;
        try {
                      const yRes = await fetch(`https://query1.finance.yahoo.com/v7/finance/quote?symbols=${ySymbol}`, {
             headers: { 'User-Agent': 'Mozilla/5.0' }
           });
           const yData = await yRes.json();
           if (yData.quoteResponse && yData.quoteResponse.result && yData.quoteResponse.result[0]) {
               currentPrice = yData.quoteResponse.result[0].regularMarketPrice;
           } else {
               throw new Error("No data");
           }
        } catch (e) {
           const stockPrices: Record<string, number> = {
             BBCA: 10450, BBRI: 4720, TLKM: 2840, ASII: 4420, GOTO: 62, BMRI: 6250,
             NVDA: 924.79, AAPL: 189.98, MSFT: 420.55, TSLA: 174.60, GOOGL: 171.95,
           };
           currentPrice = stockPrices[symbol as string] || 1000;
        }
      } else {
        // Fetch current price to base the order book on
        const priceUrl = `https://min-api.cryptocompare.com/data/price?fsym=${symbol}&tsyms=IDR${apiKey ? `&api_key=${apiKey}` : ""}`;
        const priceRes = await fetch(priceUrl);
        const priceData = await priceRes.json();
        currentPrice = priceData.IDR || 1000;
      }

      // Generate a realistic order book around the current price
      const generateOrders = (basePrice: number, isAsk: boolean) => {
        const orders = [];
        for (let i = 0; i < 15; i++) {
          const spread = (i + 1) * 0.0005 * basePrice;
          const price = isAsk ? basePrice + spread : basePrice - spread;
          const amount = Math.random() * 2 + 0.1;
          orders.push({
            price: price,
            amount: amount,
            total: price * amount
          });
        }
        return isAsk ? orders.reverse() : orders;
      };

      res.json({
        bids: generateOrders(currentPrice, false),
        asks: generateOrders(currentPrice, true)
      });
    } catch (error) {
      console.error("Error fetching orderbook:", error);
      res.status(500).json({ error: "Failed to fetch order book" });
    }
  });

// API route for stock proxy (Yahoo Finance)
  app.get("/api/stocks/price", async (req, res) => {
    const { symbol } = req.query;
    
    if (!symbol) {
      return res.status(400).json({ error: "Symbol is required" });
    }

    // Try to get from Firestore cache first
    let cachedData = null;
    try {
        const cachedDoc = await db.collection('market_data').doc(symbol as string).get();
        if (cachedDoc.exists) {
            cachedData = cachedDoc.data();
            // If cache is less than 30 seconds old, return it immediately
            if (cachedData && cachedData.lastUpdate && (Date.now() - cachedData.lastUpdate.toMillis() < 30000)) {
                return res.json({ price: cachedData.price, source: 'cache' });
            }
        }
    } catch(e) { /* ignore cache error */ }

    try {
        // Fetch from Yahoo (for Indo) or Finnhub (for US)
        let price = null;
        const isIndo = (symbol as string).endsWith('.JK');

        if (isIndo) {
            const url = `https://query2.finance.yahoo.com/v7/finance/quote?symbols=${symbol}`;
            const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' } });
            const data = await response.json();
            if (data.quoteResponse && data.quoteResponse.result && data.quoteResponse.result.length > 0) {
                price = data.quoteResponse.result[0].regularMarketPrice;
            }
        } else {
            // Finnhub API for US
            const finnhubKey = process.env.FINNHUB_API_KEY;
            if (finnhubKey) {
                const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${finnhubKey}`;
                const response = await fetch(url);
                const data = await response.json();
                if (data.c) {
                    price = data.c;
                }
            } else {
                console.warn("FINNHUB_API_KEY not configured");
            }
        }
        
        if (price) {
            // Update Firebase
            syncToFirebase(symbol as string, { price });
            
            return res.json({ price });
        }
        
        throw new Error(`Data not found for ${symbol}`);
    } catch (error) {
        console.error(`Error fetching price for ${symbol}:`, error);
      
      // Serve stale cache if available
      if (cachedData) {
          return res.json({ price: cachedData.price, source: 'stale-cache' });
      }
      
      res.status(500).json({ error: "Data market sementara tidak tersedia" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
