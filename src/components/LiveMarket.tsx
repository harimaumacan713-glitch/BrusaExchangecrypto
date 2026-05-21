import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Bitcoin, TrendingUp, TrendingDown, Activity, Users, Info, 
  BarChart3, ChevronDown, ChevronUp, Star, StarOff, 
  Edit3, StickyNote, Plus, X, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LineChart, Line, ResponsiveContainer, XAxis, YAxis, 
  Tooltip, ReferenceLine, ReferenceDot, Brush 
} from 'recharts';
import { 
  Save, Download, RotateCcw
} from 'lucide-react';
import { StockPriceSkeleton } from './StockPriceSkeleton';

import { ASSET_METADATA } from '../constants';
import { createChart, ColorType, IChartApi, ISeriesApi, LineSeries, CrosshairMode } from 'lightweight-charts';

function AnalysisChart({ 
  symbol, 
  currentPrice,
  selectedRange,
  isUsStock
}: { 
  symbol: string; 
  currentPrice: number;
  selectedRange: string;
  isUsStock?: boolean;
}) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch initial history
  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/history?symbol=${symbol}&range=${selectedRange}`);
        const data = await response.json();
        if (Array.isArray(data)) {
          setHistory(data.map(d => ({
            time: Math.floor(new Date(d.fullTime).getTime() / 1000),
            value: d.price
          })));
        }
      } catch (e) {
        console.error('Failed to fetch history', e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, [symbol, selectedRange]);

  // Sync current price to chart
  useEffect(() => {
    if (seriesRef.current && currentPrice) {
      const now = Math.floor(Date.now() / 1000);
      seriesRef.current.update({
        time: now as any,
        value: currentPrice
      });
    }
  }, [currentPrice]);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#94a3b8',
        fontSize: 10,
        fontFamily: 'Inter',
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { color: '#f1f5f9' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 256,
      handleScale: true,
      handleScroll: true,
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderVisible: false,
        autoScale: true,
      },
    });

    const series = chart.addSeries(LineSeries, {
      color: '#06b6d4',
      lineWidth: 3,
      crosshairMarkerVisible: true,
      priceFormat: {
        type: 'price',
        precision: isUsStock ? 2 : 0,
        minMove: isUsStock ? 0.01 : 1,
      },
    });

    chartRef.current = chart;
    seriesRef.current = series;

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [isUsStock]);

  useEffect(() => {
    if (seriesRef.current && history.length > 0) {
      // Sort and filter duplicate timestamps (Lightweight charts requirement)
      const sortedHistory = [...history].sort((a, b) => a.time - b.time);
      const uniqueHistory = sortedHistory.filter((item, index, self) => 
        index === 0 || item.time > self[index - 1].time
      );
      
      seriesRef.current.setData(uniqueHistory);
      chartRef.current?.timeScale().fitContent();
    }
  }, [history]);

  return (
    <div className="space-y-4">
      {/* Main Chart */}
      <div className="h-64 w-full relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50/50 rounded-xl z-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
          </div>
        )}
        <div ref={chartContainerRef} className="w-full h-full" />
      </div>
    </div>
  );
}

function OrderBook({ symbol, livePrice }: { symbol: string; livePrice?: number }) {
  const [data, setData] = useState<{ bids: any[], asks: any[] }>({ bids: [], asks: [] });
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<'price' | 'amount'>('price');
  const [layoutMode, setLayoutMode] = useState<'split' | 'stacked'>('split');
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const socketRef = React.useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Throttling for rapid real-time order book updates
  const lastUpdateRef = React.useRef<{ bids: any[], asks: any[] } | null>(null);
  const throttleTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const commitOrderBook = () => {
      if (lastUpdateRef.current) {
        setData(lastUpdateRef.current);
        setLoading(false);
        lastUpdateRef.current = null;
      }
    };

    // Initial fetch to get the data immediately
    const fetchInitial = async () => {
      try {
        const res = await fetch(`/api/orderbook?symbol=${symbol}`);
        const ob = await res.json();
        setData(ob);
        setLoading(false);
      } catch (e) {
        console.error('Initial orderbook fetch failed', e);
        setLoading(false);
      }
    };
    
    fetchInitial();

    const connect = () => {
      if (socketRef.current) {
        socketRef.current.close();
      }

      setConnectionStatus('connecting');
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const socket = new WebSocket(`${protocol}//${host}`);
      socketRef.current = socket;

      socket.onopen = () => {
        setConnectionStatus('connected');
        socket.send(JSON.stringify({
          type: 'SUBSCRIBE_ORDERBOOK',
          symbol
        }));
      };

      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'ORDERBOOK_UPDATE' && message.symbol === symbol) {
            lastUpdateRef.current = { bids: message.bids, asks: message.asks };
            if (!throttleTimeoutRef.current) {
              throttleTimeoutRef.current = setTimeout(() => {
                commitOrderBook();
                throttleTimeoutRef.current = null;
              }, 400); // Flush updates to state every 400ms
            }
          }
        } catch (e) {
          // Ignore parsing errors
        }
      };

      socket.onclose = () => {
        setConnectionStatus('disconnected');
        reconnectTimeoutRef.current = setTimeout(connect, 3000);
      };

      socket.onerror = () => {
        setConnectionStatus('disconnected');
        socket.close();
      };
    };

    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (throttleTimeoutRef.current) {
        clearTimeout(throttleTimeoutRef.current);
      }
      if (socketRef.current) {
        if (socketRef.current.readyState === WebSocket.OPEN) {
          socketRef.current.send(JSON.stringify({
            type: 'UNSUBSCRIBE_ORDERBOOK',
            symbol
          }));
        }
        socketRef.current.onclose = null; // Prevent reconnection on intentional close
        socketRef.current.close();
      }
    };
  }, [symbol]);

  // Adjust orderbook price ticks when the main ticker changes to guarantee lag-free live motion!
  useEffect(() => {
    if (!livePrice || loading || data.asks.length === 0 || data.bids.length === 0) return;
    
    setData(prev => {
      const highestBid = prev.bids[0]?.price;
      const lowestAsk = prev.asks[prev.asks.length - 1]?.price || prev.asks[0]?.price;
      if (!highestBid || !lowestAsk) return prev;
      
      const currentMid = (highestBid + lowestAsk) / 2;
      const gapRatio = livePrice / currentMid;
      
      // Let's only update if the shift is reasonable and not massive
      if (Math.abs(gapRatio - 1) > 0.1 || gapRatio === 1) return prev;

      const adjustedBids = prev.bids.map(b => ({ ...b, price: b.price * gapRatio }));
      const adjustedAsks = prev.asks.map(a => ({ ...a, price: a.price * gapRatio }));
      return { bids: adjustedBids, asks: adjustedAsks };
    });
  }, [livePrice]);

  const processOrders = (orders: any[], isAsk: boolean) => {
    const sorted = [...orders].sort((a, b) => {
      if (sortKey === 'price') return isAsk ? a.price - b.price : b.price - a.price;
      return b.amount - a.amount;
    });

    let cumulative = 0;
    const processed = sorted.slice(0, 10).map(order => {
      cumulative += order.amount;
      return { ...order, cumulative };
    });

    const maxCumulative = processed.length > 0 ? Math.max(...processed.map(p => p.cumulative)) : 1;
    
    return processed.map(p => ({
      ...p,
      depthPercent: (p.cumulative / maxCumulative) * 100
    }));
  };

  const asksWithDepth = useMemo(() => processOrders(data.asks, true), [data.asks, sortKey]);
  const bidsWithDepth = useMemo(() => processOrders(data.bids, false), [data.bids, sortKey]);

  // Real-time calculated Spread
  const spreadInfo = useMemo(() => {
    if (data.bids.length === 0 || data.asks.length === 0) return { val: 0, pct: 0 };
    const highestBid = Math.max(...data.bids.map(b => b.price));
    const lowestAsk = Math.min(...data.asks.map(a => a.price));
    const val = lowestAsk - highestBid;
    const pct = (val / lowestAsk) * 100;
    return { val, pct };
  }, [data]);

  const formatPrice = (p: number) => {
    if (p >= 1000) {
      return p.toLocaleString('id-ID', { maximumFractionDigits: 0 });
    }
    return p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  };

  const formatSize = (s: number) => {
    if (s >= 1000) return s.toLocaleString('id-ID', { maximumFractionDigits: 2 });
    return s.toFixed(4);
  };

  // Stacked view prefers asks sorted descending (highest price on top, lowest closest to the center)
  const displayedAsksStacked = useMemo(() => {
    return [...asksWithDepth].reverse();
  }, [asksWithDepth]);

  const displayedAsksSplit = useMemo(() => {
    return sortKey === 'price' ? [...asksWithDepth].reverse() : asksWithDepth;
  }, [asksWithDepth, sortKey]);

  return (
    <div className="mt-8 bg-slate-900/60 rounded-[30px] p-6 border border-slate-800 shadow-xl relative overflow-hidden backdrop-blur-md">
      {/* Glow background */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-3xl rounded-full" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full" />

      {/* Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400 animate-pulse" /> Live Order Book
            </h3>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-950 border border-slate-800">
              <div className={`w-1.5 h-1.5 rounded-full ${
                connectionStatus === 'connected' ? 'bg-emerald-400 animate-pulse' : 
                connectionStatus === 'connecting' ? 'bg-amber-400 animate-bounce' : 'bg-rose-400'
              }`} />
              <span className={`text-[8px] font-black uppercase tracking-tighter ${
                connectionStatus === 'connected' ? 'text-emerald-400' : 'text-slate-500'
              }`}>
                {connectionStatus}
              </span>
            </div>
          </div>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-1">Real-time market depths with cumulative sum</p>
        </div>

        {/* View Layout Selector and Sort Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Sorting Toggles */}
          <div className="flex bg-slate-950 border border-slate-800 p-0.5 rounded-xl">
            <button 
              onClick={() => setSortKey('price')}
              className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${sortKey === 'price' ? 'bg-cyan-500 text-slate-950 shadow-sm font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              Price
            </button>
            <button 
              onClick={() => setSortKey('amount')}
              className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${sortKey === 'amount' ? 'bg-cyan-500 text-slate-950 shadow-sm font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              Size
            </button>
          </div>

          {/* Layout Mode Toggles */}
          <div className="flex bg-slate-950 border border-slate-800 p-0.5 rounded-xl">
            <button 
              onClick={() => setLayoutMode('split')}
              className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${layoutMode === 'split' ? 'bg-indigo-600 font-bold text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
            >
              Split
            </button>
            <button 
              onClick={() => setLayoutMode('stacked')}
              className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${layoutMode === 'stacked' ? 'bg-indigo-600 font-bold text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
            >
              Stacked
            </button>
          </div>
        </div>
      </div>

      {loading && data.bids.length === 0 ? (
        <div className="h-52 flex flex-col items-center justify-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400" />
          <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest block animate-pulse">Awaiting feed stream...</span>
        </div>
      ) : (
        <div className="relative z-10 transition-all duration-300">
          {layoutMode === 'split' ? (
            /* Split (Side-by-Side) Layout */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950 rounded-2xl overflow-hidden border border-slate-800/85 p-3">
              {/* Asks (Sells - Red Theme) */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase tracking-widest px-2 pb-2">
                  <span>Asks Price</span>
                  <div className="flex gap-4">
                    <span>Size</span>
                    <span className="text-right w-16">Sum</span>
                  </div>
                </div>
                
                <div className="space-y-0.5 max-h-[240px] overflow-y-auto">
                  {displayedAsksSplit.map((ask, i) => (
                    <div key={i} className="relative group overflow-hidden rounded-md px-2 py-1 transition-all hover:bg-slate-800/40">
                      {/* Red depth bar behind text */}
                      <div 
                        className="absolute inset-y-0 right-0 bg-rose-500/5 transition-all duration-300" 
                        style={{ width: `${ask.depthPercent}%` }}
                      />
                      <div className="relative flex justify-between items-center text-[11px] font-mono">
                        <span className="text-rose-400 font-bold">
                          {formatPrice(ask.price)}
                        </span>
                        <div className="flex items-center gap-4">
                          <span className="text-slate-300">
                            {formatSize(ask.amount)}
                          </span>
                          <span className="text-slate-500 text-[10px] text-right w-16">
                            {formatSize(ask.cumulative)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bids (Buys - Green Theme) */}
              <div className="space-y-1 border-t md:border-t-0 md:border-l border-slate-900 pt-3 md:pt-0 md:pl-3">
                <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase tracking-widest px-2 pb-2">
                  <span>Bids Price</span>
                  <div className="flex gap-4">
                    <span>Size</span>
                    <span className="text-right w-16">Sum</span>
                  </div>
                </div>

                <div className="space-y-0.5 max-h-[240px] overflow-y-auto w-full">
                  {bidsWithDepth.map((bid, i) => (
                    <div key={i} className="relative group overflow-hidden rounded-md px-2 py-1 transition-all hover:bg-slate-800/40">
                      {/* Green depth bar behind text */}
                      <div 
                        className="absolute inset-y-0 left-0 bg-emerald-500/5 transition-all duration-300" 
                        style={{ width: `${bid.depthPercent}%` }}
                      />
                      <div className="relative flex justify-between items-center text-[11px] font-mono">
                        <span className="text-emerald-400 font-bold">
                          {formatPrice(bid.price)}
                        </span>
                        <div className="flex items-center gap-4">
                          <span className="text-slate-300">
                            {formatSize(bid.amount)}
                          </span>
                          <span className="text-slate-500 text-[10px] text-right w-16">
                            {formatSize(bid.cumulative)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Stacked Layout style (Binance Premium Style) */
            <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4 space-y-4">
              {/* Header column labels */}
              <div className="grid grid-cols-3 text-[10px] font-black text-slate-500 uppercase tracking-widest px-3">
                <span>Price</span>
                <span className="text-right">Size</span>
                <span className="text-right">Sum (Cumulative)</span>
              </div>

              {/* Top Block: Sellers (Asks) - Displayed custom top down to lowest ask */}
              <div className="space-y-0.5 max-h-[170px] overflow-y-auto">
                {displayedAsksStacked.map((ask, i) => (
                  <div key={i} className="relative group overflow-hidden rounded-md px-3 py-1 transition-all hover:bg-slate-800/40">
                    <div 
                      className="absolute inset-y-0 right-0 bg-rose-500/5 transition-all duration-300" 
                      style={{ width: `${ask.depthPercent}%` }}
                    />
                    <div className="grid grid-cols-3 relative text-[11px] font-mono items-center">
                      <span className="text-rose-400 font-bold">{formatPrice(ask.price)}</span>
                      <span className="text-slate-300 text-right">{formatSize(ask.amount)}</span>
                      <span className="text-slate-500 text-right">{formatSize(ask.cumulative)}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Mid Panel: Last Trade Price & Spread */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-400 font-mono uppercase tracking-widest">Last Price:</span>
                  <span className={`text-sm sm:text-base font-black font-mono transition-all ${
                    livePrice ? 'text-cyan-400 scale-105 animate-pulse' : 'text-white'
                  }`}>
                    {livePrice ? formatPrice(livePrice) : (data.bids[0] ? formatPrice(data.bids[0].price) : 'No Price')}
                  </span>
                </div>
                
                {spreadInfo.val > 0 && (
                  <div className="flex items-center gap-1.5 text-[10px] bg-slate-950 border border-slate-850 px-2.5 py-1 rounded-lg">
                    <span className="text-slate-500 font-bold font-mono">SPREAD:</span>
                    <span className="text-indigo-400 font-black font-mono">{formatPrice(spreadInfo.val)}</span>
                    <span className="text-slate-600">({spreadInfo.pct.toFixed(2)}%)</span>
                  </div>
                )}
              </div>

              {/* Bottom Block: Buyers (Bids) */}
              <div className="space-y-0.5 max-h-[170px] overflow-y-auto">
                {bidsWithDepth.map((bid, i) => (
                  <div key={i} className="relative group overflow-hidden rounded-md px-3 py-1 transition-all hover:bg-slate-800/40">
                    <div 
                      className="absolute inset-y-0 left-0 bg-emerald-500/5 transition-all duration-300" 
                      style={{ width: `${bid.depthPercent}%` }}
                    />
                    <div className="grid grid-cols-3 relative text-[11px] font-mono items-center">
                      <span className="text-emerald-400 font-bold">{formatPrice(bid.price)}</span>
                      <span className="text-slate-300 text-right">{formatSize(bid.amount)}</span>
                      <span className="text-slate-500 text-right">{formatSize(bid.cumulative)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function LiveMarket({ prices, loading }: { prices: any; loading: boolean }) {
  const [expandedSymbol, setExpandedSymbol] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('Trending');
  const [selectedRange, setSelectedRange] = useState('24h');
  const [watchlist, setWatchlist] = useState<string[]>(() => {
    const saved = localStorage.getItem('crypto_watchlist');
    return saved ? JSON.parse(saved) : [];
  });

  const tabs = ['Crypto', 'Watchlist'];
  const [activeCategory, setActiveCategory] = useState<'Crypto' | 'IDX' | 'US'>('Crypto');
  const ranges = ['24h', '7d', '1m', '1y'];

  const idxStocks: any[] = [
    { symbol: 'BBCA', name: 'BCA', price: 0, change: 0, sentiment: 85, logo: 'https://logo.clearbit.com/bca.co.id', mktCap: '0', volume: '0' },
    { symbol: 'BBRI', name: 'BRI', price: 0, change: 0, sentiment: 82, logo: 'https://logo.clearbit.com/bri.co.id', mktCap: '0', volume: '0' },
    { symbol: 'TLKM', name: 'Telkom', price: 0, change: 0, sentiment: 75, logo: 'https://logo.clearbit.com/telkom.co.id', mktCap: '0', volume: '0' },
    { symbol: 'ASII', name: 'Astra', price: 0, change: 0, sentiment: 70, logo: 'https://logo.clearbit.com/astra.co.id', mktCap: '0', volume: '0' },
    { symbol: 'GOTO', name: 'GoTo', price: 0, change: 0, sentiment: 60, logo: 'https://logo.clearbit.com/gotocompany.com', mktCap: '0', volume: '0' },
    { symbol: 'BMRI', name: 'Mandiri', price: 0, change: 0, sentiment: 80, logo: 'https://logo.clearbit.com/bankmandiri.co.id', mktCap: '0', volume: '0' }
  ];

  const usStocks: any[] = [
    { symbol: 'NVDA', name: 'Nvidia', price: 0, change: 0, sentiment: 95, logo: 'https://logo.clearbit.com/nvidia.com', mktCap: '0', volume: '0' },
    { symbol: 'AAPL', name: 'Apple', price: 0, change: 0, sentiment: 88, logo: 'https://logo.clearbit.com/apple.com', mktCap: '0', volume: '0' },
    { symbol: 'MSFT', name: 'Microsoft', price: 0, change: 0, sentiment: 90, logo: 'https://logo.clearbit.com/microsoft.com', mktCap: '0', volume: '0' },
    { symbol: 'TSLA', name: 'Tesla', price: 0, change: 0, sentiment: 75, logo: 'https://logo.clearbit.com/tesla.com', mktCap: '0', volume: '0' },
    { symbol: 'GOOGL', name: 'Google', price: 0, change: 0, sentiment: 85, logo: 'https://logo.clearbit.com/google.com', mktCap: '0', volume: '0' }
  ];

  useEffect(() => {
    // We now rely on the websocket `prices` prop entirely for true real-time updates!
  }, []);

  const stockData = useMemo(() => {
    const data = activeCategory === 'IDX' ? idxStocks : usStocks;
    return data.map(s => {
       const symbolData = prices?.RAW?.[s.symbol]?.IDR;
       return {
          ...s,
          price: symbolData ? (activeCategory === 'IDX' ? symbolData.PRICE : symbolData.PRICE_USDT) : s.price,
          change: symbolData ? symbolData.CHANGEPCT24HOUR : s.change,
          mktCap: prices?.DISPLAY?.[s.symbol]?.IDR?.MKTCAP || '0',
          volume: prices?.DISPLAY?.[s.symbol]?.IDR?.VOLUME24HOUR || '0'
       };
    });
  }, [activeCategory, prices]);
  
  const toggleWatchlist = (e: React.MouseEvent, symbol: string) => {
    e.stopPropagation();
    const newWatchlist = watchlist.includes(symbol)
      ? watchlist.filter(s => s !== symbol)
      : [...watchlist, symbol];
    
    setWatchlist(newWatchlist);
    localStorage.setItem('crypto_watchlist', JSON.stringify(newWatchlist));
  };

  // Mock historical data for charts
  const getMockHistory = (range: string) => {
    const points = range === '24h' ? 24 : range === '7d' ? 7 : range === '1m' ? 30 : 12;
    const labelPrefix = range === '24h' ? 'h' : range === '7d' ? 'Day' : range === '1m' ? 'Day' : 'Month';
    
    return Array.from({ length: points }, (_, i) => ({
      time: `${labelPrefix} ${i + 1}`,
      price: Math.random() * 100 + 100
    }));
  };

  const allMarketData = useMemo(() => {
    let symbolsToIterate: string[] = [];
    if (activeCategory === 'Crypto') {
      symbolsToIterate = Object.keys(prices?.RAW || {}).filter(s => !stockData.some(stock => stock.symbol === s));
    } else {
      symbolsToIterate = stockData.map(s => s.symbol);
    }
    
    if (activeCategory !== 'Crypto' && loading) {
        return []; // Will handle in UI by showing skeleton
    }

    return symbolsToIterate.map(symbol => {
      const raw = prices?.RAW?.[symbol]?.IDR;
      const display = prices?.DISPLAY?.[symbol]?.IDR;
      
      const stockInfo = stockData.find(s => s.symbol === symbol);

      // Seeded random-ish value based on symbol characters so it is stable per symbol
      const seed = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const sentiment = (seed % 40) + 60;

      if (!raw || !display) {
        if (stockInfo) {
          // Fallback if data hasn't loaded yet
          return {
            symbol,
            price: activeCategory === 'IDX' ? `Rp ${stockInfo.price.toLocaleString('id-ID')}` : `$${stockInfo.price.toLocaleString('en-US')}`,
            change: stockInfo.change.toString(),
            marketCap: stockInfo.mktCap,
            volume: stockInfo.volume,
            isPositive: stockInfo.change >= 0,
            sentiment: stockInfo.sentiment,
            logoUrl: stockInfo.logo
          };
        }
        return null;
      }

      return {
        symbol,
        price: display.PRICE,
        change: parseFloat(display.CHANGEPCT24HOUR).toFixed(2),
        marketCap: display.MKTCAP || (stockInfo ? stockInfo.mktCap : 'N/A'),
        volume: display.VOLUME24HOUR || (stockInfo ? stockInfo.volume : 'N/A'),
        isPositive: parseFloat(display.CHANGEPCT24HOUR) >= 0,
        sentiment: stockInfo ? stockInfo.sentiment : sentiment, 
        logoUrl: stockInfo ? stockInfo.logo : (display.IMAGEURL ? `https://www.cryptocompare.com${display.IMAGEURL}` : null)
      };
    }).filter(Boolean);
  }, [prices, activeCategory, stockData]);

  const marketData = activeTab === 'Watchlist' 
    ? allMarketData.filter(item => watchlist.includes(item.symbol))
    : allMarketData;

  const allSymbols = allMarketData.map(d => d.symbol);

  return (
    <section className="pb-10 pt-2 px-2">
      <div className="flex justify-between items-center mb-6">
          <div className="flex flex-col">
            <h2 className="text-2xl font-black tracking-tighter text-white font-sans">Market Assets</h2>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
              {activeCategory === 'Crypto' ? 'Real-time data from Binance Global' : activeCategory === 'IDX' ? 'Indonesia Stock Exchange' : 'Global US Markets'}
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-1.5 bg-slate-900 rounded-full border border-slate-800 shadow-lg shadow-black/20">
             <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
             <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
               {activeCategory === 'Crypto' ? 'LIVE • BINANCE' : activeCategory === 'IDX' ? 'LIVE • IDX' : 'LIVE • NASDAQ'}
             </span>
          </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8 px-2">
          <div className="bg-slate-900 justify-between flex flex-col p-4 rounded-[24px] border border-slate-800 shadow-lg shadow-black/20 group hover:border-cyan-500/50 transition-all">
            <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">IHSG (IDX)</div>
            <div className="flex items-end justify-between">
              <span className="text-xl font-black text-white group-hover:text-cyan-100 tracking-tight transition-colors">
                {prices?.RAW?.IHSG?.IDR?.PRICE?.toLocaleString('id-ID', { maximumFractionDigits: 2 }) || '7,234.12'}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${parseFloat(prices?.DISPLAY?.IHSG?.IDR?.CHANGEPCT24HOUR || '0') >= 0 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-rose-400 bg-rose-500/10 border-rose-500/20'}`}>
                {parseFloat(prices?.DISPLAY?.IHSG?.IDR?.CHANGEPCT24HOUR || '0') >= 0 ? '+' : ''}{prices?.DISPLAY?.IHSG?.IDR?.CHANGEPCT24HOUR || '0.42'}%
              </span>
            </div>
          </div>
          <div className="bg-slate-900 justify-between flex flex-col p-4 rounded-[24px] border border-slate-800 shadow-lg shadow-black/20 group hover:border-cyan-500/50 transition-all">
            <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">S&P 500</div>
            <div className="flex items-end justify-between">
              <span className="text-xl font-black text-white group-hover:text-cyan-100 tracking-tight transition-colors">
                {prices?.RAW?.SP500?.IDR?.PRICE?.toLocaleString('en-US', { maximumFractionDigits: 2 }) || '5,123.34'}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${parseFloat(prices?.DISPLAY?.SP500?.IDR?.CHANGEPCT24HOUR || '0') >= 0 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-rose-400 bg-rose-500/10 border-rose-500/20'}`}>
                {parseFloat(prices?.DISPLAY?.SP500?.IDR?.CHANGEPCT24HOUR || '0') >= 0 ? '+' : ''}{prices?.DISPLAY?.SP500?.IDR?.CHANGEPCT24HOUR || '1.12'}%
              </span>
            </div>
          </div>
          <div className="bg-slate-900 justify-between flex flex-col p-4 rounded-[24px] border border-slate-800 shadow-lg shadow-black/20 group hover:border-cyan-500/50 transition-all">
            <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">USD/IDR</div>
            <div className="flex items-end justify-between">
              <span className="text-xl font-black text-white group-hover:text-cyan-100 tracking-tight transition-colors">
                {prices?.RAW?.USDT?.IDR?.PRICE?.toLocaleString('id-ID', { maximumFractionDigits: 0 }) || '16,150'}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${parseFloat(prices?.DISPLAY?.USDT?.IDR?.CHANGEPCT24HOUR || '0') >= 0 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-rose-400 bg-rose-500/10 border-rose-500/20'}`}>
                {parseFloat(prices?.DISPLAY?.USDT?.IDR?.CHANGEPCT24HOUR || '0') >= 0 ? '+' : ''}{prices?.DISPLAY?.USDT?.IDR?.CHANGEPCT24HOUR || '-0.15'}%
              </span>
            </div>
          </div>
          <div className="bg-slate-900 justify-between flex flex-col p-4 rounded-[24px] border border-slate-800 shadow-lg shadow-black/20 group hover:border-cyan-500/50 transition-all">
            <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Activity className="w-3 h-3 text-cyan-400" /> 24h Vol
            </div>
            <div className="flex items-end justify-between">
              <span className="text-xl font-black text-white group-hover:text-cyan-100 tracking-tight transition-colors">$2.4B</span>
              <span className="text-[10px] font-bold text-slate-500">Stable</span>
            </div>
          </div>
      </div>

      <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-none px-2">
        {tabs.map(tab => (
            <button 
              key={tab} 
              onClick={() => {
                setActiveTab(tab);
                if (tab === 'Crypto') setActiveCategory('Crypto');
                if (tab === 'Indonesian Stocks') setActiveCategory('IDX');
                if (tab === 'US Stocks') setActiveCategory('US');
              }}
              className={`px-6 py-3 rounded-[20px] text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all ${tab === activeTab ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20' : 'bg-slate-800 border-transparent text-slate-400 hover:text-white border hover:border-slate-700'}`}
            >
                {tab}
                {tab === 'Watchlist' && watchlist.length > 0 && (
                  <span className={`ml-2 px-2 py-0.5 rounded-md text-[10px] ${tab === activeTab ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-900 text-cyan-400'}`}>{watchlist.length}</span>
                )}
            </button>
        ))}
      </div>

      <div className="bg-slate-900 rounded-[32px] p-2 shadow-2xl border border-slate-800 min-h-[300px] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-2 lg:gap-0">
        {!prices && activeCategory !== 'Crypto' ? (
          <div className="p-8"><StockPriceSkeleton /></div>
        ) : marketData.length > 0 ? marketData.map((item, index) => {
            const isExpanded = expandedSymbol === item.symbol;
            const isWatched = watchlist.includes(item.symbol);
      const isUsStock = usStocks.some(s => s.symbol === item.symbol);
            return (
                <div 
                  key={item.symbol} 
                  className={`group transition-all duration-300 ${isExpanded ? 'bg-slate-800/80 rounded-[28px] mb-2 shadow-lg border border-slate-700' : 'border border-transparent'}`}
                >
                    <div 
                      onClick={() => setExpandedSymbol(isExpanded ? null : item.symbol)}
                      className={`flex justify-between items-center p-5 cursor-pointer hover:bg-slate-800/50 rounded-[24px] transition-colors ${index !== marketData.length - 1 && !isExpanded ? 'border-b border-slate-800/50' : ''}`}
                    >
                        <div className="flex items-center gap-4">
                            <button 
                              onClick={(e) => toggleWatchlist(e, item.symbol)}
                              className={`p-2 rounded-xl transition-colors ${isWatched ? 'text-amber-400 bg-amber-500/10' : 'text-slate-600 hover:text-slate-400 hover:bg-slate-800'}`}
                            >
                              {isWatched ? <Star className="w-4 h-4 fill-current" /> : <StarOff className="w-4 h-4" />}
                            </button>
                            <div className={`p-2.5 rounded-[18px] transition-all flex items-center justify-center overflow-hidden w-12 h-12 shadow-inner border ${isExpanded ? 'bg-cyan-500 text-slate-950 border-cyan-400' : 'bg-slate-800 text-cyan-400 border-slate-700'}`}>
                              {item.logoUrl ? (
                                <img src={item.logoUrl} alt={item.symbol} className="w-10 h-10 object-contain drop-shadow" referrerPolicy="no-referrer" />
                              ) : (
                                <span className="font-black text-xs">{item.symbol.substring(0, 2)}</span>
                              )}
                            </div>
                            <div>
                                <div className="font-bold text-white text-base leading-tight">{item.symbol}</div>
                                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">MCap: {item.marketCap}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-5">
                            <div className="text-right flex flex-col items-end">
                                <div className="font-black text-white text-[15px] tracking-tight">{item.price}</div>
                                <div className={`text-[11px] font-black flex items-center justify-end gap-1 mt-1 px-2 py-0.5 rounded-md border ${item.isPositive ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-rose-400 bg-rose-500/10 border-rose-500/20'}`}>
                                  {item.isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                                  {item.isPositive ? '+' : ''}{item.change}%
                                </div>
                            </div>
                            <div className={`p-2 rounded-[14px] bg-slate-800 border border-slate-700 transition-colors ${isExpanded ? 'bg-slate-700 border-slate-600' : ''}`}>
                                {isExpanded ? <ChevronUp className="w-4 h-4 text-cyan-400" /> : <ChevronDown className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />}
                            </div>
                        </div>
                    </div>

                    {isExpanded && (
                        <div className="overflow-hidden bg-slate-900 border-t border-slate-700/50 rounded-b-[28px]">
                                <div className="px-5 pb-6 pt-4">
                                    {/* Time Range Selector */}
                                    <div className="flex gap-2 mb-4">
                                        {ranges.map(range => (
                                            <button
                                                key={range}
                                                onClick={() => setSelectedRange(range)}
                                                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                                                    selectedRange === range 
                                                    ? 'bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/20' 
                                                    : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-500 hover:text-white'
                                                }`}
                                            >
                                                {range}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Interactive Chart Area */}
                                    <AnalysisChart 
                                      symbol={item.symbol} 
                                      currentPrice={isUsStock ? (prices?.RAW?.[item.symbol]?.IDR?.PRICE_USDT || 0) : (prices?.RAW?.[item.symbol]?.IDR?.PRICE || 0)}
                                      selectedRange={selectedRange}
                                      isUsStock={isUsStock}
                                    />

                                    {/* Detailed Metrics */}
                                    <div className="grid grid-cols-2 gap-4 mt-6">
                                        <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 shadow-inner">
                                            <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase mb-2">
                                                <Activity className="w-3.5 h-3.5" /> 24h Volume
                                            </div>
                                            <div className="font-bold text-white text-lg">{item.volume}</div>
                                        </div>
                                        <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 shadow-inner">
                                            <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase mb-2">
                                                <Users className="w-3.5 h-3.5" /> Sentiment
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 h-1.5 bg-slate-900 rounded-full overflow-hidden shadow-inner flex">
                                                    <div 
                                                      className="h-full bg-cyan-500 rounded-full" 
                                                      style={{ width: `${item.sentiment}%` }}
                                                    />
                                                </div>
                                                <span className="font-black text-cyan-400 text-xs">{item.sentiment}%</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Order Book Section */}
                                    <OrderBook symbol={item.symbol} livePrice={prices?.RAW?.[item.symbol]?.IDR?.PRICE} />

                                    <div className="mt-6 flex gap-3">
                                        <button className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-cyan-500/20 text-sm tracking-tight transition-transform active:scale-95">Trade {item.symbol}</button>
                                        <button className="p-4 bg-slate-800 border border-slate-700 rounded-2xl hover:border-cyan-400 transition-colors">
                                            <BarChart3 className="w-5 h-5 text-cyan-400" />
                                        </button>
                                    </div>
                                </div>
                      </div>
                    )}
                </div>
            );
        }) : (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6 shadow-inner border border-slate-700">
              <Star className="w-10 h-10 text-slate-600" />
            </div>
            <h3 className="font-black text-white text-lg mb-1 tracking-tight">Watchlist Empty</h3>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest max-w-[200px] mt-2">Tap the star next to any asset</p>
          </div>
        )}
      </div>
    </section>
  );
}
