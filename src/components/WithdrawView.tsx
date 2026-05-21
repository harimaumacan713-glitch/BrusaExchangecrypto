import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Landmark, ArrowRight, ShieldCheck, Cpu, Wallet, AlertCircle, CheckCircle2, Orbit } from 'lucide-react';
import { useTrading } from '../context/TradingContext';

export function WithdrawView() {
  const { balance, balanceUsdt, withdraw } = useTrading();
  const [amount, setAmount] = useState('');
  const [projectId, setProjectId] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState<'project' | 'bank' | 'ewallet'>('project');
  const [selectedBank, setSelectedBank] = useState('');
  const [selectedEWallet, setSelectedEWallet] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const withdrawMethods = [
    { id: 'project', label: 'Inter-Project', icon: Orbit },
    { id: 'bank', label: 'Bank', icon: Landmark },
    { id: 'ewallet', label: 'E-Wallet', icon: Wallet },
  ];

  const banks = [
    { id: 'bca', name: 'BCA', logo: 'https://upload.wikimedia.org/wikipedia/id/thumb/e/e0/BCA_logo.svg/1280px-BCA_logo.svg.png' },
    { id: 'bri', name: 'BRI', logo: 'https://upload.wikimedia.org/wikipedia/id/thumb/7/7b/Bank_Rakyat_Indonesia_logo.svg/1280px-Bank_Rakyat_Indonesia_logo.svg.png' },
    { id: 'mandiri', name: 'Mandiri', logo: 'https://upload.wikimedia.org/wikipedia/id/thumb/f/f6/Bank_Mandiri_logo.svg/1280px-Bank_Mandiri_logo.svg.png' },
  ];

  const eWallets = [
    { id: 'dana', name: 'DANA', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Logo_dana_blue.svg/1280px-Logo_dana_blue.svg.png' },
    { id: 'gopay', name: 'GoPay', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Gopay_logo.svg/1280px-Gopay_logo.svg.png' },
    { id: 'ovo', name: 'OVO', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/OVO_Logo.svg/1280px-OVO_Logo.svg.png' },
  ];

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (withdrawMethod === 'project' && !projectId) {
      setErrorMessage('Project ID is required');
      setStatus('error');
      return;
    }
    if (withdrawMethod !== 'project' && !accountNumber) {
      setErrorMessage('Account number is required');
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
    
    // Simulate network delay
    await new Promise(r => setTimeout(r, 2000));

    // Handle withdrawal logic based on method
    const destination = withdrawMethod === 'project' ? projectId : accountNumber;
    const success = withdraw(destination, val);
    
    if (success) {
      setStatus('success');
      setAmount('');
      setProjectId('');
      setAccountNumber('');
    } else {
      setErrorMessage('Insufficient balance or invalid amount');
      setStatus('error');
    }
  };

  return (
    <div className="p-8 pb-32 bg-slate-950 flex-1 flex flex-col items-center">
      <div className="w-full max-w-lg space-y-8">
        <div className="flex flex-col gap-1 mb-8">
          <h2 className="text-3xl font-black tracking-tighter text-white uppercase">Transfer Funding</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mt-2">
            <Cpu className="w-3 h-3 text-cyan-500" />
            AI Studio Inter-Project Protocol (ASIPP)
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-[32px] p-6 text-white shadow-2xl mb-8 relative overflow-hidden group hover:border-indigo-500/30 transition-colors">
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-6">
              <div className="bg-indigo-500/10 border border-indigo-500/20 p-3 rounded-2xl shadow-inner group-hover:scale-105 transition-transform">
                <Landmark className="w-6 h-6 text-indigo-400" />
              </div>
              <div className="text-right">
                <div className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Available Balance</div>
                <div className="text-2xl font-black tracking-tight group-hover:text-cyan-400 transition-colors">${balanceUsdt.toLocaleString()} <span className="text-sm text-slate-400">USDT</span></div>
              </div>
            </div>
          
          <div className="space-y-1">
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden shadow-inner">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "70%" }}
                    className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400"
                />
            </div>
            <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-slate-500">
                <span>Security Level: v3.2 High</span>
                <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-emerald-400" /> Active</span>
            </div>
          </div>
        </div>
        <div className="absolute -bottom-10 -right-10 opacity-5">
          <ShieldCheck className="w-48 h-48 text-indigo-400 group-hover:scale-110 transition-transform duration-700" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {withdrawMethods.map((method) => (
          <button
            key={method.id}
            onClick={() => setWithdrawMethod(method.id as any)}
            className={`p-4 rounded-[28px] flex flex-col items-center gap-2 border-2 transition-all ${withdrawMethod === method.id ? 'border-indigo-500 bg-indigo-500/10 text-cyan-400 shadow-lg shadow-indigo-500/10' : 'border-slate-800 bg-slate-900 text-slate-500 hover:text-white hover:bg-slate-800'}`}
          >
            <method.icon className="w-6 h-6" />
            <span className="text-[10px] font-black uppercase text-center tracking-widest">{method.label}</span>
          </button>
        ))}
      </div>

      <form onSubmit={handleWithdraw} className="space-y-6">
        <div className="space-y-5 bg-slate-900 border border-slate-800 p-6 rounded-[32px] shadow-2xl relative">
          
          {withdrawMethod === 'project' && (
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block ml-1">Destination Project ID</label>
              <div className="relative group">
                <input 
                  type="text"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  placeholder="PROJ-XXXX-XXXX"
                  className="w-full bg-slate-950 border-2 border-slate-800 rounded-[28px] py-5 px-6 outline-none font-bold text-white focus:border-indigo-500 transition-all placeholder:text-slate-700 shadow-inner"
                />
              </div>
            </div>
          )}

            {withdrawMethod === 'bank' && (
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block ml-1">Select Bank</label>
                <div className="grid grid-cols-3 gap-2">
                  {banks.map((bank) => (
                    <button
                      key={bank.id}
                      type="button"
                      onClick={() => setSelectedBank(bank.id)}
                      className={`p-3 rounded-2xl border-2 flex items-center justify-center transition-colors ${selectedBank === bank.id ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-800 bg-slate-950 hover:border-slate-700'}`}
                    >
                      <img src={bank.logo} alt={bank.name} className="h-8 object-contain" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {withdrawMethod === 'ewallet' && (
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block ml-1">Select E-Wallet</label>
                <div className="grid grid-cols-3 gap-2">
                  {eWallets.map((wallet) => (
                    <button
                      key={wallet.id}
                      type="button"
                      onClick={() => setSelectedEWallet(wallet.id)}
                      className={`p-3 rounded-2xl border-2 flex items-center justify-center transition-colors ${selectedEWallet === wallet.id ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-800 bg-slate-950 hover:border-slate-700'}`}
                    >
                      <img src={wallet.logo} alt={wallet.name} className="h-8 object-contain" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {(withdrawMethod === 'bank' || withdrawMethod === 'ewallet') && (
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block ml-1">Account/Phone Number</label>
                <input 
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="Enter number"
                  className="w-full bg-slate-950 border-2 border-slate-800 rounded-[28px] py-5 px-6 outline-none font-black text-white focus:border-indigo-500 transition-all placeholder:text-slate-700 shadow-inner"
                />
              </div>
            )}

            <div>
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block ml-1">Withdraw Amount (USDT)</label>
               <div className="relative group">
                 <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-slate-500 transition-colors group-focus-within:text-indigo-500">
                   <Wallet className="w-5 h-5" />
                 </div>
                 <input 
                   type="number"
                   step="0.01"
                   value={amount}
                   onChange={(e) => setAmount(e.target.value)}
                   placeholder="0.00"
                   className="w-full bg-slate-950 border-2 border-slate-800 rounded-[28px] py-5 pl-14 pr-4 outline-none font-black text-white group-focus-within:border-indigo-500 transition-all placeholder:text-slate-700 shadow-inner"
                 />
                 <button 
                   type="button"
                   onClick={() => setAmount(balanceUsdt.toString())}
                   className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-lg transition-colors uppercase tracking-widest shadow-inner"
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
              className="bg-rose-500/10 p-4 rounded-2xl border border-rose-500/20 flex items-center gap-3 text-rose-400"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-xs font-bold">{errorMessage}</p>
            </motion.div>
          )}

          {status === 'success' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-emerald-500/10 p-6 rounded-3xl border-2 border-emerald-500/20 flex flex-col items-center text-center gap-3 text-emerald-400"
            >
              <div className="bg-emerald-500 text-slate-950 p-3 rounded-full shadow-lg shadow-emerald-500/30">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <p className="font-black text-lg text-emerald-300">Transfer Initiated!</p>
                <p className="text-xs font-bold text-emerald-400/80 leading-relaxed">Funds are being routed via AI Studio Secured Gateway to Project: <span className="underline font-black">{projectId}</span></p>
              </div>
              <button 
                type="button"
                onClick={() => setStatus('idle')}
                className="mt-2 text-[10px] font-black bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 px-4 py-2 rounded-full transition-colors uppercase tracking-widest border border-emerald-500/20"
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
           className={`w-full py-6 mt-4 rounded-[32px] font-black text-lg tracking-widest uppercase transition-all flex items-center justify-center gap-3 relative overflow-hidden border border-transparent ${
             status === 'processing' 
               ? 'bg-slate-800 text-slate-500 cursor-not-allowed border-slate-700' 
               : 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/30 hover:scale-[1.02] active:scale-[0.98]'
           }`}
         >
           {status === 'processing' ? (
             <>
               <div className="w-6 h-6 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
               VERIFYING GATEWAY...
             </>
           ) : (
             <>
               TRANSFER FUNDS <ArrowRight className="w-6 h-6" />
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
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Security Standards</h3>
        <div className="grid grid-cols-2 gap-4">
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-inner group transition-colors hover:border-emerald-500/30">
                <ShieldCheck className="w-6 h-6 text-emerald-500 mb-2 transition-transform group-hover:scale-110" />
                <div className="font-bold text-[11px] text-white leading-tight">ISO-27001 AI Encryption</div>
            </div>
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-inner group transition-colors hover:border-indigo-500/30">
                <Cpu className="w-6 h-6 text-indigo-500 mb-2 transition-transform group-hover:scale-110" />
                <div className="font-bold text-[11px] text-white leading-tight">Project Sync v4.2</div>
            </div>
        </div>
      </div>
     </div>
    </div>
  );
}
