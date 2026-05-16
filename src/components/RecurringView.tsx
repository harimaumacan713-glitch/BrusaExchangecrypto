import React, { useState } from 'react';
import { Bitcoin, Calendar, Clock, DollarSign, ChevronRight, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const ASSETS = [
    { symbol: 'BTC', name: 'Bitcoin', color: 'bg-orange-500' },
    { symbol: 'ETH', name: 'Ethereum', color: 'bg-indigo-500' },
    { symbol: 'SOL', name: 'Solana', color: 'bg-purple-500' },
];

const FREQUENCIES = [
    { label: 'Daily', value: 'daily' },
    { label: 'Weekly', value: 'weekly' },
    { label: 'Monthly', value: 'monthly' },
];

export function RecurringView() {
  const [selectedAsset, setSelectedAsset] = useState('BTC');
  const [amount, setAmount] = useState('500000');
  const [frequency, setFrequency] = useState('weekly');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSuccess(true);
    setTimeout(() => setIsSuccess(false), 3000);
  };

  return (
    <div className="p-6 pb-24 space-y-8 bg-white min-h-screen">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-black tracking-tight text-gray-900">Auto Buy</h2>
        <p className="text-gray-500 text-sm">Dollar Cost Average (DCA) into your favorite assets automatically.</p>
      </div>

      <AnimatePresence mode="wait">
        {isSuccess ? (
          <motion.div 
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="flex flex-col items-center justify-center py-20 text-center space-y-4"
          >
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-2xl font-black text-gray-900">Plan Activated</h3>
            <p className="text-gray-500 max-w-[240px] mx-auto text-sm">
                Your recurring buy of Rp {parseInt(amount).toLocaleString()} {selectedAsset} is now active.
            </p>
          </motion.div>
        ) : (
          <motion.form 
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onSubmit={handleSubmit}
            className="space-y-8"
          >
            {/* Asset Selection */}
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Select Asset</label>
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
                {ASSETS.map(asset => (
                  <button
                    key={asset.symbol}
                    type="button"
                    onClick={() => setSelectedAsset(asset.symbol)}
                    className={`flex items-center gap-3 px-6 py-4 rounded-[24px] border-2 transition-all min-w-fit ${
                      selectedAsset === asset.symbol 
                        ? 'border-cyan-500 bg-cyan-50 shadow-lg shadow-cyan-500/10' 
                        : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <div className={`${asset.color} p-2 rounded-xl text-white`}>
                      <Bitcoin className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                       <div className="font-bold text-sm text-gray-900">{asset.symbol}</div>
                       <div className="text-[10px] text-gray-500">{asset.name}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Amount Input */}
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Monthly Investment</label>
              <div className="relative group">
                 <div className="absolute left-6 inset-y-0 flex items-center text-gray-400 font-bold">Rp</div>
                 <input 
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-[28px] pl-14 pr-6 py-5 text-xl font-black focus:border-cyan-500 focus:bg-white outline-none transition-all shadow-sm group-hover:border-gray-200"
                    placeholder="Enter amount"
                 />
              </div>
              <div className="flex gap-2">
                {['100000', '500000', '1000000'].map(val => (
                  <button 
                    key={val}
                    type="button"
                    onClick={() => setAmount(val)}
                    className="px-4 py-2 bg-gray-50 rounded-xl text-[10px] font-black text-gray-500 hover:bg-gray-100 transition-colors uppercase tracking-widest"
                  >
                    Rp {parseInt(val).toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* Frequency */}
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Frequency</label>
              <div className="grid grid-cols-3 gap-3">
                {FREQUENCIES.map(freq => (
                  <button
                    key={freq.value}
                    type="button"
                    onClick={() => setFrequency(freq.value)}
                    className={`p-4 rounded-2xl border-2 font-bold text-xs transition-all ${
                      frequency === freq.value 
                        ? 'border-gray-900 bg-gray-900 text-white shadow-xl' 
                        : 'border-gray-100 text-gray-500 hover:border-gray-200'
                    }`}
                  >
                    {freq.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6 bg-cyan-50 rounded-[32px] border border-cyan-100 space-y-4">
               <div className="flex items-center gap-3">
                  <div className="bg-cyan-500 p-2 rounded-xl text-white"><Clock className="w-4 h-4" /></div>
                  <div className="text-sm font-bold text-cyan-900">Strategy Insights</div>
               </div>
               <p className="text-xs text-cyan-700 leading-relaxed font-medium">
                  Investing Rp {parseInt(amount).toLocaleString()} {frequency} in {selectedAsset} could have yielded <span className="font-black">+24.5%</span> in the last 12 months.
               </p>
            </div>

            <button 
                type="submit"
                className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-black py-5 rounded-[28px] shadow-2xl shadow-cyan-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
                START AUTO BUY
                <ChevronRight className="w-5 h-5" />
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
