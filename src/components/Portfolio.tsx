import React, { useState, useEffect, useMemo } from 'react';
import { 
  Bitcoin, Wallet, Coins, ShipWheel, DollarSign, Loader2, 
  TrendingUp, Activity, TrendingDown, PieChart as PieIcon, 
  Info, Sparkles, RefreshCw, Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ResponsiveContainer, LineChart, Line, 
  PieChart, Pie, Cell, Tooltip, AreaChart, Area, XAxis, YAxis 
} from 'recharts';

import { ASSET_METADATA, getLogoUrl } from '../constants';
import { useTrading } from '../context/TradingContext';

const iconMap: Record<string, any> = {
  BTC: { icon: Bitcoin, color: 'text-orange-500', bg: 'bg-orange-500/10', name: 'Bitcoin', colorCode: '#f59e0b' },
  ETH: { icon: Coins, color: 'text-indigo-400', bg: 'bg-indigo-500/10', name: 'Ethereum', colorCode: '#6366f1' },
  SOL: { icon: ShipWheel, color: 'text-purple-400', bg: 'bg-purple-500/10', name: 'Solana', colorCode: '#a855f7' },
  USDT: { icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/10', name: 'Tether', colorCode: '#10b981' },
  XRP: { icon: Activity, color: 'text-sky-400', bg: 'bg-sky-500/10', name: 'Ripple', colorCode: '#38bdf8' },
};

// Pastel-glowing sleek color scheme for charts
const COLORS = ['#f59e0b', '#6366f1', '#a855f7', '#10b981', '#38bdf8', '#adfa1d', '#ec4899'];

export function Portfolio({ prices, loading, isDashboard = false }: { prices: any; loading: boolean; isDashboard?: boolean }) {
  const { balance, balanceUsdt, positions, totalRealizedPnl, usdtRate } = useTrading();
  const [assets, setAssets] = useState<any[]>([]);
  const [currencyMode, setCurrencyMode] = useState<'IDR' | 'USDT'>('IDR');
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d'>('7d');

  const currentUsdtRate = prices?.RAW?.USDT?.IDR?.PRICE || usdtRate || 16150;

  useEffect(() => {
    if (positions.length > 0) {
      const stockData: Record<string, { price: number, currency: 'IDR' | 'USD', name: string, logo: string }> = {};

      setAssets(prevAssets => {
        const newAssets = positions.map(pos => {
          const symbol = pos.symbol;
          const raw = prices?.RAW?.[symbol]?.IDR;
          const display = prices?.DISPLAY?.[symbol]?.IDR;
          const stock = stockData[symbol];
          
          if (!raw && !stock) {
            const existing = prevAssets.find(a => a.symbol === symbol);
            if (existing) return existing;
            return null;
          }

          const meta = iconMap[symbol] || { 
            icon: Wallet, 
            color: 'text-indigo-400', 
            bg: 'bg-indigo-500/10', 
            name: stock?.name || symbol,
            colorCode: '#818cf8'
          };
          const logoUrl = stock?.logo || (display?.IMAGEURL ? `https://www.cryptocompare.com${display.IMAGEURL}` : null);
          
          let currentPriceUsdt = pos.entryPrice;
          let changePct = 0;

          if (raw) {
            currentPriceUsdt = raw.PRICE_USDT || (raw.PRICE / currentUsdtRate);
            changePct = raw.CHANGEPCT24HOUR || 0;
          } else {
            const existing = prevAssets.find(a => a.symbol === symbol);
            if (existing) return existing;
            return null;
          }

          const currentPriceIdr = currentPriceUsdt * currentUsdtRate;
          const pnlUsdt = (currentPriceUsdt - pos.entryPrice) * pos.amount;
          const pnlIdr = pnlUsdt * currentUsdtRate;
          const pnlPercent = ((currentPriceUsdt - pos.entryPrice) / pos.entryPrice) * 100;
          const marketValueIdr = pos.amount * currentPriceIdr;
          const marketValueUsdt = pos.amount * currentPriceUsdt;

          const pnlFormattedIdr = new Intl.NumberFormat('id-ID', { 
            style: 'currency', 
            currency: 'IDR', 
            maximumFractionDigits: 0,
            signDisplay: 'always'
          }).format(pnlIdr);

          const pnlFormattedUsdt = new Intl.NumberFormat('en-US', { 
            style: 'currency', 
            currency: 'USD', 
            maximumFractionDigits: 2,
            signDisplay: 'always'
          }).format(pnlUsdt);

          const balanceFormattedIdr = new Intl.NumberFormat('id-ID', { 
            style: 'currency', 
            currency: 'IDR', 
            maximumFractionDigits: 0 
          }).format(marketValueIdr);

          const balanceFormattedUsdt = new Intl.NumberFormat('en-US', { 
            style: 'currency', 
            currency: 'USD', 
            maximumFractionDigits: 2 
          }).format(marketValueUsdt);

          const existingAsset = prevAssets.find(a => a.symbol === symbol);
          let sparklineData = existingAsset?.sparklineData;
          if (!sparklineData) {
            const points = 20;
            const trend = changePct > 0 ? 1 : -1;
            sparklineData = Array.from({ length: points }).map((_, i) => ({
              value: 50 + (i * trend * Math.random() * 2) + (Math.random() * 8 - 4)
            }));
          }

          return {
            symbol,
            name: meta.name,
            amount: pos.amount,
            balance: currencyMode === 'IDR' ? balanceFormattedIdr : balanceFormattedUsdt,
            valueUsdt: marketValueUsdt,
            valueIdr: marketValueIdr,
            pnl: currencyMode === 'IDR' ? pnlFormattedIdr : pnlFormattedUsdt,
            rawPnlIdr: pnlIdr,
            rawPnlUsdt: pnlUsdt,
            pnlPercent: pnlPercent.toFixed(2),
            change: `${changePct.toFixed(2)}%`,
            changeRaw: changePct,
            icon: meta.icon,
            color: meta.color,
            bg: meta.bg,
            colorCode: meta.colorCode,
            logoUrl,
            sparklineData
          };
        }).filter(Boolean);

        return newAssets;
      });
    } else if (!loading) {
      setAssets([]);
    }
  }, [prices, positions, loading, currencyMode, currentUsdtRate, usdtRate]);

  // Aggregate stats
  const totalValueUsdt = useMemo(() => {
    const assetsTotal = assets.reduce((acc, a) => acc + (a?.valueUsdt || 0), 0);
    return assetsTotal + balanceUsdt;
  }, [assets, balanceUsdt]);

  const totalValueIdr = totalValueUsdt * currentUsdtRate;

  const totalUnrealizedPnlIdr = assets.reduce((acc, asset) => acc + (asset?.rawPnlIdr || 0), 0);
  const totalUnrealizedPnlUsdt = assets.reduce((acc, asset) => acc + (asset?.rawPnlUsdt || 0), 0);

  // Generate pie allocation data
  const pieData = useMemo(() => {
    const list = assets.map(a => ({
      name: a.symbol,
      value: a.valueUsdt,
      color: a.colorCode || '#818cf8',
      percentage: (a.valueUsdt / (totalValueUsdt || 1)) * 100
    }));

    if (balanceUsdt > 0) {
      list.push({
        name: 'USDT Free',
        value: balanceUsdt,
        color: '#10b981',
        percentage: (balanceUsdt / (totalValueUsdt || 1)) * 100
      });
    }

    return list.sort((a,b) => b.value - a.value);
  }, [assets, balanceUsdt, totalValueUsdt]);

  // Custom mock data for performance timeline over selected timeframe
  const historyData = useMemo(() => {
    const pointsCount = timeframe === '24h' ? 24 : timeframe === '7d' ? 7 : 30;
    const baseValue = totalValueUsdt;
    const items = [];
    const seed = parseFloat((totalUnrealizedPnlUsdt / (totalValueUsdt || 1)).toFixed(4)) || 0.05;

    for (let i = pointsCount; i >= 0; i--) {
      // Create a smooth progressive trendline backward
      const t = i / pointsCount;
      const noise = (Math.sin(i * 0.8) * 0.015) + (Math.cos(i * 0.4) * 0.01);
      const factor = 1 - (t * seed) + noise;
      const valUsdt = baseValue * factor;
      const valIdr = valUsdt * currentUsdtRate;

      let label = '';
      if (timeframe === '24h') {
        label = `${i}h ago`;
      } else if (timeframe === '7d') {
        label = i === 0 ? 'Now' : `${i}d ago`;
      } else {
        label = i === 0 ? 'Now' : `${i}d ago`;
      }

      items.push({
        label,
        USDT: parseFloat(valUsdt.toFixed(2)),
        IDR: Math.round(valIdr)
      });
    }
    return items.reverse();
  }, [timeframe, totalValueUsdt, totalUnrealizedPnlUsdt, currentUsdtRate]);

  // Format main total balance string
  const totalBalanceString = useMemo(() => {
    if (currencyMode === 'IDR') {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0
      }).format(totalValueIdr);
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2
    }).format(totalValueUsdt);
  }, [currencyMode, totalValueIdr, totalValueUsdt]);

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(null);
  };

  return (
    <div className="px-1 sm:px-4 space-y-8 pb-12">
      {/* Upper Title Row & Quick Converter */}
      {!isDashboard && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-bold uppercase tracking-widest mb-1">
              <Sparkles className="w-4 h-4 animate-pulse" /> Live Metrics Engine
            </div>
            <h2 className="font-extrabold text-2xl md:text-3xl tracking-tight text-white flex items-center gap-2">
              Real-Time Asset Dashboard
            </h2>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-1">
              Live prices update securely via WebSockets
            </p>
          </div>

          {/* Currency Switcher */}
          <div className="flex bg-slate-950/85 p-1 rounded-2xl border border-slate-800/80 self-start md:self-auto">
            <button
              onClick={() => setCurrencyMode('IDR')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                currencyMode === 'IDR'
                  ? 'bg-gradient-to-br from-cyan-500 to-indigo-600 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              IDR Rp
            </button>
            <button
              onClick={() => setCurrencyMode('USDT')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                currencyMode === 'USDT'
                  ? 'bg-gradient-to-br from-cyan-500 to-indigo-600 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              USDT $
            </button>
          </div>
        </div>
      )}

      {/* Main Net Assets Bento Section */}
      <div className={`grid grid-cols-1 ${isDashboard ? 'grid-cols-1 md:grid-cols-2' : 'lg:grid-cols-3'} gap-6`}>
        
        {/* Card 1: Asset Valuation & Floating PNL */}
        {!isDashboard && (
          <div className="bg-slate-900 border border-slate-800 rounded-[30px] p-6 lg:p-8 relative overflow-hidden backdrop-blur-md shadow-xl flex flex-col justify-between min-h-[220px]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-3xl rounded-full" />
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-cyan-300 font-extrabold flex items-center gap-2">
                Net Worth Value
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </span>
              <Info className="w-4 h-4 text-slate-500 hover:text-slate-300 cursor-pointer" />
            </div>
            
            <div className="space-y-1">
              <h3 className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white select-all">
                {totalBalanceString}
              </h3>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-wider">
                Base conversion: 1 USDT ≈ Rp {currentUsdtRate.toLocaleString('id-ID')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-slate-800/80 pt-4 mt-6">
            <div>
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Unrealized PNL</span>
              <span className={`text-sm font-black font-mono tracking-tight block ${
                totalUnrealizedPnlIdr >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {totalUnrealizedPnlIdr >= 0 ? '+' : ''}
                {currencyMode === 'IDR' 
                  ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0, signDisplay: 'always' }).format(totalUnrealizedPnlIdr)
                  : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2, signDisplay: 'always' }).format(totalUnrealizedPnlUsdt)
                }
              </span>
            </div>
            <div>
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Avail Cash</span>
              <span className="text-sm font-black font-mono text-cyan-400 block">
                {currencyMode === 'IDR'
                  ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(balanceUsdt * currentUsdtRate)
                  : `$${balanceUsdt.toLocaleString()}`
                }
              </span>
            </div>
          </div>
        </div>
        )}

        {/* Card 2: Interactive Allocation Pie/Donut Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-[30px] p-6 relative overflow-hidden backdrop-blur-md shadow-xl flex flex-col justify-between min-h-[220px]">
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl rounded-full" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-indigo-300 font-extrabold flex items-center gap-2">
              <PieIcon className="w-3.5 h-3.5" /> Holdings Allocation
            </span>
            <span className="text-[9px] text-zinc-500 font-semibold uppercase">{pieData.length} items grouped</span>
          </div>

          {pieData.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-4">
              <Layers className="w-8 h-8 text-slate-600 mb-2" />
              <span className="text-xs text-zinc-500 font-black uppercase">No Allocations found</span>
            </div>
          ) : (
            <div className="flex items-center h-28 relative">
              <div className="w-[120px] h-[120px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={36}
                      outerRadius={50}
                      paddingAngle={4}
                      dataKey="value"
                      onMouseEnter={onPieEnter}
                      onMouseLeave={onPieLeave}
                    >
                      {pieData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.color} 
                          opacity={activeIndex === null ? 1 : activeIndex === index ? 1 : 0.4}
                          className="transition-all duration-300 outline-none"
                          stroke="#0f172a"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Dynamic Legend / Active Pie stats */}
              <div className="flex-1 pl-4 space-y-1.5 overflow-hidden">
                <AnimatePresence mode="wait">
                  {activeIndex !== null ? (
                    <motion.div
                      key={activeIndex}
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 5 }}
                      className="font-mono text-xs"
                    >
                      <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest leading-none">Focused Asset</p>
                      <span className="text-sm font-black text-white">{pieData[activeIndex].name}</span>
                      <p className="text-[11px] font-bold mt-0.5" style={{ color: pieData[activeIndex].color }}>
                        {pieData[activeIndex].percentage.toFixed(1)}% Allocation
                      </p>
                    </motion.div>
                  ) : (
                    <div className="space-y-1">
                      {pieData.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-[10px] text-slate-300 font-semibold truncate">
                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                          <span className="font-bold text-white shrink-0 font-mono">{item.name}</span>
                          <span className="text-[9px] text-zinc-500">({item.percentage.toFixed(1)}%)</span>
                        </div>
                      ))}
                      {pieData.length > 3 && (
                        <p className="text-[9px] text-indigo-400 font-black uppercase tracking-wider pl-3.5">
                          + {pieData.length - 3} other assets
                        </p>
                      )}
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>

        {/* Card 3: Live Historical Growth / Growth Performance */}
        <div className="bg-slate-900 border border-slate-800 rounded-[30px] p-6 relative overflow-hidden backdrop-blur-md shadow-xl flex flex-col justify-between min-h-[220px]">
          <div className="absolute top-0 left-0 w-32 h-32 bg-violet-500/5 blur-3xl rounded-full" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-violet-300 font-extrabold flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5" /> Performance Trend
            </span>
            
            {/* Timeframe selector */}
            <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-850">
              {(['24h', '7d', '30d'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setTimeframe(p)}
                  className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider transition-all ${
                    timeframe === p ? 'bg-indigo-600 text-white' : 'text-zinc-500 hover:text-slate-350'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="h-28 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historyData} margin={{ left: -10, right: 10, top: 5, bottom: 0 }}>
                <defs>
                  <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" hide />
                <YAxis hide domain={['auto', 'auto']} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const dataNode = payload[0].payload;
                      return (
                        <div className="bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl text-[10px] font-mono shadow-2xl">
                          <span className="text-zinc-500 block uppercase font-bold">{dataNode.label}</span>
                          <span className="text-white font-black block mt-0.5">
                            {currencyMode === 'IDR'
                              ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(dataNode.IDR)
                              : `$${dataNode.USDT.toLocaleString()}`
                            }
                          </span>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey={currencyMode} 
                  stroke="#818cf8" 
                  strokeWidth={2} 
                  fillOpacity={1} 
                  fill="url(#growthGrad)" 
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Main Table: Enhanced Holdings Row List */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-2">
          <h3 className="font-extrabold text-lg text-white font-mono uppercase tracking-widest flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" /> Active Holdings
          </h3>
          <span className="text-xs font-mono font-bold text-zinc-500 uppercase tracking-widest bg-slate-950 border border-slate-900 px-3 py-1 rounded-full">
            Available to Trade
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {loading && positions.length > 0 ? (
            <div className="flex justify-center p-12 bg-slate-950/60 rounded-[32px] border border-slate-900">
              <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
            </div>
          ) : positions.length === 0 ? (
            <div className="text-center py-16 bg-slate-905/40 border border-dashed border-slate-800 rounded-[32px] overflow-hidden space-y-3 relative">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-cyan-500/5 blur-3xl rounded-full" />
              <Layers className="w-10 h-10 text-slate-700 mx-auto" />
              <p className="text-sm text-slate-400 font-bold">No active holdings trackable</p>
              <p className="text-[10px] text-slate-600 font-black tracking-wide uppercase">
                Initiate spot or futures trades to populate this panel
              </p>
            </div>
          ) : (
            assets.map((asset) => (
              <div 
                key={asset.symbol}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-slate-950 border border-slate-900/90 rounded-[28px] shadow-lg shadow-black/15 hover:border-cyan-500/40 hover:bg-slate-900/60 transition-all cursor-pointer group space-y-4 sm:space-y-0 relative overflow-hidden"
              >
                {/* Horizontal hover glow bar */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="flex gap-4 items-center">
                  <div className="p-2.5 rounded-2xl group-hover:scale-105 transition-transform flex items-center justify-center overflow-hidden w-12 h-12 bg-slate-900 border border-slate-800 shadow-inner shrink-0">
                    {asset.logoUrl ? (
                      <img src={asset.logoUrl} alt={asset.symbol} className="w-8 h-8 object-contain drop-shadow-md" referrerPolicy="no-referrer" />
                    ) : (
                      <asset.icon className={`${asset.color} w-6 h-6`}/>
                    )}
                  </div>
                  <div>
                    <div className="font-black text-white text-base tracking-tight flex items-center gap-1.5">
                      {asset.name}
                      <span className="text-[9px] font-mono tracking-wider text-slate-500 font-black uppercase bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                        {asset.symbol}
                      </span>
                    </div>
                    <div className="flex gap-2.5 text-[11px] font-bold tracking-tight items-center mt-1">
                      <span className="text-slate-400 font-mono uppercase">{asset.amount.toFixed(4)} {asset.symbol}</span>
                      <motion.span 
                        key={asset.pnl}
                        initial={{ opacity: 0.5 }}
                        animate={{ opacity: 1 }}
                        className={`text-[10px] font-black uppercase ${parseFloat(asset.pnlPercent) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}
                      >
                         ({parseFloat(asset.pnlPercent) >= 0 ? '+' : ''}{asset.pnlPercent}%)
                      </motion.span>
                    </div>
                  </div>
                </div>

                {/* Visual Sparkline Trend Vector */}
                <div className="flex-1 h-10 max-w-[150px] mx-4 opacity-40 group-hover:opacity-100 transition-all duration-700 hidden md:block pointer-events-none">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={asset.sparklineData}>
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke={asset.changeRaw >= 0 ? '#10b981' : '#f43f5e'} 
                        strokeWidth={2} 
                        dot={false} 
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Balance Value & Real-Time PNL indicator block */}
                <div className="text-left sm:text-right flex flex-row sm:flex-col justify-between sm:justify-start items-center sm:items-end gap-2 border-t sm:border-t-0 border-slate-900 pt-3 sm:pt-0">
                  <div className="hidden sm:block">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 leading-none">Market Value</p>
                    <p className="font-extrabold text-white text-lg tracking-tight font-mono mt-1">{asset.balance}</p>
                  </div>
                  
                  {/* Mobile alternative */}
                  <div className="sm:hidden text-left">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 leading-none">Value</p>
                    <p className="font-extrabold text-white text-sm tracking-tight font-mono mt-1">{asset.balance}</p>
                  </div>

                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all duration-300 font-mono ${
                    parseFloat(asset.pnlPercent) >= 0 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  }`}>
                    {parseFloat(asset.pnlPercent) >= 0 ? <TrendingUp className="w-3.5 h-3.5 animate-bounce" /> : <TrendingDown className="w-3.5 h-3.5 animate-bounce" />}
                    <span>{asset.pnl}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
