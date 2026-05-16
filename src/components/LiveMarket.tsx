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

// Sub-component for the interactive chart
function AnalysisChart({ 
  symbol, 
  currentPrice,
  selectedRange,
  allSymbols 
}: { 
  symbol: string; 
  currentPrice: number;
  selectedRange: string;
  allSymbols: string[] 
}) {
  const [tool, setTool] = useState<'none' | 'trendline' | 'annotation'>('none');
  const [trendlines, setTrendlines] = useState<any[]>([]);
  const [annotations, setAnnotations] = useState<any[]>([]);
  const [compareSymbol, setCompareSymbol] = useState<string | null>(null);
  const [drawStep, setDrawStep] = useState<number>(0);
  const [tempLine, setTempLine] = useState<any | null>(null);
  const [brushRange, setBrushRange] = useState<{ start?: number; end?: number }>({});
  
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Persistence logic
  const saveAnalysis = () => {
    const data = { trendlines, annotations };
    localStorage.setItem(`analysis_${symbol}`, JSON.stringify(data));
  };

  const loadAnalysis = () => {
    const saved = localStorage.getItem(`analysis_${symbol}`);
    if (saved) {
      try {
        const { trendlines: savedLines, annotations: savedAnnos } = JSON.parse(saved);
        setTrendlines(savedLines || []);
        setAnnotations(savedAnnos || []);
      } catch (e) {
        console.error('Failed to parse saved analysis', e);
      }
    } else {
      setTrendlines([]);
      setAnnotations([]);
    }
  };

  // Load saved drawings on component mount or symbol change
  useEffect(() => {
    loadAnalysis();
  }, [symbol]);

  // Fetch initial history
  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/history?symbol=${symbol}&range=${selectedRange}`);
        const data = await response.json();
        setHistory(data);
      } catch (e) {
        console.error('Failed to fetch history', e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, [symbol, selectedRange]);

  // Append live updates to history
  useEffect(() => {
    if (history.length > 0 && currentPrice) {
      const lastPoint = history[history.length - 1];
      // Only add if price actually changed by more than 0.001% to avoid noise
      const priceDiff = Math.abs(lastPoint.price - currentPrice) / lastPoint.price;
      if (priceDiff > 0.00001) {
        const now = new Date();
        const newPoint = {
          time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          fullTime: now.toLocaleString(),
          price: currentPrice
        };
        setHistory(prev => {
          // Double check the last point in the functional update to be safe
          if (prev.length > 0 && prev[prev.length - 1].price === currentPrice) return prev;
          return [...prev.slice(-49), newPoint];
        });
      }
    }
  }, [currentPrice]);

  // Mock comparison history tracking live as well
  const compareHistory = useMemo(() => {
    if (!compareSymbol || history.length === 0) return null;
    return history.map((h, i) => ({
      ...h,
      // Use a deterministic seed (index) for mock comparison to avoid random junk every render
      comparePrice: (h.price * 0.8) + (Math.sin(i) * h.price * 0.05)
    }));
  }, [compareSymbol, history]);

  const [selectedLineId, setSelectedLineId] = useState<string | null>(null);
  const [dragInfo, setDragInfo] = useState<{ id: string, type: 'start' | 'end', lastX: string, lastY: number } | null>(null);
  const lastClickRef = useRef<number>(0);

  const priceRange = useMemo(() => {
    if (history.length === 0) return 0;
    const prices = history.map(h => h.price);
    return Math.max(...prices) - Math.min(...prices) || 100;
  }, [history]);

  const findLineAtPosition = (x: string, y: number) => {
    // Thresholds for selection
    const yThreshold = priceRange * 0.05; 
    
    for (const line of trendlines) {
      const dist1 = Math.sqrt(Math.pow(history.findIndex(h => h.time === line.x1) - history.findIndex(h => h.time === x), 2) + Math.pow((line.y1 - y) / priceRange * 10, 2));
      const dist2 = Math.sqrt(Math.pow(history.findIndex(h => h.time === line.x2) - history.findIndex(h => h.time === x), 2) + Math.pow((line.y2 - y) / priceRange * 10, 2));
      
      if (dist1 < 1) return { id: line.id, type: 'start' as const };
      if (dist2 < 1) return { id: line.id, type: 'end' as const };
      
      // Basic segment check could be added here but endpoint is usually enough for selection
    }
    return null;
  };

  const handleMouseDown = (state: any) => {
    if (!state || !state.activeLabel || !state.activePayload || tool !== 'none') return;

    const x = state.activeLabel;
    const y = state.activePayload[0].value;
    const target = findLineAtPosition(x, y);

    if (target) {
      setSelectedLineId(target.id);
      setDragInfo({ ...target, lastX: x, lastY: y });
    } else {
      setSelectedLineId(null);
    }
  };

  const handleMouseMove = (state: any) => {
    if (!state || !state.activeLabel || !state.activePayload || !dragInfo) return;

    const x = state.activeLabel;
    const y = state.activePayload[0].value;

    setTrendlines(prev => prev.map(line => {
      if (line.id === dragInfo.id) {
        if (dragInfo.type === 'start') {
          return { ...line, x1: x, y1: y };
        } else {
          return { ...line, x2: x, y2: y };
        }
      }
      return line;
    }));
  };

  const handleMouseUp = () => {
    if (dragInfo) {
      setDragInfo(null);
      saveAnalysis();
    }
  };

  const handleDoubleClick = (state: any) => {
    if (!state || !state.activeLabel || !state.activePayload) return;
    
    const x = state.activeLabel;
    const y = state.activePayload[0].value;
    const target = findLineAtPosition(x, y);

    if (target) {
      setTrendlines(prev => prev.filter(l => l.id !== target.id));
      setSelectedLineId(null);
      setTimeout(saveAnalysis, 0);
    }
  };

  const handleChartClick = (state: any) => {
    if (!state || !state.activeLabel || !state.activePayload) return;

    if (tool === 'trendline') {
      const activePoint = {
        time: state.activeLabel,
        price: state.activePayload[0].value
      };

      if (drawStep === 0) {
        setTempLine({ x1: activePoint.time, y1: activePoint.price });
        setDrawStep(1);
      } else {
        setTrendlines([...trendlines, {
          id: Date.now().toString(),
          x1: tempLine.x1,
          y1: tempLine.y1,
          x2: activePoint.time,
          y2: activePoint.price
        }]);
        setTempLine(null);
        setDrawStep(0);
        setTool('none');
      }
    } else if (tool === 'annotation') {
      const text = prompt('Enter annotation text:');
      if (text) {
        setAnnotations([...annotations, {
          id: Date.now().toString(),
          x: state.activeLabel,
          y: state.activePayload[0].value,
          text
        }]);
      }
      setTool('none');
    }
  };

  return (
    <div className="space-y-4">
      {/* Tool Sidebar / Header */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button 
            onClick={() => setTool(tool === 'trendline' ? 'none' : 'trendline')}
            className={`p-2 rounded-lg transition-all ${tool === 'trendline' ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30' : 'bg-white border border-gray-100 text-gray-400 hover:text-cyan-500'}`}
            title="Draw Trendline"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setTool(tool === 'annotation' ? 'none' : 'annotation')}
            className={`p-2 rounded-lg transition-all ${tool === 'annotation' ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30' : 'bg-white border border-gray-100 text-gray-400 hover:text-cyan-500'}`}
            title="Add Annotation"
          >
            <StickyNote className="w-4 h-4" />
          </button>
          
          <div className="w-[1px] h-6 bg-gray-100 mx-1 self-center" />
          
          <button 
            onClick={saveAnalysis}
            className="p-2 rounded-lg bg-white border border-gray-100 text-gray-400 hover:text-cyan-600 transition-colors"
            title="Save Analysis"
          >
            <Save className="w-4 h-4" />
          </button>
          <button 
            onClick={loadAnalysis}
            className="p-2 rounded-lg bg-white border border-gray-100 text-gray-400 hover:text-cyan-600 transition-colors"
            title="Load Analysis"
          >
            <Download className="w-4 h-4" />
          </button>

          {(trendlines.length > 0 || annotations.length > 0) && (
            <button 
              onClick={() => { setTrendlines([]); setAnnotations([]); }}
              className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
              title="Clear All"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <button 
            onClick={() => setBrushRange({})}
            className="p-2 rounded-lg bg-white border border-gray-100 text-gray-400 hover:text-cyan-600 transition-colors"
            title="Reset Zoom"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Compare:</span>
          <select 
            value={compareSymbol || ''}
            onChange={(e) => setCompareSymbol(e.target.value || null)}
            className="bg-white border border-gray-100 rounded-lg px-2 py-1 text-[10px] font-bold text-gray-600 focus:outline-none focus:border-cyan-200"
          >
            <option value="">None</option>
            {allSymbols.filter(s => s !== symbol).map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {tool !== 'none' && (
        <div className="bg-cyan-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full inline-block animate-pulse">
          {tool === 'trendline' ? (drawStep === 0 ? 'Click starting point' : 'Click ending point') : 'Click chart to annotate'}
        </div>
      )}

      {/* Main Chart */}
      <div className="h-64 w-full relative group">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50/50 rounded-xl">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={compareHistory || history} 
              onClick={handleChartClick}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onDoubleClick={handleDoubleClick}
            >
            <XAxis dataKey="time" hide />
            <YAxis hide domain={['auto', 'auto']} />
            <Line 
              type="monotone" 
              dataKey="price" 
              stroke="#06b6d4" 
              strokeWidth={3} 
              dot={false}
              activeDot={{ r: 4, fill: '#06b6d4', stroke: '#fff', strokeWidth: 2 }}
              animationDuration={0} // Smoother during drags
            />
            {compareSymbol && (
              <Line 
                type="monotone" 
                dataKey="comparePrice" 
                stroke="#94a3b8" 
                strokeWidth={2} 
                strokeDasharray="5 5"
                dot={false}
                animationDuration={0}
              />
            )}
            
            {/* Render Trendlines */}
            {trendlines.map(line => (
              <React.Fragment key={line.id}>
                <ReferenceLine 
                  segment={[{ x: line.x1, y: line.y1 }, { x: line.x2, y: line.y2 }]} 
                  stroke={selectedLineId === line.id ? "#06b6d4" : "#f59e0b"} 
                  strokeWidth={selectedLineId === line.id ? 4 : 2} 
                  className="cursor-pointer"
                />
                {selectedLineId === line.id && (
                  <>
                    <ReferenceDot x={line.x1} y={line.y1} r={4} fill="#06b6d4" stroke="#fff" />
                    <ReferenceDot x={line.x2} y={line.y2} r={4} fill="#06b6d4" stroke="#fff" />
                  </>
                )}
              </React.Fragment>
            ))}

            {/* Render Annotations */}
            {annotations.map(anno => (
              <ReferenceDot 
                key={anno.id} 
                x={anno.x} 
                y={anno.y} 
                r={0} 
                label={{ 
                  position: 'top', 
                  value: anno.text, 
                  fill: '#0891b2', 
                  fontSize: 10, 
                  fontWeight: 'bold',
                }} 
              />
            ))}

            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white/90 backdrop-blur-sm p-3 rounded-xl border border-cyan-100 shadow-xl">
                      <div className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">{payload[0].payload.time}</div>
                      <div className="text-xs font-black text-gray-900">
                        {symbol}: Rp {payload[0].value?.toLocaleString('id-ID')}
                      </div>
                      {payload[1] && (
                        <div className="text-[10px] font-bold text-gray-400 mt-1">
                          {compareSymbol}: Rp {payload[1].value?.toLocaleString('id-ID')}
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Brush 
              dataKey="time" 
              height={30} 
              stroke="#06b6d4" 
              fill="rgba(6, 182, 212, 0.05)"
              startIndex={brushRange.start}
              endIndex={brushRange.end}
              onChange={(range) => setBrushRange(range)}
            />
          </LineChart>
        </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

function OrderBook({ symbol }: { symbol: string }) {
  const [data, setData] = useState<{ bids: any[], asks: any[] }>({ bids: [], asks: [] });
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<'price' | 'amount'>('price');
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const socketRef = React.useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Initial fetch to get the data immediately
    const fetchInitial = async () => {
      try {
        const res = await fetch(`/api/orderbook?symbol=${symbol}`);
        const ob = await res.json();
        setData(ob);
        setLoading(false);
      } catch (e) {
        console.error('Initial orderbook fetch failed', e);
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
            setData({ bids: message.bids, asks: message.asks });
            setLoading(false);
          }
        } catch (e) {
          // Ignore parsing errors
        }
      };

      socket.onclose = () => {
        setConnectionStatus('disconnected');
        // Reconnect after 3 seconds
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

  const processOrders = (orders: any[], isAsk: boolean) => {
    // For cumulative depth, asks should be sorted low-to-high, bids high-to-low
    const sorted = [...orders].sort((a, b) => {
      if (sortKey === 'price') return isAsk ? a.price - b.price : b.price - a.price;
      return b.amount - a.amount;
    });

    let cumulative = 0;
    const processed = sorted.slice(0, 12).map(order => {
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

  // Display asks top-down (highest price at top)
  const displayedAsks = sortKey === 'price' ? [...asksWithDepth].reverse() : asksWithDepth;

  return (
    <div className="mt-8 bg-white/50 backdrop-blur-sm rounded-3xl p-6 border border-white shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-500" /> Depth Chart
          </h3>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-gray-50 border border-gray-100">
            <div className={`w-1.5 h-1.5 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' : 
              connectionStatus === 'connecting' ? 'bg-yellow-500 animate-bounce' : 'bg-red-500'
            }`} />
            <span className="text-[8px] font-black uppercase tracking-tighter text-gray-400">
              {connectionStatus}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setSortKey('price')}
            className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${sortKey === 'price' ? 'bg-cyan-500 text-white shadow-sm' : 'bg-white text-gray-400 border border-gray-100 hover:border-cyan-100'}`}
          >
            Price
          </button>
          <button 
            onClick={() => setSortKey('amount')}
            className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${sortKey === 'amount' ? 'bg-cyan-500 text-white shadow-sm' : 'bg-white text-gray-400 border border-gray-100 hover:border-cyan-100'}`}
          >
            Size
          </button>
        </div>
      </div>

      {loading && data.bids.length === 0 ? (
        <div className="h-40 flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-px bg-gray-100/50 rounded-2xl overflow-hidden border border-gray-100">
          {/* Asks (Sell) */}
          <div className="bg-white p-2">
            <div className="grid grid-cols-2 text-[9px] font-black uppercase tracking-tighter text-gray-400 mb-2 px-2">
              <span>Price</span>
              <span className="text-right">Size</span>
            </div>
            {displayedAsks.map((ask, i) => (
              <div key={i} className="relative group overflow-hidden rounded-md my-0.5 px-2 py-1.5 transition-colors hover:bg-gray-50">
                <div 
                  className="absolute inset-y-0 right-0 bg-red-50 transition-all duration-500" 
                  style={{ width: `${ask.depthPercent}%`, opacity: 0.6 }}
                />
                <div className="relative flex justify-between text-[11px] font-mono">
                  <span className="text-red-500 font-bold">
                    {ask.price.toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                  </span>
                  <span className="text-gray-600 font-medium">
                    {ask.amount.toFixed(4)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Bids (Buy) */}
          <div className="bg-white p-2 border-l border-gray-100">
            <div className="grid grid-cols-2 text-[9px] font-black uppercase tracking-tighter text-gray-400 mb-2 px-2">
              <span>Price</span>
              <span className="text-right">Size</span>
            </div>
            {bidsWithDepth.map((bid, i) => (
              <div key={i} className="relative group overflow-hidden rounded-md my-0.5 px-2 py-1.5 transition-colors hover:bg-gray-50">
                <div 
                  className="absolute inset-y-0 left-0 bg-green-50 transition-all duration-500" 
                  style={{ width: `${bid.depthPercent}%`, opacity: 0.6 }}
                />
                <div className="relative flex justify-between text-[11px] font-mono">
                  <span className="text-green-500 font-bold">
                    {bid.price.toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                  </span>
                  <span className="text-gray-600 font-medium">
                    {bid.amount.toFixed(4)}
                  </span>
                </div>
              </div>
            ))}
          </div>
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

  const tabs = ['Trending', 'Watchlist', 'Gainers', 'Losers', 'New Coin'];
  const ranges = ['24h', '7d', '1m', '1y'];
  
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
    if (!prices?.RAW) return [];
    return Object.keys(prices.RAW).map(symbol => {
      const raw = prices.RAW[symbol].IDR;
      const display = prices.DISPLAY?.[symbol]?.IDR;
      if (!display) return null;

      // Seeded random-ish value based on symbol characters so it is stable per symbol
      const seed = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const sentiment = (seed % 40) + 60;

      return {
        symbol,
        price: display.PRICE,
        change: display.CHANGEPCT24HOUR,
        marketCap: display.MKTCAP,
        volume: display.VOLUME24HOUR || 'N/A',
        isPositive: parseFloat(display.CHANGEPCT24HOUR) >= 0,
        sentiment, 
        logoUrl: display.IMAGEURL ? `https://www.cryptocompare.com${display.IMAGEURL}` : null
      };
    }).filter(Boolean);
  }, [prices]);

  const marketData = activeTab === 'Watchlist' 
    ? allMarketData.filter(item => watchlist.includes(item.symbol))
    : allMarketData;

  const allSymbols = allMarketData.map(d => d.symbol);

  return (
    <section className="pb-10">
      <div className="flex justify-between items-center mb-6">
          <div className="flex flex-col">
            <h2 className="text-xl font-black tracking-tight text-gray-900 uppercase font-sans">Market Assets</h2>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Real-time data from Binance Global</p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-cyan-50 rounded-full border border-cyan-100 shadow-sm">
             <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
             <span className="text-[10px] font-black text-cyan-600 uppercase tracking-widest">LIVE • BINANCE</span>
          </div>
      </div>

      <div className="flex gap-4 mb-8 overflow-x-auto pb-2 scrollbar-none">
        {tabs.map(tab => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 rounded-2xl text-sm font-bold whitespace-nowrap transition-all ${tab === activeTab ? 'bg-[#06b6d4] text-white shadow-lg shadow-cyan-500/20' : 'bg-white border border-gray-100 text-gray-500 hover:border-cyan-100'}`}
            >
                {tab}
                {tab === 'Watchlist' && watchlist.length > 0 && (
                  <span className="ml-2 bg-white/20 px-1.5 py-0.5 rounded-md text-[10px]">{watchlist.length}</span>
                )}
            </button>
        ))}
      </div>

      <div className="bg-white rounded-[32px] p-2 shadow-sm border border-gray-50 min-h-[200px]">
        {marketData.length > 0 ? marketData.map((item, index) => {
            const isExpanded = expandedSymbol === item.symbol;
            const isWatched = watchlist.includes(item.symbol);
            return (
                <div 
                  key={item.symbol} 
                  className={`group transition-all duration-300 ${isExpanded ? 'bg-cyan-50/30 rounded-[24px] mb-2' : ''}`}
                >
                    <div 
                      onClick={() => setExpandedSymbol(isExpanded ? null : item.symbol)}
                      className={`flex justify-between items-center p-4 cursor-pointer hover:bg-gray-50/50 rounded-[20px] transition-colors ${index !== marketData.length - 1 && !isExpanded ? 'border-b border-gray-100' : ''}`}
                    >
                        <div className="flex items-center gap-4">
                            <button 
                              onClick={(e) => toggleWatchlist(e, item.symbol)}
                              className={`p-1.5 rounded-lg transition-colors ${isWatched ? 'text-yellow-400 bg-yellow-50' : 'text-gray-300 hover:text-gray-400 hover:bg-gray-100'}`}
                            >
                              {isWatched ? <Star className="w-4 h-4 fill-current" /> : <StarOff className="w-4 h-4" />}
                            </button>
                            <div className={`p-2 rounded-2xl transition-all flex items-center justify-center overflow-hidden w-12 h-12 ${isExpanded ? 'bg-cyan-500 text-white' : 'bg-cyan-50 text-cyan-600'}`}>
                              {item.logoUrl ? (
                                <img src={item.logoUrl} alt={item.symbol} className="w-8 h-8 object-contain" referrerPolicy="no-referrer" />
                              ) : (
                                <span className="font-black text-xs">{item.symbol.substring(0, 2)}</span>
                              )}
                            </div>
                            <div>
                                <div className="font-bold text-gray-900">{item.symbol}</div>
                                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Mkt Cap: {item.marketCap}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <div className="font-bold text-gray-900 text-sm">{item.price}</div>
                                <div className={`text-xs font-bold flex items-center justify-end gap-1 ${item.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                                  {item.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                  {item.isPositive ? '+' : ''}{item.change}%
                                </div>
                            </div>
                            {isExpanded ? <ChevronUp className="w-4 h-4 text-cyan-500" /> : <ChevronDown className="w-4 h-4 text-gray-300 group-hover:text-cyan-400" />}
                        </div>
                    </div>

                    {isExpanded && (
                        <div className="overflow-hidden">
                                <div className="px-5 pb-6 pt-2">
                                    {/* Time Range Selector */}
                                    <div className="flex gap-2 mb-4">
                                        {ranges.map(range => (
                                            <button
                                                key={range}
                                                onClick={() => setSelectedRange(range)}
                                                className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                                                    selectedRange === range 
                                                    ? 'bg-cyan-500 text-white shadow-sm shadow-cyan-500/20' 
                                                    : 'bg-white text-gray-400 border border-gray-100 hover:border-cyan-100'
                                                }`}
                                            >
                                                {range}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Interactive Chart Area */}
                                    <AnalysisChart 
                                      symbol={item.symbol} 
                                      currentPrice={prices?.RAW?.[item.symbol]?.IDR?.PRICE || 0}
                                      selectedRange={selectedRange}
                                      allSymbols={allSymbols}
                                    />

                                    {/* Detailed Metrics */}
                                    <div className="grid grid-cols-2 gap-4 mt-6">
                                        <div className="bg-white/60 p-4 rounded-2xl border border-white shadow-sm">
                                            <div className="flex items-center gap-2 text-gray-400 text-[10px] font-bold uppercase mb-1">
                                                <Activity className="w-3 h-3" /> 24h Volume
                                            </div>
                                            <div className="font-bold text-gray-900">{item.volume}</div>
                                        </div>
                                        <div className="bg-white/60 p-4 rounded-2xl border border-white shadow-sm">
                                            <div className="flex items-center gap-2 text-gray-400 text-[10px] font-bold uppercase mb-1">
                                                <Users className="w-3 h-3" /> Social Sentiment
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                    <div 
                                                      className="h-full bg-cyan-500 rounded-full" 
                                                      style={{ width: `${item.sentiment}%` }}
                                                    />
                                                </div>
                                                <span className="font-bold text-cyan-600 text-xs">{item.sentiment}%</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Order Book Section */}
                                    <OrderBook symbol={item.symbol} />

                                    <div className="mt-4 flex gap-3">
                                        <button className="flex-1 bg-cyan-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-cyan-500/20 text-xs transition-transform active:scale-95">Trade {item.symbol}</button>
                                        <button className="p-3 bg-white border border-gray-100 rounded-xl hover:border-cyan-200 transition-colors">
                                            <BarChart3 className="w-4 h-4 text-gray-400" />
                                        </button>
                                    </div>
                                </div>
                      </div>
                    )}
                </div>
            );
        }) : (
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <Star className="w-8 h-8 text-gray-200" />
            </div>
            <h3 className="font-bold text-gray-900 mb-1">Your Watchlist is empty</h3>
            <p className="text-sm text-gray-400 max-w-[200px]">Tap the star icon next to any asset to start tracking it here.</p>
          </div>
        )}
      </div>
    </section>
  );
}
