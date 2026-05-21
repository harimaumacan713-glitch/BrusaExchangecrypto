import React from 'react';
import { Portfolio } from './Portfolio';
import { TrendingUp, ArrowUpRight, ArrowDownRight, CreditCard, Banknote, Shield, Orbit, X, ArrowLeftRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTrading } from '../context/TradingContext';
import { WithdrawView } from './WithdrawView';
import { DepositView } from './DepositView';
import { BuyView } from './BuyView';
import { TransferView } from './TransferView';
import { ReceiveView } from './ReceiveView';
import { ExchangeDepositView } from './ExchangeDepositView';

interface AssetsViewProps {
  prices: any;
  loading: boolean;
  activeAction: 'none' | 'withdraw' | 'deposit' | 'buy' | 'transfer' | 'receive' | 'exchange_transfer';
  onActionChange: (action: 'none' | 'withdraw' | 'deposit' | 'buy' | 'transfer' | 'receive' | 'exchange_transfer') => void;
}

export function AssetsView({ prices, loading, activeAction, onActionChange }: AssetsViewProps) {
  const { getTotalValue, eWalletBalance } = useTrading();
  
  const currentUsdtRate = prices?.RAW?.USDT?.IDR?.PRICE || 16150;
  
  const currentPricesUsdt: Record<string, number> = {};
  if (prices && prices.RAW) {
    Object.keys(prices.RAW).forEach(symbol => {
      currentPricesUsdt[symbol] = prices.RAW[symbol].IDR.PRICE_USDT || (prices.RAW[symbol].IDR.PRICE / currentUsdtRate);
    });
  }

  const totalValueUsdt = getTotalValue(currentPricesUsdt);
  const totalValue = totalValueUsdt * currentUsdtRate;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="py-4 space-y-6"
    >
      <div className="px-6 mx-auto max-w-7xl">
        <h2 className="font-black text-2xl tracking-tighter text-white mb-6 font-sans">Wallet & Assets</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* E-Wallet Managed Card */}
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-[32px] shadow-lg relative overflow-hidden group hover:border-indigo-500/30 transition-colors">
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-indigo-400">
                <Banknote className="w-6 h-6" />
              </div>
              <div className="text-right">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">E-Wallet</div>
                <div className="text-xl font-black text-white">Rp {eWalletBalance.toLocaleString()}</div>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 font-bold leading-relaxed relative z-10">Your main fund for deposit and withdrawal.</p>
            <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-indigo-500/10 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700" />
          </div>

          {/* Exchange/Trading Managed Card */}
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-[32px] shadow-lg relative overflow-hidden group hover:border-cyan-500/30 transition-colors">
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl text-cyan-400">
                <Orbit className="w-6 h-6" />
              </div>
              <div className="text-right">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Trading Balance</div>
                <div className="text-xl font-black text-white">IDR {(totalValue - eWalletBalance).toLocaleString()}</div>
              </div>
            </div>
            <button 
              onClick={() => onActionChange('exchange_transfer')}
              className="w-full mt-2 py-2.5 bg-slate-800 border border-slate-700 hover:bg-slate-700 hover:border-cyan-500/50 hover:text-cyan-400 text-slate-300 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 relative z-10 shadow-inner"
            >
              <ArrowLeftRight className="w-3 h-3 text-cyan-500" />
              Manage Exchange Fund
            </button>
            <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-cyan-500/5 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700" />
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
            <button 
              onClick={() => onActionChange('deposit')}
              className="flex-1 bg-slate-900 border border-slate-800 p-4 rounded-[28px] flex flex-col items-center gap-3 shadow-lg hover:border-cyan-500/50 transition-all group hover:bg-slate-800/80"
            >
                <div className="bg-slate-800 border border-slate-700 p-3 rounded-[20px] shadow-inner group-hover:scale-110 group-hover:bg-cyan-500/10 group-hover:border-cyan-500/30 transition-all"><ArrowUpRight className="text-cyan-400 w-5 h-5" /></div>
                <span className="text-xs font-black uppercase tracking-widest text-slate-400 group-hover:text-cyan-400">Deposit</span>
            </button>
            <button 
              onClick={() => onActionChange('withdraw')}
              className="flex-1 bg-slate-900 border border-slate-800 p-4 rounded-[28px] flex flex-col items-center gap-3 shadow-lg hover:border-rose-500/50 transition-all group hover:bg-slate-800/80"
            >
                <div className="bg-slate-800 border border-slate-700 p-3 rounded-[20px] shadow-inner group-hover:scale-110 group-hover:bg-rose-500/10 group-hover:border-rose-500/30 transition-all"><ArrowDownRight className="text-rose-400 w-5 h-5" /></div>
                <span className="text-xs font-black uppercase tracking-widest text-slate-400 group-hover:text-rose-400">Withdraw</span>
            </button>
            <button 
              onClick={() => onActionChange('transfer')}
              className="flex-1 bg-slate-900 border border-slate-800 p-4 rounded-[28px] flex flex-col items-center gap-3 shadow-lg hover:border-indigo-500/50 transition-all group hover:bg-slate-800/80"
            >
                <div className="bg-slate-800 border border-slate-700 p-3 rounded-[20px] shadow-inner group-hover:scale-110 group-hover:bg-indigo-500/10 group-hover:border-indigo-500/30 transition-all"><CreditCard className="text-indigo-400 w-5 h-5" /></div>
                <span className="text-xs font-black uppercase tracking-widest text-slate-400 group-hover:text-indigo-400">Transfer</span>
            </button>
            <button 
              onClick={() => onActionChange('receive')}
              className="flex-1 bg-slate-900 border border-slate-800 p-4 rounded-[28px] flex flex-col items-center gap-3 shadow-lg hover:border-emerald-500/50 transition-all group hover:bg-slate-800/80"
            >
                <div className="bg-slate-800 border border-slate-700 p-3 rounded-[20px] shadow-inner group-hover:scale-110 group-hover:bg-emerald-500/10 group-hover:border-emerald-500/30 transition-all"><CreditCard className="text-emerald-400 w-5 h-5" /></div>
                <span className="text-xs font-black uppercase tracking-widest text-slate-400 group-hover:text-emerald-400">Receive</span>
            </button>
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="mx-auto max-w-7xl pt-2 pb-10"
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
            className="fixed inset-0 z-[60] bg-slate-950 flex flex-col overflow-y-auto"
          >
            <div className="p-6 flex justify-between items-center border-b border-slate-800">
               <h3 className="font-black text-lg tracking-tight uppercase text-white">
                {activeAction === 'withdraw' ? 'WITHDRAW FUNDS' : 
                 activeAction === 'deposit' ? 'DEPOSIT FUNDS' : 
                 activeAction === 'transfer' ? 'TRANSFER FUNDS' : 
                 activeAction === 'receive' ? 'RECEIVE FUNDS' : 
                 activeAction === 'exchange_transfer' ? 'EXCHANGE FUND' : 'QUICK BUY'}
               </h3>
               <button 
                onClick={() => onActionChange('none')}
                className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors"
               >
                 <X className="w-6 h-6 text-slate-400" />
               </button>
            </div>
            <div className="flex-1">
              {activeAction === 'withdraw' && <WithdrawView />}
              {activeAction === 'deposit' && <DepositView />}
              {activeAction === 'transfer' && <TransferView />}
              {activeAction === 'receive' && <ReceiveView />}
              {activeAction === 'buy' && <BuyView />}
              {activeAction === 'exchange_transfer' && <ExchangeDepositView />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
