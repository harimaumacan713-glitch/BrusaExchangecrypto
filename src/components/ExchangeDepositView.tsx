import React, { useState } from 'react';
import { ArrowLeftRight, Loader2, Info, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTrading } from '../context/TradingContext';

export function ExchangeDepositView() {
  const { eWalletBalance, balance: exchangeBalance, depositToExchange, withdrawFromExchange } = useTrading();
  const [mode, setMode] = useState<'deposit' | 'withdraw'>('deposit');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const handleTransfer = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    setLoading(true);
    setStatus(null);

    const val = parseFloat(amount);
    let success = false;

    if (mode === 'deposit') {
      success = await depositToExchange(val);
    } else {
      success = await withdrawFromExchange(val);
    }

    if (success) {
      setStatus({ type: 'success', message: `${mode === 'deposit' ? 'Deposit to' : 'Withdraw from'} Exchange successful!` });
      setAmount('');
    } else {
      setStatus({ type: 'error', message: `Transfer failed. Check your balance.` });
    }
    setLoading(false);
    setTimeout(() => setStatus(null), 3000);
  };

  return (
    <div className="p-6 space-y-8 min-h-screen bg-white">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-black tracking-tight text-gray-900">Exchange Fund</h2>
        <p className="text-gray-500 text-sm">Move balance between E-Wallet and Trading Exchange.</p>
      </div>

      <div className="flex p-1 bg-gray-100 rounded-2xl">
        <button 
          onClick={() => setMode('deposit')}
          className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${mode === 'deposit' ? 'bg-cyan-500 text-white shadow-md' : 'text-gray-400'}`}
        >
          Deposit to Exchange
        </button>
        <button 
          onClick={() => setMode('withdraw')}
          className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${mode === 'withdraw' ? 'bg-indigo-500 text-white shadow-md' : 'text-gray-400'}`}
        >
          Withdraw to Wallet
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-5 bg-gray-50 border border-gray-100 rounded-3xl">
          <div className="text-[10px] font-black tracking-widest uppercase text-gray-400 mb-1">E-Wallet</div>
          <div className="text-lg font-black text-gray-900 truncate">Rp {eWalletBalance.toLocaleString()}</div>
        </div>
        <div className="p-5 bg-cyan-50 border border-cyan-100/50 rounded-3xl">
          <div className="text-[10px] font-black tracking-widest uppercase text-cyan-600 mb-1">Exchange</div>
          <div className="text-lg font-black text-cyan-900 truncate">Rp {exchangeBalance.toLocaleString()}</div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Transfer Amount (IDR)</label>
          <button 
            onClick={() => setAmount((mode === 'deposit' ? eWalletBalance : exchangeBalance).toString())}
            className="text-[10px] font-black uppercase tracking-widest text-cyan-600"
          >
            Max Amount
          </button>
        </div>
        <div className="relative group">
          <div className="absolute left-6 inset-y-0 flex items-center text-gray-400 font-bold">Rp</div>
          <input 
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-gray-50 border-2 border-gray-100 rounded-[28px] pl-14 pr-6 py-5 text-xl font-black focus:border-cyan-500 focus:bg-white outline-none transition-all"
            placeholder="0"
          />
        </div>
      </div>

      <AnimatePresence>
        {status && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`p-4 rounded-2xl flex items-center gap-3 border ${status.type === 'success' ? 'bg-green-50 border-green-100 text-green-600' : 'bg-red-50 border-red-100 text-red-600'}`}
          >
            {status.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <Info className="w-5 h-5" />}
            <span className="text-xs font-bold">{status.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <button 
        onClick={handleTransfer}
        disabled={loading || !amount || parseFloat(amount) <= 0}
        className={`group w-full p-5 ${mode === 'deposit' ? 'bg-gray-900' : 'bg-indigo-600'} text-white font-black rounded-[28px] shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50`}
      >
        {loading ? <Loader2 className="animate-spin" /> : (
          <>
            <ArrowLeftRight className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
            CONFIRM {mode.toUpperCase()}
          </>
        )}
      </button>

      <div className="bg-blue-50 border border-blue-100 p-6 rounded-[32px] flex gap-4">
        <div className="bg-blue-100 p-2 h-fit rounded-xl">
           <Info className="w-5 h-5 text-blue-600" />
        </div>
        <div className="space-y-1">
            <h4 className="font-bold text-blue-900 text-sm">Instant Transfer</h4>
            <p className="text-xs text-blue-800 opacity-80 leading-relaxed">
                Internal transfers between your wallets are processed instantly with zero fees.
            </p>
        </div>
      </div>
    </div>
  );
}
