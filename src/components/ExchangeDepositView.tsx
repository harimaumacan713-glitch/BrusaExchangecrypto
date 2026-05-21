import React, { useState, useEffect } from 'react';
import { ArrowLeftRight, Loader2, Info, CheckCircle2, History } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTrading } from '../context/TradingContext';
import { useFirebase } from '../context/FirebaseContext';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';

export function ExchangeDepositView() {
  const { eWalletBalance, balance: exchangeBalance, depositToExchange, withdrawFromExchange } = useTrading();
  const { auth, db } = useFirebase();
  const [mode, setMode] = useState<'deposit' | 'withdraw'>('deposit');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    if (!auth.currentUser) return;
    // Remove orderBy to avoid index requirement, sort client-side instead
    const q = query(
      collection(db, 'external_transfers'),
      where('receiverUid', '==', auth.currentUser.uid)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      // Sort client-side by timestamp descending
      docs.sort((a: any, b: any) => {
        const timeA = a.timestamp?.seconds || 0;
        const timeB = b.timestamp?.seconds || 0;
        return timeB - timeA;
      });
      setHistory(docs);
    });
    return () => unsub();
  }, [auth.currentUser, db]);

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          {/* Account info card */}
          <div className="bg-slate-900 border border-slate-800 rounded-[32px] p-6 text-white relative overflow-hidden shadow-2xl">
             <div className="relative z-10 flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400">Account Funding Info</span>
                  <div className="bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 px-2 py-1 rounded text-[8px] font-black shadow-inner">EXCHANGE NETWORK</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 mb-1 font-bold uppercase tracking-wider">Your Account Number (Deposit ID)</div>
                  <div className="text-3xl font-black tracking-tighter tabular-nums mb-1 text-white">
                    {useTrading().accountNumber || 'Generating...'}
                  </div>
                  <p className="text-[9px] text-slate-400 font-bold tracking-wider uppercase leading-relaxed">
                    Use this number to receive deposits from external E-Wallet apps.
                  </p>
                </div>
             </div>
             <div className="absolute top-0 right-0 p-8 opacity-5">
                <ArrowLeftRight className="w-32 h-32 text-cyan-400" />
             </div>
          </div>

          <div className="flex p-1.5 bg-slate-800 border border-slate-700/50 rounded-2xl shadow-inner">
            <button 
              onClick={() => setMode('deposit')}
              className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${mode === 'deposit' ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20' : 'text-slate-400 hover:text-white'}`}
            >
              Deposit to Exchange
            </button>
            <button 
              onClick={() => setMode('withdraw')}
              className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${mode === 'withdraw' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-white'}`}
            >
              Withdraw to Wallet
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl relative shadow-inner group">
              <div className="text-[10px] font-black tracking-widest uppercase text-slate-500 mb-1">E-Wallet</div>
              <div className="text-lg font-black text-white truncate group-hover:text-cyan-400 transition-colors">Rp {eWalletBalance.toLocaleString()}</div>
              {eWalletBalance === 0 && (
                <button 
                  onClick={async () => {
                    try {
                      if (auth.currentUser) {
                        await updateDoc(doc(db, 'wallets', auth.currentUser.uid), {
                          balance: 100000000
                        });
                      }
                    } catch (e) {
                      console.error("Topup failed:", e);
                    }
                  }}
                  className="absolute top-4 right-4 text-[10px] font-black uppercase tracking-widest bg-cyan-500 text-slate-950 px-2.5 py-1.5 rounded-lg shadow-lg hover:bg-cyan-400 transition-colors"
                >
                  Top Up
                </button>
              )}
            </div>
            <div className="p-5 bg-cyan-950/20 border border-cyan-500/20 rounded-3xl shadow-inner group">
              <div className="text-[10px] font-black tracking-widest uppercase text-cyan-500 mb-1">Exchange</div>
              <div className="text-lg font-black text-cyan-400 truncate group-hover:text-cyan-300 transition-colors">Rp {exchangeBalance.toLocaleString()}</div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Transfer Amount (IDR)</label>
              <button 
                onClick={() => setAmount((mode === 'deposit' ? eWalletBalance : exchangeBalance).toString())}
                className="text-[10px] font-black uppercase tracking-widest text-cyan-500 bg-cyan-500/10 px-3 py-1 border border-cyan-500/20 rounded-full hover:bg-cyan-500/20 hover:text-cyan-400 transition-colors"
              >
                Max Amount
              </button>
            </div>
            <div className="relative group">
              <div className="absolute left-6 inset-y-0 flex items-center text-slate-500 font-bold">Rp</div>
              <input 
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-slate-900 border-2 border-slate-800 rounded-[28px] pl-16 pr-6 py-6 text-xl font-black text-white focus:border-cyan-500 focus:bg-slate-800 outline-none transition-all placeholder:text-slate-700 shadow-inner"
                placeholder="0"
              />
            </div>
          </div>

          <AnimatePresence>
            {status && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`p-5 rounded-2xl flex items-center gap-4 border shadow-lg ${status.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}
              >
                {status.type === 'success' ? <CheckCircle2 className="w-6 h-6" /> : <Info className="w-6 h-6" />}
                <span className="text-sm font-bold tracking-wide">{status.message}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <button 
            onClick={handleTransfer}
            disabled={loading || !amount || parseFloat(amount) <= 0 || (mode === 'deposit' ? parseFloat(amount) > eWalletBalance : parseFloat(amount) > exchangeBalance)}
            className={`group w-full py-6 px-8 ${mode === 'deposit' ? 'bg-cyan-500 text-slate-950' : 'bg-indigo-500 text-white'} font-black text-lg uppercase tracking-widest rounded-[32px] shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 border border-transparent disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed`}
          >
            {loading ? <Loader2 className="animate-spin w-6 h-6" /> : (
              <>
                <ArrowLeftRight className="w-6 h-6 group-hover:rotate-180 transition-transform duration-500" />
                CONFIRM {mode.toUpperCase()}
              </>
            )}
          </button>
        </div>

        <div className="space-y-8">
          <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-[32px] flex gap-5 h-fit shadow-lg">
            <div className="bg-slate-800 border border-slate-700 p-3 h-fit rounded-[16px]">
              <Info className="w-6 h-6 text-cyan-400" />
            </div>
            <div className="space-y-1.5">
              <h4 className="font-black text-white text-sm tracking-wide uppercase">Instant Transfer</h4>
              <p className="text-xs font-bold text-slate-500 leading-relaxed uppercase tracking-widest">
                Internal transfers between your wallets are processed instantly with zero fees.
              </p>
            </div>
          </div>

          {/* Inbox Pendanaan */}
          <div className="space-y-4 h-full flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <History className="w-5 h-5 text-slate-500" />
              <h3 className="font-black text-white leading-none">Riwayat Deposit</h3>
            </div>
            {history.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-6 bg-slate-900 rounded-3xl border border-dashed border-slate-800">Belum ada riwayat deposit masuk.</p>
            ) : (
              <div className="space-y-3 overflow-y-auto max-h-[400px] pr-2 scrollbar-thin">
                {history.map(item => (
                  <div key={item.id} className="bg-slate-900 border border-slate-800 p-4 rounded-3xl flex justify-between items-center group hover:border-cyan-500/30 transition-colors">
                    <div className="flex flex-col gap-1 items-start">
                      <span className="text-[10px] uppercase font-black tracking-widest text-cyan-500">INCOMING DEPOSIT</span>
                      <span className="font-bold text-[11px] text-slate-300 line-clamp-1 group-hover:text-cyan-400 transition-colors">Deposit IDR {(item.jumlah || item.amount || 0).toLocaleString('id-ID')}</span>
                      <span className="text-[10px] text-slate-500 font-mono mt-0.5">Akun: {item.senderAccountNumber || 'Unknown'}</span>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-md">
                        {item.status || 'SUCCESS'}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 whitespace-nowrap">
                        {item.timestamp?.seconds ? new Date(item.timestamp.seconds * 1000).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : 'Baru'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
