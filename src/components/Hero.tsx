import React from 'react';
import { Bell, User, Search, BookOpen, Repeat, MessageCircle, MessageSquare, Orbit, Swords, Gift } from 'lucide-react';
import { motion } from 'motion/react';

import { useTrading } from '../context/TradingContext';

export function Hero({ prices, onTabChange }: { prices?: any; onTabChange: (tab: any) => void }) {
  const { balance, positions, orders, getTotalValue, getUnrealizedPnl, totalRealizedPnl, accountNumber } = useTrading();
  
  const currentUsdtRate = prices?.RAW?.USDT?.IDR?.PRICE || 16150;
  
  const currentPricesUsdt: Record<string, number> = {};
  if (prices && prices.RAW) {
    Object.keys(prices.RAW).forEach(symbol => {
      currentPricesUsdt[symbol] = prices.RAW[symbol].IDR.PRICE_USDT || (prices.RAW[symbol].IDR.PRICE / currentUsdtRate);
    });
  }

  const totalValueUsdt = getTotalValue(currentPricesUsdt);
  const totalValueIdr = totalValueUsdt * currentUsdtRate;
  
  const totalUnrealizedPnlUsdt = getUnrealizedPnl(currentPricesUsdt);
  const totalUnrealizedPnlIdr = totalUnrealizedPnlUsdt * currentUsdtRate;

  // Dynamically calculate the total net deposits made into the exchange (initial cost/funding basis)
  const netExchangeDepositsIdr = orders
    ? orders
        .filter(o => o.type === 'deposit_to_exchange')
        .reduce((acc, o) => acc + (o.amount || 0), 0) -
      orders
        .filter(o => o.type === 'withdraw_from_exchange')
        .reduce((acc, o) => acc + (o.amount || 0), 0)
    : 0;

  // Use the user's actual deposits as cost basis. Fallback to (totalValueIdr - totalUnrealizedPnlIdr) if no deposits are registered.
  const initialCostBasisIdr = netExchangeDepositsIdr > 0 
    ? netExchangeDepositsIdr 
    : (totalValueIdr - totalUnrealizedPnlIdr);

  const totalPerformanceIdr = totalValueIdr - initialCostBasisIdr;
  const perfPercent = initialCostBasisIdr > 0 
    ? (totalPerformanceIdr / initialCostBasisIdr) * 100 
    : 0;

  const totalPerformanceUsdt = totalPerformanceIdr / currentUsdtRate;

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
    { icon: Gift, label: 'Events & Rewards', tab: 'arena' },
    { icon: MessageCircle, label: 'Live Chat', tab: 'chat' },
    { icon: MessageSquare, label: 'Chat Room', tab: 'chatroom' }
  ];

  return (
    <motion.section 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="relative text-white pt-14 pb-24 px-6 md:p-8 md:pb-24 overflow-hidden md:rounded-t-[48px] rounded-b-[48px] shadow-2xl"
    >
      {/* Sophisticated Background */}
      <div className="absolute inset-0 z-0 bg-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-950 to-slate-950"></div>
        <div className="absolute -top-32 -left-32 w-[600px] h-[600px] bg-cyan-900/20 rounded-full blur-[150px]" />
        <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] bg-violet-900/20 rounded-full blur-[120px]" />
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
      </div>

      <div className="relative z-10 flex flex-col max-w-7xl mx-auto w-full">
        <div className="flex justify-between items-center mb-10 overflow-x-hidden">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20">
              <Orbit className="w-5 h-5 text-cyan-400" />
            </div>
            <span className="font-black tracking-tighter text-lg">AETHEREX</span>
          </div>
          <div className="flex gap-4 items-center">
            <Search className="w-5 h-5 text-white/70 hidden sm:block" />
            <div className="relative">
              <Bell className="w-5 h-5 text-white/70" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-400 rounded-full border border-cyan-500"></span>
            </div>
            <div 
              className="flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-2xl px-4 py-2 cursor-pointer hover:bg-white/20 transition-all group border border-white/10 shadow-lg"
              onClick={() => {
                if (accountNumber) {
                  navigator.clipboard.writeText(accountNumber);
                }
              }}
            >
              <div className="bg-cyan-500/20 p-1.5 rounded-lg">
                <User className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-black leading-none tracking-tight">{accountNumber || 'Loading...'}</span>
                <span className="text-[8px] text-white/40 uppercase font-black mt-1 group-hover:text-cyan-300 transition-colors">Nomor Akun • Copy</span>
              </div>
            </div>
          </div>
        </div>
      
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-end">
          <div className="space-y-6">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200 mb-1 flex items-center gap-2">
                Live Portfolio Value
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]"></span>
              </div>
              <div className="text-4xl md:text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-cyan-200 drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                {formattedBalance}
              </div>
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

          <div className="flex justify-between items-center gap-2">
               {heroMenu.map(item => (
                   <button 
                    key={item.label} 
                    onClick={() => onTabChange(item.tab)}
                    className="flex flex-col items-center gap-2 group outline-none flex-1 min-w-0"
                   >
                       <div className="bg-white/10 backdrop-blur-md p-4 rounded-3xl group-hover:bg-cyan-500 group-hover:text-white group-active:scale-95 transition-all w-full flex items-center justify-center aspect-square md:aspect-auto md:h-16 border border-white/10">
                         <item.icon className="w-6 h-6" />
                       </div>
                       <span className="text-[9px] font-bold uppercase tracking-tight truncate w-full text-center text-white/60 group-hover:text-white transition-colors">{item.label}</span>
                   </button>
               ))}
          </div>
        </div>
      </div>
    </motion.section>
  );
}
