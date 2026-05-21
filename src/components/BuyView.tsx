import React, { useState } from 'react';
import { ShoppingCart, Bitcoin, Coins, ShipWheel, ChevronRight, Zap, Target } from 'lucide-react';
import { motion } from 'motion/react';

const ASSETS = [
    { symbol: 'BTC', name: 'Bitcoin', color: 'bg-orange-500', icon: Bitcoin },
    { symbol: 'ETH', name: 'Ethereum', color: 'bg-indigo-500', icon: Coins },
    { symbol: 'SOL', name: 'Solana', color: 'bg-purple-500', icon: ShipWheel },
    { symbol: 'USDT', name: 'Tether', color: 'bg-green-500', icon: Target },
];

export function BuyView() {
  const [selectedAsset, setSelectedAsset] = useState('BTC');
  const [amount, setAmount] = useState('1000000');

  return (
    <div className="p-8 space-y-8 bg-slate-950 flex-1 flex flex-col items-center">
      <div className="w-full max-w-lg space-y-8">
        <div className="flex flex-col gap-2 mb-8">
          <h2 className="text-3xl font-black tracking-tighter text-white">Quick Buy</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Purchase crypto instantly with your IDR balance.</p>
        </div>

        <div className="space-y-4">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-2 block">Choose Crypto</label>
          <div className="grid grid-cols-2 gap-3">
              {ASSETS.map(asset => (
                  <button
                      key={asset.symbol}
                      onClick={() => setSelectedAsset(asset.symbol)}
                      className={`flex flex-col gap-3 p-5 rounded-[28px] border-2 transition-all ${
                          selectedAsset === asset.symbol 
                            ? 'border-indigo-500 bg-indigo-500/10 shadow-xl shadow-indigo-500/10' 
                            : 'border-slate-800 bg-slate-900 hover:border-indigo-500/50 hover:bg-slate-800'
                      }`}
                  >
                      <div className={`${asset.color} p-3 rounded-2xl text-white w-fit shadow-lg`}>
                          <asset.icon className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                          <div className={`font-black tracking-tight ${selectedAsset === asset.symbol ? 'text-indigo-400' : 'text-white'}`}>{asset.symbol}</div>
                          <div className="text-[10px] font-bold text-slate-500 uppercase">{asset.name}</div>
                      </div>
                  </button>
              ))}
          </div>
        </div>

        <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-2 block">Total Payment (IDR)</label>
            <div className="relative group">
               <div className="absolute left-6 inset-y-0 flex items-center text-slate-500 font-bold">Rp</div>
               <input 
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-slate-900 border-2 border-slate-800 rounded-[32px] pl-16 pr-6 py-6 text-2xl font-black focus:border-indigo-500 focus:bg-slate-800 outline-none transition-all text-white placeholder:text-slate-700 shadow-inner"
                  placeholder="Enter amount"
               />
            </div>
            <div className="flex gap-2 px-1">
              {['100000', '500000', '1000000'].map(val => (
                <button 
                  key={val}
                  onClick={() => setAmount(val)}
                  className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-[10px] font-black text-slate-400 hover:bg-indigo-500/10 hover:text-indigo-400 hover:border-indigo-500/30 transition-colors uppercase tracking-widest shadow-inner"
                >
                  Rp {parseInt(val).toLocaleString()}
                </button>
              ))}
            </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-[32px] p-6 text-white space-y-4 shadow-xl relative overflow-hidden group hover:border-indigo-500/30 transition-colors">
           <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500 relative z-10">
              <span>Market Price</span>
              <span>Est. Receive</span>
           </div>
           <div className="flex justify-between items-end relative z-10">
              <div className="font-bold text-slate-300">Rp 1.042.842.100</div>
              <div className="text-2xl font-black text-indigo-400">{ (parseInt(amount) / 1042842100).toFixed(6) } <span className="text-sm text-slate-500">{selectedAsset}</span></div>
           </div>
           <div className="pt-5 mt-5 border-t border-slate-800 flex items-center gap-3 relative z-10 group-hover:border-indigo-500/30 transition-colors">
               <div className="bg-amber-500/10 p-2 rounded-xl">
                 <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
               </div>
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Instant execution with low slippage</span>
           </div>
           <div className="absolute -top-10 -right-10 opacity-5 group-hover:scale-110 transition-transform duration-700">
             <ShoppingCart className="w-48 h-48 text-indigo-400" />
           </div>
        </div>

        <button className="w-full mt-8 py-5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-black uppercase tracking-widest text-lg rounded-[32px] shadow-xl shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 border border-transparent">
           <ShoppingCart className="w-6 h-6" />
           BUY NOW
           <ChevronRight className="w-6 h-6 opacity-50" />
        </button>
      </div>
    </div>
  );
}
