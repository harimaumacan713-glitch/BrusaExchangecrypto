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
  app.use(express.json({ type: '*/*' }));
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
      console.log("Headers:", req.headers);
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

      const penerimaUid = findKey(body, 'penerimauid');
      const jumlah = findKey(body, 'jumlah');
      const secretKey = findKey(body, 'secretkey');

      const authHeader = req.headers.authorization || '';
      const headerSecretKey = authHeader.replace(/^Bearer\s+/i, '').trim();
      const providedSecret = headerSecretKey || secretKey;

      const expectedSecret = process.env.RAHASIA_TRANSFER_EKSTERNAL || "reivbyteio4b7b3r3vrriy7tov889";

      if (providedSecret !== expectedSecret) {
        console.warn("External transfer failed due to invalid secret");
        return res.status(401).json({ error: "Unauthorized: Invalid secret key" });
      }

      if (!penerimaUid || jumlah === undefined) {
        return res.status(400).json({ error: "Kolom yang wajib diisi tidak tersedia", receivedBody: req.body });
      }

      const numericJumlah = typeof jumlah === 'string' ? parseFloat(jumlah) : jumlah;

      if (typeof numericJumlah !== 'number' || isNaN(numericJumlah) || numericJumlah <= 0) {
        console.warn("External transfer failed due to invalid params. Penerima:", penerimaUid, "Jumlah:", jumlah);
        return res.status(400).json({ error: "Kolom yang wajib diisi tidak tersedia" });
      }

      await db.runTransaction(async (transaction) => {
        const userRef = db.collection('users').doc(penerimaUid);
        const userSnap = await transaction.get(userRef);
        
        if (!userSnap.exists) {
            console.warn("User not found:", penerimaUid);
            throw new Error('User not found');
        }

        // Add balance to users profile model
        transaction.update(userRef, { 
            balance: admin.firestore.FieldValue.increment(numericJumlah) 
        });

        // Add balance to realtime wallet model
        const walletRef = db.collection('wallets').doc(penerimaUid);
        const walletSnap = await transaction.get(walletRef);
        if (walletSnap.exists) {
            transaction.update(walletRef, {
                balance: admin.firestore.FieldValue.increment(numericJumlah),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
        }

        // Log transfer in 'transactions' collection as requested, and also 'transfer_masuk' for UI compatibility
        const txRef = db.collection('transactions').doc();
        transaction.set(txRef, {
            penerimaUid,
            jumlah: numericJumlah,
            description: 'Transfer Masuk Eksternal',
            type: 'deposit',
            status: 'success',
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        const legacyLogRef = db.collection('transfer_masuk').doc();
        transaction.set(legacyLogRef, {
            penerimaUid,
            senderUid: 'external',
            jumlah: numericJumlah,
            status: 'success',
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
      });
      
      console.log("Transfer successful for user:", penerimaUid, "amount:", numericJumlah);
      res.json({ success: true, sukses: true, message: "Transfer diterima" });
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
          // Fetch some context: news and market data
          const [newsRes, marketData] = await Promise.all([
            fetch(`https://min-api.cryptocompare.com/data/v2/news/?lang=EN&limit=5${process.env.CRYPTO_NEWS_API_KEY ? `&api_key=${process.env.CRYPTO_NEWS_API_KEY}` : ""}`).catch(() => ({ json: () => ({ Data: [] }) })),
            (async () => {
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
    try {
      const apiKey = process.env.CRYPTO_NEWS_API_KEY;
      if (!apiKey) {
        console.warn('CRYPTO_NEWS_API_KEY is not defined, returning mock news.');
        res.json({ results: getMockNews() });
        return;
      }

      const response = await fetch(`https://min-api.cryptocompare.com/data/v2/news/?lang=EN&api_key=${apiKey}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch news: ${response.status}`);
      }
      
      const data = await response.json();
      
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

      if (!response.ok) {
        throw new Error(`Failed to fetch prices: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.Response === 'Error' || !data.RAW) {
        throw new Error(`API Error: ${data.Message || 'No RAW data'}`);
      }

      console.log('Prices fetched successfully');
      res.json(data);
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
      // Map range to CryptoCompare API params
      let limit = 24;
      let type = "histohour";
      
      if (range === "7d") { limit = 168; type = "histohour"; }
      else if (range === "1m") { limit = 30; type = "histoday"; }
      else if (range === "1y") { limit = 365; type = "histoday"; }

      const url = `https://min-api.cryptocompare.com/data/v2/${type}?fsym=${symbol}&tsym=IDR&limit=${limit}&api_key=${apiKey}`;
      
      const response = await fetch(url);
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
      console.error("Error fetching history:", error);
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
      // Fetch current price to base the order book on
      const priceUrl = `https://min-api.cryptocompare.com/data/price?fsym=${symbol}&tsyms=IDR${apiKey ? `&api_key=${apiKey}` : ""}`;
      const priceRes = await fetch(priceUrl);
      const priceData = await priceRes.json();
      const currentPrice = priceData.IDR || 1000;

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
