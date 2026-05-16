import React from 'react';
import { Portfolio } from './Portfolio';
import { TrendingUp, ArrowUpRight, ArrowDownRight, CreditCard, Banknote, Shield, Orbit, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTrading } from '../context/TradingContext';
import { WithdrawView } from './WithdrawView';
import { DepositView } from './DepositView';
import { BuyView } from './BuyView';

interface AssetsViewProps {
  prices: any;
  loading: boolean;
  activeAction: 'none' | 'withdraw' | 'deposit' | 'buy';
  onActionChange: (action: 'none' | 'withdraw' | 'deposit' | 'buy') => void;
}

export function AssetsView({ prices, loading, activeAction, onActionChange }: AssetsViewProps) {
  const { getTotalValue } = useTrading();
  
  const currentPrices: Record<string, number> = {};
  if (prices && prices.RAW) {
    Object.keys(prices.RAW).forEach(symbol => {
      currentPrices[symbol] = prices.RAW[symbol].IDR.PRICE;
    });
  }

  const totalValue = getTotalValue(currentPrices);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="py-4 space-y-6"
    >
      <div className="px-6">
        <h2 className="font-bold text-2xl tracking-tight text-gray-900 mb-6 font-sans">Portfolio Explorer</h2>
        
        <div className="mb-8 p-8 bg-gradient-to-br from-blue-700 via-indigo-800 to-slate-900 rounded-[32px] text-white shadow-2xl relative overflow-hidden group border border-white/10">
          {/* Animated Background Elements */}
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0],
              x: [0, 50, 0],
              y: [0, -30, 0]
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute -top-24 -right-24 w-80 h-80 bg-cyan-400/20 rounded-full blur-[80px]"
          />
          <motion.div 
            animate={{ 
              scale: [1, 1.3, 1],
              rotate: [0, -90, 0],
              x: [0, -40, 0],
              y: [0, 60, 0]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-24 -left-24 w-80 h-80 bg-blue-500/20 rounded-full blur-[80px]"
          />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5 mix-blend-overlay"></div>
          
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200/60 mb-2">Portfolio Net Worth</div>
                <motion.div 
                  key={totalValue}
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="text-4xl font-black tracking-tighter"
                >
                  IDR {totalValue.toLocaleString('id-ID')}
                </motion.div>
              </div>
              <div className="bg-white/10 backdrop-blur-xl p-3 rounded-2xl border border-white/20">
                <Shield className="w-5 h-5 text-cyan-300" />
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex items-center gap-1.5 px-4 py-2 bg-white/5 rounded-full backdrop-blur-md border border-white/10">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(74,222,128,0.5)]"></span>
                <span className="text-[10px] font-black tracking-wider uppercase">Live Markets</span>
              </div>
              <div className="flex items-center gap-1.5 px-4 py-2 bg-white/5 rounded-full backdrop-blur-md border border-white/10">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                >
                  <Orbit className="w-3 h-3 text-cyan-400" />
                </motion.div>
                <span className="text-[10px] font-black tracking-wider uppercase text-cyan-100">Quantum Secured</span>
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

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex gap-4 mb-8"
        >
            <button 
              onClick={() => onActionChange('deposit')}
              className="flex-1 bg-white border border-gray-100 p-4 rounded-2xl flex flex-col items-center gap-2 shadow-sm hover:border-cyan-200 transition-all group"
            >
                <div className="bg-cyan-50 p-2 rounded-xl group-hover:scale-110 transition-transform"><ArrowUpRight className="text-cyan-600 w-5 h-5" /></div>
                <span className="text-xs font-bold text-gray-700">Deposit</span>
            </button>
            <button 
              onClick={() => onActionChange('withdraw')}
              className="flex-1 bg-white border border-gray-100 p-4 rounded-2xl flex flex-col items-center gap-2 shadow-sm hover:border-cyan-200 transition-all group"
            >
                <div className="bg-blue-50 p-2 rounded-xl group-hover:scale-110 transition-transform"><ArrowDownRight className="text-blue-600 w-5 h-5" /></div>
                <span className="text-xs font-bold text-gray-700">Withdraw</span>
            </button>
            <button 
              onClick={() => onActionChange('buy')}
              className="flex-1 bg-white border border-gray-100 p-4 rounded-2xl flex flex-col items-center gap-2 shadow-sm hover:border-cyan-200 transition-all group"
            >
                <div className="bg-purple-50 p-2 rounded-xl group-hover:scale-110 transition-transform"><CreditCard className="text-purple-600 w-5 h-5" /></div>
                <span className="text-xs font-bold text-gray-700">Buy</span>
            </button>
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="bg-white rounded-t-[40px] pt-8 shadow-[0_-20px_40px_rgba(0,0,0,0.02)] min-h-[400px]"
      >
        <Portfolio prices={prices} loading={loading} />
      </motion.div>

      {/* Action Modal Overlay */}
      <AnimatePresence>
        {activeAction !== 'none' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-white flex flex-col overflow-y-auto"
          >
            <div className="p-6 flex justify-between items-center border-b border-gray-100">
               <h3 className="font-black text-lg tracking-tight uppercase">
                {activeAction === 'withdraw' ? 'WITHDRAW FUNDS' : activeAction === 'deposit' ? 'DEPOSIT FUNDS' : 'QUICK BUY'}
               </h3>
               <button 
                onClick={() => onActionChange('none')}
                className="p-2 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors"
               >
                 <X className="w-6 h-6 text-gray-400" />
               </button>
            </div>
            <div className="flex-1">
              {activeAction === 'withdraw' && <WithdrawView />}
              {activeAction === 'deposit' && <DepositView />}
              {activeAction === 'buy' && <BuyView />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
