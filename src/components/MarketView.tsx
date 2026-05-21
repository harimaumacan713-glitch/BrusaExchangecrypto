import React from 'react';
import { LiveMarket } from './LiveMarket';
import { Search, Filter, TrendingUp, TrendingDown, Clock } from 'lucide-react';

export function MarketView({ prices, loading }: { prices: any; loading: boolean }) {
  return (
    <div className="py-6 px-4">
      <div className="px-2 mb-8">
        <h2 className="font-black text-3xl tracking-tighter text-white mb-6">Market Trends</h2>
        
        <div className="flex gap-3 mb-6 overflow-x-auto pb-2 scrollbar-none">
            {['All', 'Gainers', 'Losers', 'New', 'DeFi', 'NFT'].map((cat, i) => (
                <button key={cat} className={`px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all ${i === 0 ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20' : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'}`}>
                    {cat}
                </button>
            ))}
        </div>

        <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
            <input 
                type="text" 
                placeholder="Search assets..." 
                className="w-full bg-slate-900 border border-slate-700 py-4 pl-12 pr-4 rounded-2xl text-sm outline-none focus:border-cyan-700 transition-all font-medium text-white placeholder-slate-600"
            />
        </div>
      </div>

      <div className="bg-slate-900 rounded-[32px] pt-8 shadow-2xl min-h-[600px] border border-slate-800">
        <div className="px-6 flex justify-between items-center mb-6">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5" />
                Updated: Just now
            </div>
            <button className="p-2 bg-slate-800 rounded-xl border border-slate-700"><Filter className="w-4 h-4 text-slate-400" /></button>
        </div>
        <LiveMarket prices={prices} loading={loading} />
      </div>
    </div>
  );
}

