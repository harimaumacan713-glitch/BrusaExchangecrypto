import React, { useEffect, useState } from 'react';
import { Loader2, QrCode, Copy, Check, ArrowDownLeft, Calendar } from 'lucide-react';
import { useFirebase } from '../context/FirebaseContext';
import { collection, query, where, onSnapshot, doc, getDoc, orderBy, limit } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';

export function ReceiveView() {
  const { auth, db } = useFirebase();
  const [accountNumber, setAccountNumber] = useState<string | null>(null);
  const [incomingTransactions, setIncomingTransactions] = useState<any[]>([]);
  const [incomingDeposits, setIncomingDeposits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) return;

    // 1. Fetch Account Number from profile
    const userRef = doc(db, 'users', auth.currentUser.uid);
    getDoc(userRef).then(snap => {
      if (snap.exists()) {
        setAccountNumber(snap.data().accountNumber);
      }
    });

    // 2. Listen to /external_transfers (Incoming transfer from e-wallet)
    const qExt = query(
      collection(db, 'external_transfers'),
      where('receiverUid', '==', auth.currentUser.uid)
    );

    const unsubscribeExt = onSnapshot(qExt, (snapshot) => {
      const txs = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        // Map fields to consistent display names
        senderDisplay: doc.data().senderEmail || doc.data().senderName || 'Anonymous',
        amount: doc.data().jumlah || doc.data().amount || 0
      }));
      // Sort locally by timestamp
      txs.sort((a: any, b: any) => {
        const tA = a.timestamp?.toMillis ? a.timestamp.toMillis() : 0;
        const tB = b.timestamp?.toMillis ? b.timestamp.toMillis() : 0;
        return tB - tA;
      });
      setIncomingTransactions(txs);
      setLoading(false);
    });

    return () => {
      unsubscribeExt();
    };
  }, [auth.currentUser, db]);

  const copyToClipboard = () => {
    if (accountNumber) {
      navigator.clipboard.writeText(accountNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const allIncoming = incomingTransactions;

  return (
    <div className="p-8 space-y-8 bg-slate-950 flex-1 flex flex-col items-center">
      <div className="w-full max-w-lg space-y-8">
        <div className="flex flex-col gap-2 mb-4">
          <h2 className="text-3xl font-black tracking-tighter text-white">Receive</h2>
          <p className="text-slate-400 text-sm font-bold uppercase tracking-widest text-[10px]">Share your account number to receive funds.</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-[32px] p-8 text-white relative overflow-hidden shadow-2xl group hover:border-indigo-500/30 transition-colors">
            <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:scale-110 transition-transform duration-700">
              <QrCode className="w-48 h-48 text-indigo-400" />
            </div>
            
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-6 text-slate-500">Nomor Akun Dompet</h4>
            
            <div className="flex items-center justify-between gap-4 mb-4 relative z-10">
               {accountNumber ? (
                 <div className="text-4xl font-black tracking-tighter tabular-nums text-white group-hover:text-indigo-400 transition-colors">
                   {accountNumber.match(/.{1,4}/g)?.join(' ')}
                 </div>
               ) : (
                 <div className="h-10 w-48 bg-slate-800 animate-pulse rounded-lg" />
               )}
               
               <button 
                 onClick={copyToClipboard}
                 className="p-3 bg-slate-800 border border-slate-700 hover:bg-indigo-500/20 hover:border-indigo-500/30 rounded-2xl transition-all active:scale-95 shadow-inner"
               >
                 {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5 text-indigo-400" />}
               </button>
            </div>
            
            <p className="text-xs text-slate-400 font-bold leading-relaxed max-w-[200px] relative z-10">
              Bagikan nomor akun di atas untuk menerima dana secara instan.
            </p>
        </div>
        
        <div>
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-1">Riwayat Dana Masuk</h4>
            <div className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded text-[8px] font-black text-emerald-400 uppercase tracking-widest">Real-time</div>
          </div>

          {loading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
          ) : (
            <div className="space-y-4">
                {allIncoming.length === 0 ? (
                  <div className="py-12 text-center border-2 border-dashed border-slate-800 rounded-[32px] bg-slate-900/50">
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Belum ada dana masuk.</p>
                  </div>
                ) : (
                  allIncoming.map(t => (
                    <motion.div 
                      key={t.id} 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-5 bg-slate-900 border border-slate-800 rounded-3xl flex justify-between items-center shadow-inner group hover:border-emerald-500/30 transition-colors"
                    >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500/10 group-hover:border-emerald-500/20 transition-colors">
                             <ArrowDownLeft className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="text-sm font-black text-white leading-none mb-1.5 group-hover:text-emerald-400 transition-colors">
                              {t.senderDisplay}
                            </div>
                            <div className="text-[10px] text-slate-500 font-bold flex items-center gap-1.5 uppercase tracking-widest">
                              <Calendar className="w-3 h-3" />
                              {t.timestamp?.toDate().toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-base font-black text-emerald-400 mb-1">
                            + Rp { (t.amount).toLocaleString() }
                          </div>
                          <div className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">{t.status || 'Success'}</div>
                        </div>
                    </motion.div>
                  ))
                )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
