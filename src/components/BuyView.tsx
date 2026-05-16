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
    <div className="p-6 pb-24 space-y-8 bg-white min-h-screen">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-black tracking-tight text-gray-900">Quick Buy</h2>
        <p className="text-gray-500 text-sm">Purchase crypto instantly with your IDR balance.</p>
      </div>

      <div className="space-y-4">
        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Choose Crypto</label>
        <div className="grid grid-cols-2 gap-3">
            {ASSETS.map(asset => (
                <button
                    key={asset.symbol}
                    onClick={() => setSelectedAsset(asset.symbol)}
                    className={`flex flex-col gap-3 p-5 rounded-[28px] border-2 transition-all ${
                        selectedAsset === asset.symbol 
                          ? 'border-purple-500 bg-purple-50 shadow-xl shadow-purple-500/5' 
                          : 'border-gray-50 bg-gray-50 hover:border-gray-200'
                    }`}
                >
                    <div className={`${asset.color} p-3 rounded-2xl text-white w-fit shadow-lg`}>
                        <asset.icon className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="font-black text-gray-900">{asset.symbol}</div>
                        <div className="text-[10px] font-bold text-gray-500 uppercase">{asset.name}</div>
                    </div>
                </button>
            ))}
        </div>
      </div>

      <div className="space-y-4">
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Payment (IDR)</label>
          <div className="relative group">
             <div className="absolute left-6 inset-y-0 flex items-center text-gray-400 font-bold">Rp</div>
             <input 
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-gray-50 border-2 border-gray-100 rounded-[28px] pl-14 pr-6 py-5 text-xl font-black focus:border-purple-500 focus:bg-white outline-none transition-all shadow-sm group-hover:border-gray-200"
                placeholder="Enter amount"
             />
          </div>
          <div className="flex gap-2">
            {['100000', '500000', '1000000'].map(val => (
              <button 
                key={val}
                onClick={() => setAmount(val)}
                className="px-4 py-2 bg-gray-50 rounded-xl text-[10px] font-black text-gray-500 hover:bg-gray-100 transition-colors uppercase tracking-widest"
              >
                Rp {parseInt(val).toLocaleString()}
              </button>
            ))}
          </div>
      </div>

      <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-[32px] p-6 text-white space-y-4 shadow-2xl">
         <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-white/60">
            <span>Market Price</span>
            <span>Est. Receive</span>
         </div>
         <div className="flex justify-between items-end">
            <div className="font-bold">Rp 1.042.842.100</div>
            <div className="text-2xl font-black">{ (parseInt(amount) / 1042842100).toFixed(6) } {selectedAsset}</div>
         </div>
         <div className="pt-4 border-t border-white/10 flex items-center gap-2">
             <Zap className="w-4 h-4 text-yellow-400 fill-yellow-400" />
             <span className="text-[10px] font-bold opacity-80 uppercase tracking-widest">Instant execution with low slippage</span>
         </div>
      </div>

      <button className="w-full bg-gray-900 text-white font-black py-5 rounded-[28px] shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3">
         <ShoppingCart className="w-5 h-5" />
         BUY NOW
         <ChevronRight className="w-5 h-5 opacity-50" />
      </button>
    </div>
  );
}
