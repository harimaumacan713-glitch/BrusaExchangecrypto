import React from 'react';
import { LiveMarket } from './LiveMarket';
import { Search, Filter, TrendingUp, TrendingDown, Clock } from 'lucide-react';

export function MarketView({ prices, loading }: { prices: any; loading: boolean }) {
  return (
    <div className="py-4">
      <div className="px-6 mb-8">
        <h2 className="font-bold text-2xl tracking-tight text-gray-900 mb-6">Market Trends</h2>
        
        <div className="flex gap-4 mb-6 overflow-x-auto pb-2 scrollbar-none">
            {['All', 'Gainers', 'Losers', 'New', 'DeFi', 'NFT'].map((cat, i) => (
                <button key={cat} className={`px-5 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${i === 0 ? 'bg-[#06b6d4] text-white shadow-lg shadow-cyan-500/20' : 'bg-white border border-gray-100 text-gray-500 hover:border-cyan-100'}`}>
                    {cat}
                </button>
            ))}
        </div>

        <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 w-5 h-5" />
            <input 
                type="text" 
                placeholder="Search assets..." 
                className="w-full bg-white border border-gray-100 py-4 pl-12 pr-4 rounded-2xl text-sm outline-none focus:border-cyan-200 transition-all font-medium"
            />
        </div>
      </div>

      <div className="bg-white rounded-t-[40px] pt-8 shadow-[0_-20px_40px_rgba(0,0,0,0.02)] min-h-[600px]">
        <div className="px-6 flex justify-between items-center mb-6">
            <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase tracking-wider">
                <Clock className="w-3 h-3" />
                Updated: Just now
            </div>
            <button className="p-2 bg-gray-50 rounded-xl"><Filter className="w-4 h-4 text-gray-400" /></button>
        </div>
        <LiveMarket prices={prices} loading={loading} />
      </div>
    </div>
  );
}
