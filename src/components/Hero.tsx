import React from 'react';
import { Bell, User, Search, BookOpen, Repeat, MessageCircle, MessageSquare } from 'lucide-react';
import { motion } from 'motion/react';

import { useTrading } from '../context/TradingContext';

export function Hero({ prices }: { prices?: any }) {
  const { balance, positions, getTotalValue, totalRealizedPnl } = useTrading();
  
  const currentPrices: Record<string, number> = {};
  if (prices && prices.RAW) {
    Object.keys(prices.RAW).forEach(symbol => {
      currentPrices[symbol] = prices.RAW[symbol].IDR.PRICE;
    });
  }

  const totalValue = getTotalValue(currentPrices);
  const totalUnrealizedPnl = positions.reduce((acc, pos) => {
    const currentPrice = currentPrices[pos.symbol] || pos.entryPrice;
    return acc + (pos.amount * (currentPrice - pos.entryPrice));
  }, 0);

  const totalPerformance = totalValue - 100000000;
  const perfPercent = (totalPerformance / 100000000) * 100;

  const formattedBalance = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(totalValue);

  const formatIDR = (val: number) => new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
    signDisplay: 'always'
  }).format(val);

  return (
    <section className="text-white">
      <div className="flex justify-between items-center mb-10">
        <div className="flex bg-white/20 p-1 rounded-full backdrop-blur-md">
            <button className="px-4 py-1 bg-white text-[#06b6d4] rounded-full text-xs font-bold shadow-sm">Trading</button>
            <button className="px-4 py-1 text-white opacity-60 text-xs font-bold">Invest</button>
        </div>
        <div className="flex gap-4">
            <Search className="w-5 h-5 text-white/70" />
            <div className="relative">
              <Bell className="w-5 h-5 text-white/70" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-400 rounded-full border border-cyan-500"></span>
            </div>
            <User className="w-5 h-5 text-white/70" />
        </div>
      </div>
      
      <div className="mb-8">
        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200 mb-1 flex items-center gap-2">
          Live Portfolio Value
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]"></span>
        </div>
        <motion.div 
          key={totalValue}
          initial={{ opacity: 0.8, scale: 0.99 }} 
          animate={{ opacity: 1, scale: 1 }}
          className="text-4xl font-black tracking-tight mb-4 text-white drop-shadow-md"
        >
          {formattedBalance}
        </motion.div>
        
        <div className="flex gap-2">
          <div className="bg-white/10 backdrop-blur-md px-3 py-2 rounded-2xl border border-white/10 flex flex-col flex-1">
            <span className="text-[8px] font-black uppercase text-white/40 mb-0.5">Floating PnL</span>
            <motion.span 
              key={totalUnrealizedPnl}
              initial={{ opacity: 0.5 }} animate={{ opacity: 1 }}
              className={`text-xs font-black ${totalUnrealizedPnl >= 0 ? 'text-green-300' : 'text-red-300'}`}
            >
              {formatIDR(totalUnrealizedPnl)}
            </motion.span>
          </div>
          <div className="bg-white/10 backdrop-blur-md px-3 py-2 rounded-2xl border border-white/10 flex flex-col flex-1">
            <span className="text-[8px] font-black uppercase text-white/40 mb-0.5">Realized Profit</span>
            <span className={`text-xs font-black text-cyan-200`}>
              {formatIDR(totalRealizedPnl)}
            </span>
          </div>
          <div className={`bg-white/10 backdrop-blur-md px-3 py-2 rounded-2xl border border-white/10 flex flex-col flex-1 ${totalPerformance >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
            <span className="text-[8px] font-black uppercase text-white/40 mb-0.5">Total Yield</span>
            <span className={`text-xs font-black ${totalPerformance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {totalPerformance >= 0 ? '+' : ''}{perfPercent.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

      <div className="flex justify-between gap-2">
           {[ {icon: BookOpen, label: 'Academy'}, {icon: Repeat, label: 'Recurring'}, {icon: MessageCircle, label: 'Live Chat'}, {icon: MessageSquare, label: 'Chat Room'} ].map(item => (
               <div key={item.label} className="flex flex-col items-center gap-2">
                   <div className="bg-white/20 p-4 rounded-2xl"><item.icon className="w-6 h-6" /></div>
                   <span className="text-xs">{item.label}</span>
               </div>
           ))}
      </div>
    </section>
  );
}
