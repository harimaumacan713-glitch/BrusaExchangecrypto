import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowDownUp, Info, ChevronDown, Wallet, Target, Zap, History, Clock, CheckCircle2, XCircle, Orbit, Landmark } from 'lucide-react';



import { useTrading } from '../context/TradingContext';

export function TradeView({ prices, loading }: { prices: any; loading: boolean }) {
  const { balance, buyAsset, sellAsset, positions, orders, getTotalValue } = useTrading();
  
  const currentPricesUsdt: Record<string, number> = {};
  if (prices && prices.RAW) {
    Object.keys(prices.RAW).forEach(symbol => {
      currentPricesUsdt[symbol] = prices.RAW[symbol].IDR.PRICE_USDT || (prices.RAW[symbol].IDR.PRICE / 16150);
    });
  }

  const totalValueUsdt = getTotalValue(currentPricesUsdt);
  const totalValueIdr = totalValueUsdt * 16150;
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [fromAmount, setFromAmount] = useState('');
  const [targetAsset, setTargetAsset] = useState('BTC');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastOrderMessage, setLastOrderMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Use USDT price for calculations if available, fallback to IDR / 16350
  const currentPriceUsdt = prices?.RAW?.[targetAsset]?.IDR?.PRICE_USDT || (prices?.RAW?.[targetAsset]?.IDR?.PRICE / 16150) || 0;
  const logoUrl = prices?.DISPLAY?.[targetAsset]?.IDR?.IMAGEURL ? `https://www.cryptocompare.com${prices.DISPLAY[targetAsset].IDR.IMAGEURL}` : null;

  const currentPosition = positions.find(p => p.symbol === targetAsset);
  const unrealizedPnlUsdt = currentPosition ? (currentPriceUsdt - currentPosition.entryPrice) * currentPosition.amount : 0;
  const pnlPercent = currentPosition ? ((currentPriceUsdt - currentPosition.entryPrice) / currentPosition.entryPrice) * 100 : 0;
  
  // Side Buy: Pay USDT, Receive Asset
  // Side Sell: Pay Asset, Receive USDT
  const toAmount = fromAmount && currentPriceUsdt 
    ? (side === 'buy' ? (parseFloat(fromAmount) / currentPriceUsdt).toFixed(8) : (parseFloat(fromAmount) * currentPriceUsdt).toFixed(2)) 
    : '0';

  const handleSwap = () => {
    if (!fromAmount || parseFloat(fromAmount) <= 0) return;
    
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
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-bold text-2xl tracking-tight text-gray-900">Live Trading</h2>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-700 rounded-full shadow-lg shadow-cyan-500/30">
            <Orbit className="w-3.5 h-3.5 text-white animate-spin-slow" />
            <motion.span 
              key={totalValueIdr}
              initial={{ scale: 0.9 }} animate={{ scale: 1 }}
              className="text-xs font-black text-white"
            >
              IDR {totalValueIdr.toLocaleString('id-ID', { maximumFractionDigits: 0 })}
            </motion.span>
          </div>
          <div className="flex items-center gap-2 mr-1">
             <span className="text-[8px] font-black text-green-500 uppercase tracking-tighter">Equity (USDT)</span>
             <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">
               Available: ${balance.toLocaleString()} USDT
             </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 mb-6">
        <div className="flex p-1 bg-gray-100 rounded-2xl">
          <button 
            onClick={() => setSide('buy')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${side === 'buy' ? 'bg-green-500 text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Buy
          </button>
          <button 
            onClick={() => setSide('sell')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${side === 'sell' ? 'bg-red-500 text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Sell
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {/* From Section */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white border border-gray-100 rounded-[32px] p-6 shadow-sm"
        >
          <div className="flex justify-between text-sm text-gray-400 font-medium mb-4">
            <span>You Pay ({side === 'buy' ? 'USDT' : targetAsset})</span>
            <span className="flex items-center gap-1 font-bold text-gray-600">
              {side === 'buy' ? `$ ${balance.toLocaleString()}` : `${targetAsset} ${currentPosition?.amount.toFixed(4) || '0.0000'}`}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <input 
              type="number" 
              value={fromAmount}
              onChange={(e) => setFromAmount(e.target.value)}
              className="text-3xl font-bold bg-transparent outline-none w-1/2"
              placeholder="0.0"
            />
            {side === 'buy' ? (
              <div className="bg-gray-50 p-3 rounded-2xl flex items-center gap-2 border border-gray-100">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold overflow-hidden">
                  <img src="https://www.cryptocompare.com/media/37746338/usdt.png" alt="USDT" className="w-4 h-4 object-contain" referrerPolicy="no-referrer" />
                </div>
                <span className="font-bold">USDT</span>
              </div>
            ) : (
               <div className="relative">
                 <select 
                  value={targetAsset}
                  onChange={(e) => setTargetAsset(e.target.value)}
                  className="bg-gray-50 hover:bg-gray-100 pl-11 pr-3 py-3 rounded-2xl flex items-center gap-2 border border-gray-100 transition-colors font-bold outline-none appearance-none cursor-pointer w-full min-w-[100px]"
                >
                  <option value="BTC">BTC</option>
                  <option value="ETH">ETH</option>
                  <option value="SOL">SOL</option>
                  <option value="XRP">XRP</option>
                </select>
                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-lg border border-gray-100 flex items-center justify-center overflow-hidden pointer-events-none">
                  {logoUrl ? (
                    <img src={logoUrl} alt={targetAsset} className="w-4 h-4 object-contain" referrerPolicy="no-referrer" />
                  ) : (
                    <span className="text-[8px] font-black">{targetAsset.substring(0, 2)}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Swap Icon */}
        <div className="flex justify-center -my-3 relative z-10">
          <motion.div 
            className="bg-[#06b6d4] p-4 rounded-2xl shadow-xl shadow-cyan-500/30 border-4 border-[#F8FAFC]"
          >
            <ArrowDownUp className="text-white w-6 h-6" />
          </motion.div>
        </div>

        {/* To Section */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white border border-gray-100 rounded-[32px] p-6 shadow-sm"
        >
          <div className="flex justify-between text-sm text-gray-400 font-medium mb-4">
            <span>You Receive ({side === 'buy' ? targetAsset : 'USDT'})</span>
            <div className="flex flex-col items-end">
              <span className="flex items-center gap-1 font-bold text-gray-600 text-right">
                 {side === 'buy' ? `${targetAsset}: ${currentPosition ? currentPosition.amount.toFixed(4) : '0.0000'}` : `Balance: $${balance.toLocaleString()}`}
              </span>
              {currentPosition && (
                <span className={`text-[10px] font-bold ${unrealizedPnlUsdt >= 0 ? 'text-green-500' : 'text-red-500'}`}>
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
              className="text-2xl font-bold bg-transparent outline-none w-2/3"
              placeholder="0.0"
            />
            {side === 'buy' ? (
              <div className="relative">
                <select 
                  value={targetAsset}
                  onChange={(e) => setTargetAsset(e.target.value)}
                  className="bg-gray-50 hover:bg-gray-100 pl-11 pr-3 py-3 rounded-2xl flex items-center gap-2 border border-gray-100 transition-colors font-bold outline-none appearance-none cursor-pointer w-full min-w-[100px]"
                >
                  <option value="BTC">BTC</option>
                  <option value="ETH">ETH</option>
                  <option value="SOL">SOL</option>
                  <option value="XRP">XRP</option>
                </select>
                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-lg border border-gray-100 flex items-center justify-center overflow-hidden pointer-events-none">
                  {logoUrl ? (
                    <img src={logoUrl} alt={targetAsset} className="w-4 h-4 object-contain" referrerPolicy="no-referrer" />
                  ) : (
                    <span className="text-[8px] font-black">{targetAsset.substring(0, 2)}</span>
                  )}
                </div>
              </div>
            ) : (
                <div className="bg-gray-50 p-3 rounded-2xl flex items-center gap-2 border border-gray-100">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold overflow-hidden">
                    <img src="https://www.cryptocompare.com/media/37746338/usdt.png" alt="USDT" className="w-4 h-4 object-contain" referrerPolicy="no-referrer" />
                  </div>
                  <span className="font-bold">USDT</span>
                </div>
            )}
          </div>
        </motion.div>
      </div>

      <div className="mt-8">
        <div className="flex justify-between text-sm mb-4 px-2">
          <span className="text-gray-400">Binance Market Price</span>
          <span className="font-medium text-gray-600">1 {targetAsset} = ${currentPriceUsdt.toLocaleString()} USDT</span>
        </div>
        
        <AnimatePresence>
          {lastOrderMessage && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`mb-4 p-4 rounded-2xl text-xs font-bold text-center border ${
                lastOrderMessage.type === 'success' ? 'bg-green-50 border-green-100 text-green-600' : 'bg-red-50 border-red-100 text-red-600'
              }`}
            >
              {lastOrderMessage.text}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleSwap}
          disabled={isProcessing}
          className={`w-full bg-gradient-to-r ${side === 'buy' ? 'from-green-500 to-emerald-600 shadow-green-500/25' : 'from-red-500 to-rose-600 shadow-red-500/25'} text-white font-bold py-5 rounded-[24px] shadow-lg text-lg transition-all flex items-center justify-center gap-2`}
        >
          {isProcessing ? (
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white" />
          ) : (
            side === 'buy' ? 'Confirm Purchase' : 'Confirm Sale'
          )}
        </motion.button>
      </div>

      {/* Order History Section */}
      <div className="mt-10 border-t border-gray-100 pt-8 pb-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-gray-400" />
            <h3 className="font-bold text-lg text-gray-900 tracking-tight">Order History</h3>
          </div>
          <button className="text-xs font-bold text-cyan-600 hover:text-cyan-700 transition-colors">View All</button>
        </div>

        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="text-center py-10 px-4 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
              <p className="text-sm text-gray-400 font-medium italic">No transactions yet</p>
            </div>
          ) : orders.map((order) => {
            const display = prices?.DISPLAY?.[order.symbol]?.IDR;
            const orderLogoUrl = display?.IMAGEURL ? `https://www.cryptocompare.com${display.IMAGEURL}` : null;
            
            return (
              <motion.div 
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-50/50 border border-gray-100 rounded-2xl p-4 flex items-center justify-between group hover:bg-white hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs uppercase overflow-hidden ${
                    (order as any).metadata?.type === 'withdrawal' ? 'bg-indigo-100 text-indigo-600' :
                    order.type === 'buy' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                  }`}>
                    {(order as any).metadata?.type === 'withdrawal' ? (
                      <Landmark className="w-5 h-5" />
                    ) : orderLogoUrl ? (
                      <img src={orderLogoUrl} alt={order.symbol} className="w-6 h-6 object-contain" referrerPolicy="no-referrer" />
                    ) : (
                      order.type === 'buy' ? 'B' : 'S'
                    )}
                  </div>
                  <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-gray-900">
                      {(order as any).metadata?.type === 'withdrawal' ? 'Withdrawal' : order.symbol}
                    </span>
                    <span className={`text-[10px] font-black uppercase tracking-tighter px-1.5 py-0.5 bg-white border border-gray-100 rounded-md ${
                      (order as any).metadata?.type === 'withdrawal' ? 'text-indigo-400' : 'text-gray-400'
                    }`}>
                      {(order as any).metadata?.type === 'withdrawal' ? 'ASIPP' : order.type}
                    </span>
                  </div>
                  <div className="text-[11px] font-medium text-gray-400 mt-1">
                    {(order as any).metadata?.type === 'withdrawal' 
                      ? `${(order as any).metadata.projectId} • ${new Date(order.timestamp).toLocaleTimeString()}`
                      : new Date(order.timestamp).toLocaleString()
                    }
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="font-mono text-sm font-bold text-gray-900">
                  {order.type === 'buy' || (order as any).metadata?.type === 'withdrawal' ? '-' : '+'}${order.amount.toLocaleString()}
                </div>
                {order.pnl !== undefined && order.pnl !== 0 && (
                  <div className={`text-[10px] font-black uppercase tracking-tight ${order.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {order.pnl >= 0 ? 'Gain' : 'Loss'} {order.pnl >= 0 ? '+' : ''}${Math.abs(order.pnl).toFixed(2)}
                  </div>
                )}
                <div className="flex items-center justify-end gap-1.5 mt-1">
                  {order.status === 'filled' && <CheckCircle2 className="w-3 h-3 text-green-500" />}
                  <span className={`text-[10px] font-bold uppercase tracking-tight ${
                    order.status === 'filled' ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
        </div>
      </div>
    </div>
  );
}
