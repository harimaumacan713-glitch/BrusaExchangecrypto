import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Landmark, ArrowRight, ShieldCheck, Cpu, Wallet, AlertCircle, CheckCircle2, Orbit } from 'lucide-react';
import { useTrading } from '../context/TradingContext';

export function WithdrawView() {
  const { balance, withdraw } = useTrading();
  const [amount, setAmount] = useState('');
  const [projectId, setProjectId] = useState('');
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) {
      setErrorMessage('Project ID is required');
      setStatus('error');
      return;
    }
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      setErrorMessage('Enter a valid amount');
      setStatus('error');
      return;
    }

    setStatus('processing');
    
    // Simulate network delay for "Project Verification"
    await new Promise(r => setTimeout(r, 2000));

    const success = withdraw(projectId, val);
    
    if (success) {
      setStatus('success');
      setAmount('');
      setProjectId('');
    } else {
      setErrorMessage('Insufficient balance or invalid amount');
      setStatus('error');
    }
  };

  return (
    <div className="px-6 py-6 pb-32">
      <div className="flex flex-col gap-1 mb-8">
        <h2 className="text-2xl font-black tracking-tight text-gray-900 uppercase">Transfer Funding</h2>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
          <Cpu className="w-3 h-3 text-cyan-500" />
          AI Studio Inter-Project Protocol (ASIPP)
        </p>
      </div>

      <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[32px] p-6 text-white shadow-xl shadow-blue-200 mb-8 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-6">
            <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
              <Landmark className="w-6 h-6 text-white" />
            </div>
            <div className="text-right">
              <div className="text-blue-100/60 text-[10px] font-black uppercase tracking-widest">Available Balance</div>
              <div className="text-2xl font-black tracking-tight">${balance.toLocaleString()} <span className="text-sm opacity-60">USDT</span></div>
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "70%" }}
                    className="h-full bg-cyan-300"
                />
            </div>
            <div className="flex justify-between text-[8px] font-black uppercase text-blue-100/40">
                <span>Security Level: v3.2 High</span>
                <span>Encrypted Channel: Active</span>
            </div>
          </div>
        </div>
        <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-white/5 rounded-full blur-3xl"></div>
      </div>

      <form onSubmit={handleWithdraw} className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block ml-1">Destination Project ID / Wallet</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 transition-colors group-focus-within:text-indigo-500">
                <Orbit className="w-5 h-5" />
              </div>
              <input 
                type="text"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                placeholder="PROJ-XXXX-XXXX"
                className="w-full bg-white border-2 border-gray-100 rounded-2xl py-4 pl-12 pr-4 outline-none font-bold text-gray-900 group-focus-within:border-indigo-500 group-focus-within:shadow-lg group-focus-within:shadow-indigo-500/10 transition-all placeholder:text-gray-300"
              />
            </div>
          </div>

          <div>
             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block ml-1">Withdraw Amount (USDT)</label>
             <div className="relative group">
               <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 transition-colors group-focus-within:text-indigo-500">
                 <Wallet className="w-5 h-5" />
               </div>
               <input 
                 type="number"
                 step="0.01"
                 value={amount}
                 onChange={(e) => setAmount(e.target.value)}
                 placeholder="0.00"
                 className="w-full bg-white border-2 border-gray-100 rounded-2xl py-4 pl-12 pr-4 outline-none font-bold text-gray-900 group-focus-within:border-indigo-500 transition-all"
               />
               <button 
                 type="button"
                 onClick={() => setAmount(balance.toString())}
                 className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-indigo-500 hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors uppercase"
               >
                 Max
               </button>
             </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {status === 'error' && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-red-50 p-4 rounded-2xl border border-red-100 flex items-center gap-3 text-red-600"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-xs font-bold">{errorMessage}</p>
            </motion.div>
          )}

          {status === 'success' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-green-50 p-6 rounded-3xl border-2 border-green-200 flex flex-col items-center text-center gap-3 text-green-700"
            >
              <div className="bg-green-500 text-white p-3 rounded-full shadow-lg shadow-green-500/30">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <p className="font-black text-lg">Transfer Initiated!</p>
                <p className="text-xs font-medium opacity-80 leading-relaxed">Funds are being routed via AI Studio Secured Gateway to Project: <span className="underline font-bold">{projectId}</span></p>
              </div>
              <button 
                type="button"
                onClick={() => setStatus('idle')}
                className="mt-2 text-[10px] font-black bg-green-200/50 hover:bg-green-200 px-4 py-2 rounded-full transition-colors uppercase tracking-widest"
              >
                New Transfer
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {status === 'idle' || status === 'processing' || status === 'error' ? (
           <button 
           disabled={status === 'processing'}
           type="submit"
           className={`w-full py-5 rounded-[24px] font-black text-lg transition-all flex items-center justify-center gap-3 relative overflow-hidden ${
             status === 'processing' 
               ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
               : 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/50 active:scale-[0.98]'
           }`}
         >
           {status === 'processing' ? (
             <>
               <div className="w-5 h-5 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
               VERIFYING GATEWAY...
             </>
           ) : (
             <>
               TRANSFER FUNDS <ArrowRight className="w-5 h-5" />
             </>
           )}
           
           {status === 'processing' && (
              <motion.div 
                layoutId="loader"
                className="absolute bottom-0 left-0 h-1 bg-indigo-500"
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 2 }}
              />
           )}
         </button>
        ) : null}
      </form>

      <div className="mt-12 space-y-4">
        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Security Standards</h3>
        <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-white border border-gray-100 rounded-2xl">
                <ShieldCheck className="w-5 h-5 text-green-500 mb-2" />
                <div className="font-bold text-[11px] text-gray-900 leading-tight">ISO-27001 AI Encryption</div>
            </div>
            <div className="p-4 bg-white border border-gray-100 rounded-2xl">
                <Cpu className="w-5 h-5 text-indigo-500 mb-2" />
                <div className="font-bold text-[11px] text-gray-900 leading-tight">Project Sync v4.2</div>
            </div>
        </div>
      </div>
    </div>
  );
}
