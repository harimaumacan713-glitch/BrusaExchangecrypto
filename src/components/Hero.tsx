import React from 'react';
import { Bell, User, Search, BookOpen, Repeat, MessageCircle, MessageSquare } from 'lucide-react';
import { motion } from 'motion/react';

import { useTrading } from '../context/TradingContext';

export function Hero({ prices, onTabChange }: { prices?: any; onTabChange: (tab: any) => void }) {
  const { balance, positions, getTotalValue, totalRealizedPnl } = useTrading();
  
  const currentPricesUsdt: Record<string, number> = {};
  if (prices && prices.RAW) {
    Object.keys(prices.RAW).forEach(symbol => {
      currentPricesUsdt[symbol] = prices.RAW[symbol].IDR.PRICE_USDT || (prices.RAW[symbol].IDR.PRICE / 16150);
    });
  }

  const totalValueUsdt = getTotalValue(currentPricesUsdt);
  const totalValueIdr = totalValueUsdt * 16150;
  
  const totalUnrealizedPnlUsdt = positions.reduce((acc, pos) => {
    const currentPrice = currentPricesUsdt[pos.symbol] || pos.entryPrice;
    return acc + (pos.amount * (currentPrice - pos.entryPrice));
  }, 0);
  const totalUnrealizedPnlIdr = totalUnrealizedPnlUsdt * 16150;

  const totalPerformanceUsdt = totalValueUsdt - 10000; // 10k USDT initial
  const perfPercent = (totalPerformanceUsdt / 10000) * 100;

  const formattedBalance = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(totalValueIdr);

  const formatIDR = (val: number) => new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
    signDisplay: 'always'
  }).format(val);

  const heroMenu = [
    { icon: BookOpen, label: 'Academy', tab: 'academy' },
    { icon: Repeat, label: 'Recurring', tab: 'recurring' },
    { icon: MessageCircle, label: 'Live Chat', tab: 'chat' },
    { icon: MessageSquare, label: 'Chat Room', tab: 'chatroom' }
  ];

  return (
    <section className="relative text-white p-6 pb-24 overflow-hidden rounded-b-[48px] shadow-2xl">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-blue-900 to-black"></div>
        <div className="absolute -top-24 -left-24 w-[500px] h-[500px] bg-cyan-600/20 rounded-full blur-[120px]" />
        <div className="absolute -bottom-24 -right-24 w-[400px] h-[400px] bg-blue-600/20 rounded-full blur-[100px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.2] brightness-150 contrast-150"></div>
      </div>

      <div className="relative z-10 flex flex-col">
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
        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200 mb-1 flex items-center justify-between">
          <div className="flex items-center gap-2">
            Live Portfolio Value
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]"></span>
          </div>
          <span className="text-[8px] opacity-60">Live from Binance</span>
        </div>
        <div className="text-4xl font-black tracking-tight mb-4 text-white drop-shadow-md">
          {formattedBalance}
        </div>
        
        <div className="flex gap-2">
          <div className="bg-white/10 backdrop-blur-md px-3 py-2 rounded-2xl border border-white/10 flex flex-col flex-1">
            <span className="text-[8px] font-black uppercase text-white/40 mb-0.5">Floating PnL</span>
            <span className={`text-xs font-black ${totalUnrealizedPnlIdr >= 0 ? 'text-green-300' : 'text-red-300'}`}>
              {formatIDR(totalUnrealizedPnlIdr)}
            </span>
          </div>
          <div className="bg-white/10 backdrop-blur-md px-3 py-2 rounded-2xl border border-white/10 flex flex-col flex-1">
            <span className="text-[8px] font-black uppercase text-white/40 mb-0.5">Realized Profit</span>
            <span className={`text-xs font-black text-cyan-200`}>
              ${totalRealizedPnl.toFixed(2)} USDT
            </span>
          </div>
          <div className={`bg-white/10 backdrop-blur-md px-3 py-2 rounded-2xl border border-white/10 flex flex-col flex-1 ${totalPerformanceUsdt >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
            <span className="text-[8px] font-black uppercase text-white/40 mb-0.5">Total Yield</span>
            <span className={`text-xs font-black ${totalPerformanceUsdt >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {totalPerformanceUsdt >= 0 ? '+' : ''}{perfPercent.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center gap-1">
           {heroMenu.map(item => (
               <button 
                key={item.label} 
                onClick={() => onTabChange(item.tab)}
                className="flex flex-col items-center gap-1.5 group outline-none flex-1 min-w-0"
               >
                   <div className="bg-white/20 p-3 sm:p-4 rounded-2xl group-hover:bg-white/30 group-active:scale-95 transition-all">
                     <item.icon className="w-5 h-5 sm:w-6 h-6" />
                   </div>
                   <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-tight truncate w-full text-center">{item.label}</span>
               </button>
           ))}
      </div>
    </div>
  </section>
);
}
