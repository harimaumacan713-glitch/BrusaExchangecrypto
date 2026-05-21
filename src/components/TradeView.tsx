import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowDownUp, Info, ChevronDown, Wallet, Target, Zap, History, Clock, CheckCircle2, XCircle, Orbit, Landmark, TrendingUp, Compass } from 'lucide-react';
import { AreaChart, Area, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceDot, ReferenceLine } from 'recharts';

function CustomTooltip({ active, payload, currentPosition }: any) {
  if (active && payload && payload.length) {
    const dataPoint = payload[0].payload;
    // Since first series is priceUsdt and second was pnl
    const price = dataPoint?.priceUsdt ?? 0;
    const pnl = dataPoint?.pnl ?? 0;
    const timestamp = dataPoint?.fullTime || dataPoint?.time || 'Real-time updated';
    return (
      <div className="bg-slate-950 border border-slate-800 p-4 rounded-3xl shadow-2xl backdrop-blur-md space-y-2 max-w-xs">
        <p className="text-slate-500 text-[10px] uppercase font-mono tracking-wider leading-none">{timestamp}</p>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-6 text-xs">
            <span className="text-slate-400 font-medium font-sans">Asset Price:</span>
            <span className="font-mono font-black text-cyan-400">${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</span>
          </div>
          {currentPosition && (
            <div className="flex items-center justify-between gap-6 text-xs border-t border-slate-900 pt-1.5">
              <span className="text-slate-400 font-medium font-sans">Est. Unrealized PNL:</span>
              <span className={`font-mono font-black ${pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {pnl >= 0 ? '+' : ''}{pnl.toFixed(4)} USDT
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
}

function PnlChart({ currentPosition, symbol, currentPriceUsdt, currentUsdtRate }: { currentPosition: any, symbol: string, currentPriceUsdt: number, currentUsdtRate: number }) {
  const [range, setRange] = useState('24h');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [clickedPoint, setClickedPoint] = useState<any>(null);

  useEffect(() => {
    setClickedPoint(null);
  }, [symbol, range]);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/history?symbol=${symbol}&range=${range}`);
        const historyData = await response.json();
        
        if (Array.isArray(historyData)) {
          setData(historyData);
        }
      } catch (e) {
        console.error('Failed to fetch history for TradeView Chart', e);
      } finally {
        setLoading(false);
      }
    };
    
    fetchHistory();
  }, [symbol, range]);

  // Convert historical price (which is in IDR) to USDT using currentUsdtRate
  const mappedData = useMemo(() => {
    const items = data.map(d => {
      let priceUsdt = d.price;
      // Heuristic instead of hardcoding lists:
      if (currentPriceUsdt > 0 && priceUsdt / currentPriceUsdt > 5000) {
        priceUsdt = priceUsdt / currentUsdtRate;
      }
      
      const pnl = currentPosition ? (priceUsdt - currentPosition.entryPrice) * currentPosition.amount : 0;
      
      return {
        time: new Date(d.fullTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        fullTime: d.fullTime,
        priceUsdt: priceUsdt,
        pnl: pnl
      };
    });

    // Append current real-time point
    if (currentPriceUsdt > 0) {
      items.push({
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        fullTime: new Date().toLocaleString(),
        priceUsdt: currentPriceUsdt,
        pnl: currentPosition ? (currentPriceUsdt - currentPosition.entryPrice) * currentPosition.amount : 0
      });
    }

    return items;
  }, [data, currentPriceUsdt, currentPosition, currentUsdtRate]);

  const isProfit = (mappedData.length > 0 && mappedData[mappedData.length - 1].pnl >= 0) || false;
  
  return (
    <div className="relative flex flex-col h-full bg-slate-900 border border-slate-800 rounded-[32px] p-6 shadow-xl overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-3xl rounded-full pointer-events-none" />
      
      <div className="flex justify-between items-center mb-5 shrink-0">
        <div>
          <h3 className="font-extrabold text-lg text-white font-sans tracking-tight">
            {symbol} Market Dashboard
          </h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" /> Live Price & PNL Overlays
          </p>
        </div>
        
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800/60">
          {['24h', '7d'].map(r => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`px-3 py-1 text-xs font-black rounded-lg transition-colors uppercase tracking-wider ${
                range === r ? 'bg-gradient-to-br from-cyan-500 to-indigo-600 text-slate-950 shadow font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Position Quick Banner */}
      {currentPosition ? (
        <div className="mb-4 bg-emerald-950/20 border border-emerald-500/20 rounded-2xl p-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[9px] font-mono leading-none tracking-wider text-slate-400 uppercase">Current Position</p>
              <p className="text-xs font-bold text-white mt-0.5">
                {currentPosition.amount.toFixed(4)} {symbol} @ ${currentPosition.entryPrice.toLocaleString()}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-mono leading-none tracking-wider text-slate-400 uppercase">Live PNL</p>
            <p className={`text-xs font-black font-mono mt-0.5 ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isProfit ? '+' : ''}{((currentPriceUsdt - currentPosition.entryPrice) * currentPosition.amount).toFixed(4)} USDT
            </p>
          </div>
        </div>
      ) : (
        <div className="mb-4 bg-slate-950/40 border border-slate-800/60 rounded-2xl p-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[9px] font-mono leading-none tracking-wider text-slate-400 uppercase">Spot Market View</p>
              <p className="text-xs font-bold text-slate-300 mt-0.5">
                No active position found for {symbol}
              </p>
            </div>
          </div>
          <span className="text-[9px] font-mono uppercase tracking-widest text-slate-500 font-bold">Standard Spec</span>
        </div>
      )}

      <AnimatePresence>
        {clickedPoint && (
          <motion.div 
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            className="overflow-hidden mb-4"
          >
            <div className="bg-indigo-950/40 border border-indigo-500/25 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono tracking-wider text-slate-400 uppercase font-bold">Selected Reference Point</span>
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  </div>
                  <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5 mt-0.5">
                    <span className="text-sm sm:text-base font-black font-mono tracking-tight text-white">
                      Price: ${clickedPoint.priceUsdt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                    </span>
                    {currentPosition && (
                      <span className={`text-xs sm:text-sm font-black font-mono ${clickedPoint.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        (PNL: {clickedPoint.pnl >= 0 ? '+' : ''}{clickedPoint.pnl.toFixed(4)} USDT)
                      </span>
                    )}
                    <span className="text-slate-500 text-[10px] font-mono">({clickedPoint.fullTime})</span>
                  </div>
                </div>
              </div>
              
              <button 
                type="button" 
                onClick={(e) => { e.stopPropagation(); setClickedPoint(null); }}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white rounded-xl text-[10px] font-extrabold transition-all active:scale-95 group shadow-lg uppercase tracking-wider shrink-0"
              >
                Clear Pin
                <XCircle className="w-3.5 h-3.5 text-slate-500 group-hover:text-rose-400 transition-colors" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="h-[255px] w-full min-h-[255px] flex-shrink-0 cursor-crosshair relative z-10">
        {loading && mappedData.length === 0 ? (
           <div className="w-full h-full flex items-center justify-center">
             <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500/30 border-t-indigo-500" />
           </div>
        ) : (
           <ResponsiveContainer width="100%" height="100%">
              <AreaChart 
                data={mappedData}
                onClick={(e: any) => {
                  if (e && e.activePayload && e.activePayload.length) {
                    const selectedPoint = e.activePayload[0].payload;
                    setClickedPoint((prev: any) => 
                      prev && prev.fullTime === selectedPoint.fullTime ? null : selectedPoint
                    );
                  }
                }}
              >
                 <defs>
                   <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.25}/>
                     <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                   </linearGradient>
                   <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor={isProfit ? '#10b981' : '#f43f5e'} stopOpacity={0.15}/>
                     <stop offset="95%" stopColor={isProfit ? '#10b981' : '#f43f5e'} stopOpacity={0}/>
                   </linearGradient>
                 </defs>
                 <XAxis dataKey="fullTime" hide />
                 <YAxis yAxisId="price" hide domain={['auto', 'auto']} />
                 <YAxis yAxisId="pnl" hide domain={['auto', 'auto']} />
                 <Tooltip content={<CustomTooltip currentPosition={currentPosition} />} />
                 
                 {/* Asset Price Backdrop Area */}
                 <Area 
                   yAxisId="price"
                   type="monotone" 
                   dataKey="priceUsdt" 
                   stroke="#22d3ee" 
                   fillOpacity={1} 
                   fill="url(#priceGradient)" 
                   strokeWidth={2}
                   isAnimationActive={false}
                 />

                 {/* Real-time PNL Curve (if matching position sits active) */}
                 {currentPosition && (
                   <Area 
                     yAxisId="pnl"
                     type="monotone" 
                     dataKey="pnl" 
                     stroke={isProfit ? '#10b981' : '#f43f5e'} 
                     fillOpacity={1} 
                     fill="url(#pnlGradient)" 
                     strokeWidth={2.5}
                     isAnimationActive={false}
                   />
                 )}

                 {/* Average entry price level on the price chart */}
                 {currentPosition && (
                   <ReferenceLine 
                     yAxisId="price"
                     y={currentPosition.entryPrice} 
                     stroke="#818cf8" 
                     strokeDasharray="4 4" 
                     strokeWidth={1.5} 
                     opacity={0.8}
                   />
                 )}

                 {clickedPoint && (
                   <ReferenceLine 
                     yAxisId="price"
                     x={clickedPoint.fullTime} 
                     stroke="#818cf8" 
                     strokeDasharray="3 3" 
                     opacity={0.6} 
                   />
                 )}

                 {clickedPoint && (
                   <ReferenceDot 
                     yAxisId="price"
                     x={clickedPoint.fullTime} 
                     y={clickedPoint.priceUsdt} 
                     r={6} 
                     fill="#22d3ee" 
                     stroke="#ffffff" 
                     strokeWidth={2} 
                   />
                 )}

                 {clickedPoint && currentPosition && (
                   <ReferenceDot 
                     yAxisId="pnl"
                     x={clickedPoint.fullTime} 
                     y={clickedPoint.pnl} 
                     r={5} 
                     fill={clickedPoint.pnl >= 0 ? '#10b981' : '#f43f5e'} 
                     stroke="#ffffff" 
                     strokeWidth={1.5} 
                   />
                 )}
              </AreaChart>
           </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

import { ASSET_METADATA, getLogoUrl } from '../constants';
import { StockPriceSkeleton } from './StockPriceSkeleton';


import { useTrading } from '../context/TradingContext';

export function TradeView({ prices, loading }: { prices: any; loading: boolean }) {
  const { balance, balanceUsdt, buyAsset, sellAsset, positions, orders, getTotalValue } = useTrading();
  
  const currentPricesUsdt: Record<string, number> = {};
  const currentUsdtRate = prices?.RAW?.USDT?.IDR?.PRICE || 16150;
  
  if (prices && prices.RAW) {
    Object.keys(prices.RAW).forEach(symbol => {
      currentPricesUsdt[symbol] = prices.RAW[symbol].IDR.PRICE_USDT || (prices.RAW[symbol].IDR.PRICE / currentUsdtRate);
    });
  }

  const totalValueUsdt = getTotalValue(currentPricesUsdt);
  const totalValueIdr = totalValueUsdt * currentUsdtRate;
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [fromAmount, setFromAmount] = useState('');
  const [targetAsset, setTargetAsset] = useState('BTC');
  const [showConfirm, setShowConfirm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastOrderMessage, setLastOrderMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Asset lists
  const cryptoAssets = ['BTC', 'ETH', 'SOL', 'XRP', 'ADA', 'DOT', 'DOGE', 'MATIC', 'AVAX'];
  const idxStocks: string[] = [];
  const usStocks: string[] = [];

  const allTradeAssets = [...cryptoAssets];

  const [stockPricesRealtime, setStockPricesRealtime] = useState<Record<string, number>>({});
  const [loadingPrices, setLoadingPrices] = useState<boolean>(false);
  const [errorPrices, setErrorPrices] = useState<string | null>(null);

  const priceMap = useMemo(() => {
    const map: Record<string, number> = {};
    [...idxStocks, ...usStocks].forEach(s => {
       map[s] = stockPricesRealtime[s] || 0;
    });
    return map;
  }, [stockPricesRealtime, idxStocks, usStocks]);

  const getPriceUsdt = (symbol: string) => {
    // If it's explicitly in prices payload, use it
    const rawPriceUsdt = prices?.RAW?.[symbol]?.IDR?.PRICE_USDT;
    if (rawPriceUsdt) {
      return rawPriceUsdt;
    }
    const rawPriceIdr = prices?.RAW?.[symbol]?.IDR?.PRICE;
    if (rawPriceIdr) {
      return rawPriceIdr / currentUsdtRate;
    }

    // Fallback to older logic if not found
    if (cryptoAssets.includes(symbol)) {
      return 0; // Wait for load
    }
    
    // Use realtime stock data
    const price = priceMap[symbol];
    if (price) {
    const isIdx = false; // Stocks removed
        return isIdx ? price / currentUsdtRate : price;
    }
    return 0;
  };

  const currentPriceUsdt = getPriceUsdt(targetAsset);

  if (loadingPrices) {
    return <StockPriceSkeleton />;
  }

  if (errorPrices) {
    return <div className="p-4 text-center text-red-500 font-bold">{errorPrices}</div>;
  }

  const logoUrl = getLogoUrl(targetAsset, cryptoAssets.includes(targetAsset) 
    ? (prices?.DISPLAY?.[targetAsset]?.IDR?.IMAGEURL ? `https://www.cryptocompare.com${prices.DISPLAY[targetAsset].IDR.IMAGEURL}` : null)
    : null);

  const currentPosition = positions.find(p => p.symbol === targetAsset);
  const unrealizedPnlUsdt = currentPosition ? (currentPriceUsdt - currentPosition.entryPrice) * currentPosition.amount : 0;
  const pnlPercent = currentPosition ? ((currentPriceUsdt - currentPosition.entryPrice) / currentPosition.entryPrice) * 100 : 0;
  
  // Side Buy: Pay USDT, Receive Asset
  // Side Sell: Pay Asset, Receive USDT
  const toAmount = fromAmount && currentPriceUsdt 
    ? (side === 'buy' ? (parseFloat(fromAmount) / currentPriceUsdt).toFixed(8) : (parseFloat(fromAmount) * currentPriceUsdt).toFixed(2)) 
    : '0';

  const isInvalid = !fromAmount || parseFloat(fromAmount) <= 0 || 
    (side === 'buy' ? parseFloat(fromAmount) > balanceUsdt : (!currentPosition || parseFloat(fromAmount) > currentPosition.amount));

  const handleSwap = () => {
    if (isInvalid) return;
    
    setIsProcessing(true);
    setLastOrderMessage(null);
    
    const executionPrice = currentPriceUsdt;
    const execAmount = side === 'buy' 
      ? parseFloat(fromAmount) / executionPrice 
      : parseFloat(fromAmount);

    setTimeout(() => {
      let success = false;
      if (side === 'buy') {
        // buyAsset(symbol, amount_of_asset, price_in_usdt)
        success = buyAsset(targetAsset, execAmount, executionPrice);
      } else {
        // sellAsset(symbol, amount_of_asset, price_in_usdt)
        success = sellAsset(targetAsset, execAmount, executionPrice);
      }

      if (success) {
        setFromAmount('');
        setLastOrderMessage({ 
          type: 'success', 
          text: `Successfully ${side === 'buy' ? 'bought' : 'sold'} ${execAmount.toFixed(4)} ${targetAsset} at $${executionPrice.toLocaleString()}`
        });
        setShowConfirm(false);
      } else {
        setLastOrderMessage({ 
          type: 'error', 
          text: side === 'buy' ? 'Insufficient USDT balance' : `Insufficient ${targetAsset} balance`
        });
      }
      setIsProcessing(false);
      setTimeout(() => setLastOrderMessage(null), 3000);
    }, 800);
  };

  const assetIcons: Record<string, string> = {
    BTC: '₿',
    ETH: 'Ξ',
    SOL: 'S',
    XRP: 'X'
  };

  return (
    <div className="px-6 py-4">
      <div className="flex justify-between items-center mb-8">
        <h2 className="font-bold text-2xl tracking-tight text-white">Live Trading</h2>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/80 rounded-full shadow-lg border border-slate-700">
            <Orbit className="w-4 h-4 text-cyan-400 animate-spin-slow" />
            <motion.span 
              key={totalValueIdr}
              initial={{ scale: 0.9 }} animate={{ scale: 1 }}
              className="text-sm font-black text-cyan-100"
            >
              IDR {totalValueIdr.toLocaleString('id-ID', { maximumFractionDigits: 0 })}
            </motion.span>
          </div>
          <div className="flex items-center gap-2 mr-1">
             <span className="text-[10px] font-black text-emerald-400 uppercase tracking-tighter">Equity (USDT)</span>
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
               Available: ${balanceUsdt.toLocaleString()} USDT
             </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="flex flex-col gap-3">
            <div className="flex p-1 bg-slate-800 rounded-2xl border border-slate-700">
              <button 
                onClick={() => setSide('buy')}
                className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${side === 'buy' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-slate-400 hover:text-white'}`}
              >
                Buy
              </button>
              <button 
                onClick={() => setSide('sell')}
                className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${side === 'sell' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'text-slate-400 hover:text-white'}`}
              >
                Sell
              </button>
            </div>
          </div>

          {/* Active Position Real-Time Card */}
          <AnimatePresence>
            {currentPosition && (
              <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className={`relative overflow-hidden bg-slate-900 border ${
                  unrealizedPnlUsdt >= 0 ? 'border-emerald-500/35 shadow-emerald-950/20' : 'border-rose-500/35 shadow-rose-950/20'
                } rounded-[28px] p-5 shadow-2xl transition-all duration-300`}
              >
                {/* Accent background glow */}
                <div className={`absolute top-0 right-0 w-28 h-28 rounded-full blur-2xl opacity-10 ${
                  unrealizedPnlUsdt >= 0 ? 'bg-emerald-400' : 'bg-rose-400'
                }`} />

                <div className="flex justify-between items-start relative z-10">
                  <div>
                    <span className="text-[9px] font-mono font-black text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 px-2 py-0.5 rounded-md uppercase tracking-widest">
                      Position Details
                    </span>
                    <h3 className="text-white text-lg font-black tracking-tight mt-2 flex items-center gap-1.5 leading-none">
                      {currentPosition.amount.toFixed(4)} {targetAsset}
                    </h3>
                  </div>

                  <div className="text-right">
                    <span className="text-[9.5px] font-mono font-bold text-slate-400 uppercase tracking-widest block leading-none mb-1">
                      Unrealized PNL
                    </span>
                    <div className={`text-xl font-mono font-black mt-0.5 leading-none ${
                      unrealizedPnlUsdt >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {unrealizedPnlUsdt >= 0 ? '+' : ''}${unrealizedPnlUsdt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                    </div>
                    <div className={`text-xs font-mono font-extrabold mt-1 leading-none ${
                      unrealizedPnlUsdt >= 0 ? 'text-emerald-500' : 'text-rose-500'
                    }`}>
                      {pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-800/60 text-xs relative z-10">
                  <div>
                    <span className="text-slate-500 font-sans text-[10px] block uppercase tracking-widest font-black mb-0.5">Avg. Entry Price</span>
                    <span className="text-slate-200 font-mono font-semibold">${currentPosition.entryPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 font-sans text-[10px] block uppercase tracking-widest font-black mb-0.5">Asset Current Price</span>
                    <span className="text-slate-200 font-mono font-semibold">${currentPriceUsdt.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                {/* Progress-like visual bar representing relative growth */}
                <div className="w-full h-1 bg-slate-950 rounded-full mt-4 overflow-hidden relative z-10">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      unrealizedPnlUsdt >= 0 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-gradient-to-r from-rose-500 to-orange-400'
                    }`} 
                    style={{ width: `${Math.min(Math.max(50 + pnlPercent, 5), 95)}%` }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-4">
            {/* From Section */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-slate-900 border border-slate-700 rounded-[32px] p-6 shadow-xl"
            >
              <div className="flex justify-between text-xs text-slate-400 font-medium mb-4">
                <span>You Pay ({side === 'buy' ? 'USDT' : targetAsset})</span>
                <span className="flex items-center gap-1 font-bold text-slate-200">
                  {side === 'buy' ? `$ ${balanceUsdt.toLocaleString()}` : `${targetAsset} ${currentPosition?.amount.toFixed(4) || '0.0000'}`}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <input 
                  type="number" 
                  value={fromAmount}
                  onChange={(e) => setFromAmount(e.target.value)}
                  className="text-3xl font-bold bg-transparent outline-none w-1/2 text-white placeholder-slate-600"
                  placeholder="0.0"
                />
                {side === 'buy' ? (
                  <div className="bg-slate-800 p-3 rounded-2xl flex items-center gap-2 border border-slate-700">
                    <div className="w-6 h-6 bg-slate-700 rounded-full flex items-center justify-center text-[10px] text-white font-bold overflow-hidden">
                      <span className="font-black text-cyan-400">$</span>
                    </div>
                    <span className="font-bold text-white text-sm">USDT</span>
                  </div>
                ) : (
                  <div className="relative">
                    <select 
                      value={targetAsset}
                      onChange={(e) => setTargetAsset(e.target.value)}
                      className="bg-slate-800 hover:bg-slate-700 pl-11 pr-3 py-3 rounded-2xl flex items-center gap-2 border border-slate-700 transition-colors font-bold outline-none appearance-none cursor-pointer w-full min-w-[100px] text-white"
                    >
                      {allTradeAssets.map(asset => (
                        <option key={asset} value={asset}>{asset}</option>
                      ))}
                    </select>
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-slate-900 rounded-lg border border-slate-700 flex items-center justify-center overflow-hidden pointer-events-none">
                      {logoUrl ? (
                        <img src={logoUrl} alt={targetAsset} className="w-4 h-4 object-contain" referrerPolicy="no-referrer" />
                      ) : (
                        <span className="text-[8px] font-black text-cyan-400">{targetAsset.substring(0, 2)}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Swap Icon */}
            <div className="flex justify-center -my-3 relative z-10">
              <motion.div 
                className="bg-slate-800 p-3 rounded-full shadow-xl border-2 border-slate-700"
              >
                <ArrowDownUp className="text-cyan-400 w-5 h-5" />
              </motion.div>
            </div>

            {/* To Section */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-slate-900 border border-slate-700 rounded-[32px] p-6 shadow-xl"
            >
              <div className="flex justify-between text-xs text-slate-400 font-medium mb-4">
                <span>You Receive ({side === 'buy' ? targetAsset : 'USDT'})</span>
                <div className="flex flex-col items-end">
                  <span className="flex items-center gap-1 font-bold text-slate-200 text-right">
                    {side === 'buy' ? `${targetAsset}: ${currentPosition ? currentPosition.amount.toFixed(4) : '0.0000'}` : `Balance: $${balanceUsdt.toLocaleString()}`}
                  </span>
                  {currentPosition && (
                    <span className={`text-[10px] font-bold ${unrealizedPnlUsdt >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      PNL: {unrealizedPnlUsdt >= 0 ? '+' : ''}${unrealizedPnlUsdt.toFixed(2)} ({pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%)
                    </span>
                  )}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <input 
                  type="text" 
                  value={side === 'buy' ? toAmount : `$${parseFloat(toAmount).toLocaleString()}`}
                  readOnly
                  className="text-2xl font-bold bg-transparent outline-none w-2/3 text-white placeholder-slate-600"
                  placeholder="0.0"
                />
                {side === 'buy' ? (
                  <div className="relative">
                    <select 
                      value={targetAsset}
                      onChange={(e) => setTargetAsset(e.target.value)}
                      className="bg-slate-800 hover:bg-slate-700 pl-11 pr-3 py-3 rounded-2xl flex items-center gap-2 border border-slate-700 transition-colors font-bold outline-none appearance-none cursor-pointer w-full min-w-[100px] text-white"
                    >
                      {allTradeAssets.map(asset => (
                        <option key={asset} value={asset}>{asset}</option>
                      ))}
                    </select>
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-slate-900 rounded-lg border border-slate-700 flex items-center justify-center overflow-hidden pointer-events-none">
                      {logoUrl ? (
                        <img src={logoUrl} alt={targetAsset} className="w-4 h-4 object-contain" referrerPolicy="no-referrer" />
                      ) : (
                        <span className="text-[8px] font-black text-cyan-400">{targetAsset.substring(0, 2)}</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-800 p-3 rounded-2xl flex items-center gap-2 border border-slate-700">
                    <div className="w-6 h-6 bg-slate-700 rounded-full flex items-center justify-center text-[10px] text-white font-bold overflow-hidden">
                      <span className="font-black text-cyan-400">$</span>
                    </div>
                    <span className="font-bold text-white text-sm">USDT</span>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          <div className="mt-8">
            <div className="flex justify-between text-xs mb-4 px-2">
              <span className="text-slate-500">Binance Market Price</span>
              <span className="font-medium text-slate-300">1 {targetAsset} = ${currentPriceUsdt.toLocaleString()} USDT</span>
            </div>
            
            <AnimatePresence>
              {lastOrderMessage && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`mb-4 p-4 rounded-2xl text-xs font-bold text-center border ${
                    lastOrderMessage.type === 'success' ? 'bg-emerald-950 border-emerald-800 text-emerald-400' : 'bg-rose-950 border-rose-800 text-rose-400'
                  }`}
                >
                  {lastOrderMessage.text}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowConfirm(true)}
              disabled={isProcessing || isInvalid}
              className={`w-full bg-gradient-to-r ${
                  isInvalid 
                    ? 'from-slate-800 to-slate-900 text-slate-500 cursor-not-allowed border border-slate-700'
                    : side === 'buy' 
                      ? 'from-emerald-500 to-emerald-600 shadow-emerald-500/25 text-white' 
                      : 'from-rose-500 to-rose-600 shadow-rose-500/25 text-white'
                } font-bold py-5 rounded-[24px] shadow-xl text-lg transition-all flex items-center justify-center gap-2`}
            >
              {isProcessing ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white" />
              ) : (
                side === 'buy' ? 'Buy Asset' : 'Sell Asset'
              )}
              </motion.button>
            <AnimatePresence>
            {showConfirm && (
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
                >
                    <motion.div 
                        initial={{ scale: 0.9 }} 
                        animate={{ scale: 1 }} 
                        exit={{ scale: 0.9 }}
                        className="bg-slate-900 border border-slate-700 rounded-[32px] p-8 w-full max-w-sm shadow-2xl"
                    >
                        <h3 className="font-black text-xl mb-6 text-white">Confirm {side === 'buy' ? 'Buy' : 'Sell'}</h3>
                        <div className="space-y-4 mb-8">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Asset</span>
                                <span className="font-bold text-white">{targetAsset}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Amount</span>
                                <span className="font-bold text-white">{side === 'buy' ? toAmount : fromAmount}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Price</span>
                                <span className="font-bold text-white">${currentPriceUsdt.toLocaleString()} USDT</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Fees (0%)</span>
                                <span className="font-bold text-white">0.00 USDT</span>
                            </div>
                            <div className="h-px bg-slate-800 my-2" />
                            <div className="flex justify-between items-center text-sm">
                                <span className="font-bold text-slate-300">Total {side === 'buy' ? 'Cost' : 'Value'}</span>
                                <span className="font-black text-lg text-white">
                                  ${side === 'buy' ? parseFloat(fromAmount || '0').toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : parseFloat(toAmount || '0').toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
                                </span>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button 
                                onClick={() => setShowConfirm(false)}
                                className="flex-1 py-4 rounded-[24px] font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleSwap}
                                className={`flex-1 py-4 rounded-[24px] font-bold text-white transition-colors ${side === 'buy' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-rose-500 hover:bg-rose-600'}`}
                            >
                                Confirm
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex flex-col h-full gap-8 border-t md:border-t-0 md:border-l border-slate-700 md:pl-8 pt-8 md:pt-0 pb-4">
          <PnlChart 
             currentPosition={currentPosition} 
             symbol={targetAsset} 
             currentPriceUsdt={currentPriceUsdt} 
             currentUsdtRate={currentUsdtRate}
          />
          {/* Order History Section */}
          <div className="h-full">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-slate-500" />
                <h3 className="font-bold text-lg text-white tracking-tight">Order History</h3>
              </div>
              <button className="text-xs font-bold text-cyan-500 hover:text-cyan-400 transition-colors">View All</button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                    <thead className="text-slate-500 border-b border-slate-700 uppercase font-black">
                        <tr>
                            <th className="pb-3 pl-2">Type</th>
                            <th className="pb-3">Asset</th>
                            <th className="pb-3">Price</th>
                            <th className="pb-3">Amount</th>
                            <th className="pb-3 pr-2">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {orders.length === 0 ? (
                            <tr><td colSpan={5} className="py-10 text-center text-slate-500 font-medium italic">No transactions yet</td></tr>
                        ) : orders.map((order) => (
                            <tr key={order.id} className="hover:bg-slate-800/50 transition-colors">
                                <td className={`py-4 pl-2 font-black uppercase ${order.type === 'buy' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {order.type}
                                </td>
                                <td className="py-4 font-bold text-white">{order.symbol}</td>
                                <td className="py-4 font-mono text-slate-300">${order.price.toLocaleString()}</td>
                                <td className="py-4 font-mono text-slate-300">{order.amount.toLocaleString()}</td>
                                <td className="py-4 pr-2">
                                    <span className={`px-2 py-1 rounded-md font-bold uppercase ${
                                        order.status === 'filled' ? 'bg-emerald-950 text-emerald-400' :
                                        order.status === 'pending' ? 'bg-amber-950 text-amber-400' :
                                        'bg-rose-950 text-rose-400'
                                    }`}>
                                        {order.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
