import React from 'react';
import { Portfolio } from './Portfolio';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, CreditCard, Banknote, Shield } from 'lucide-react';
import { motion } from 'motion/react';
import { useTrading } from '../context/TradingContext';

export function AssetsView({ prices, loading }: { prices: any; loading: boolean }) {
  const { getTotalValue } = useTrading();
  
  const currentPrices: Record<string, number> = {};
  if (prices && prices.RAW) {
    Object.keys(prices.RAW).forEach(symbol => {
      currentPrices[symbol] = prices.RAW[symbol].IDR.PRICE;
    });
  }

  const totalValue = getTotalValue(currentPrices);

  return (
    <div className="py-4 space-y-6">
      <div className="px-6">
        <h2 className="font-bold text-2xl tracking-tight text-gray-900 mb-6 font-sans">Portfolio Explorer</h2>
        
        <div className="mb-8 p-6 bg-gradient-to-br from-cyan-600 via-blue-700 to-indigo-800 rounded-[32px] text-white shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
          <div className="relative z-10">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-2">Estimated Net Worth</div>
            <motion.div 
              key={totalValue}
              initial={{ scale: 0.98 }} animate={{ scale: 1 }}
              className="text-3xl font-black tracking-tight mb-4"
            >
              IDR {totalValue.toLocaleString('id-ID')}
            </motion.div>
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full backdrop-blur-md">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                <span className="text-[10px] font-bold">Live Market</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full backdrop-blur-md">
                <Shield className="w-3 h-3" />
                <span className="text-[10px] font-bold">Encrypted</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-5 rounded-[28px] text-white shadow-lg shadow-green-500/20">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-white/20 rounded-xl"><TrendingUp className="w-5 h-5" /></div>
              <div className="text-[10px] font-bold uppercase py-1 px-2 bg-white/20 rounded-full">Top Gain</div>
            </div>
            <div className="text-sm font-medium opacity-80">Profit (24h)</div>
            <div className="text-xl font-bold">+Rp 1.420k</div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-5 rounded-[28px] text-white shadow-lg shadow-blue-500/20">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-white/20 rounded-xl"><Banknote className="w-5 h-5" /></div>
            </div>
            <div className="text-sm font-medium opacity-80">Yield Rewards</div>
            <div className="text-xl font-bold">Rp 84.500</div>
          </div>
        </div>

        <div className="flex gap-4 mb-8">
            <button className="flex-1 bg-white border border-gray-100 p-4 rounded-2xl flex flex-col items-center gap-2 shadow-sm hover:border-cyan-200 transition-all group">
                <div className="bg-cyan-50 p-2 rounded-xl group-hover:scale-110 transition-transform"><ArrowUpRight className="text-cyan-600 w-5 h-5" /></div>
                <span className="text-xs font-bold text-gray-700">Receive</span>
            </button>
            <button className="flex-1 bg-white border border-gray-100 p-4 rounded-2xl flex flex-col items-center gap-2 shadow-sm hover:border-cyan-200 transition-all group">
                <div className="bg-blue-50 p-2 rounded-xl group-hover:scale-110 transition-transform"><ArrowDownRight className="text-blue-600 w-5 h-5" /></div>
                <span className="text-xs font-bold text-gray-700">Send</span>
            </button>
            <button className="flex-1 bg-white border border-gray-100 p-4 rounded-2xl flex flex-col items-center gap-2 shadow-sm hover:border-cyan-200 transition-all group">
                <div className="bg-purple-50 p-2 rounded-xl group-hover:scale-110 transition-transform"><CreditCard className="text-purple-600 w-5 h-5" /></div>
                <span className="text-xs font-bold text-gray-700">Buy</span>
            </button>
        </div>
      </div>

      <div className="bg-white rounded-t-[40px] pt-8 shadow-[0_-20px_40px_rgba(0,0,0,0.02)] min-h-[400px]">
        <Portfolio prices={prices} loading={loading} />
      </div>
    </div>
  );
}
