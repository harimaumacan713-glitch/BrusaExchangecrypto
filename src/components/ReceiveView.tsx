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
    <div className="p-6 space-y-8">
        <div className="bg-indigo-600 rounded-[32px] p-8 text-white relative overflow-hidden shadow-2xl shadow-indigo-500/30">
            <div className="absolute top-0 right-0 p-12 opacity-10">
              <QrCode className="w-48 h-48" />
            </div>
            
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-6 opacity-60">Nomor Akun Dompet</h4>
            
            <div className="flex items-center justify-between gap-4 mb-4">
               {accountNumber ? (
                 <div className="text-4xl font-black tracking-tighter tabular-nums">
                   {accountNumber.match(/.{1,4}/g)?.join(' ')}
                 </div>
               ) : (
                 <div className="h-10 w-48 bg-white/20 animate-pulse rounded-lg" />
               )}
               
               <button 
                 onClick={copyToClipboard}
                 className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all active:scale-95"
               >
                 {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
               </button>
            </div>
            
            <p className="text-xs text-indigo-100/60 font-bold leading-relaxed max-w-[200px]">
              Bagikan nomor akun di atas untuk menerima dana secara instan.
            </p>
        </div>
        
        <div>
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-xs font-black uppercase tracking-widest text-gray-400">Riwayat Dana Masuk</h4>
            <div className="px-2 py-1 bg-gray-100 rounded text-[10px] font-black text-gray-500 uppercase">Real-time</div>
          </div>

          {loading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            </div>
          ) : (
            <div className="space-y-4">
                {allIncoming.length === 0 ? (
                  <div className="py-12 text-center text-gray-400">
                    <p className="text-sm font-bold">Belum ada dana masuk.</p>
                  </div>
                ) : (
                  allIncoming.map(t => (
                    <motion.div 
                      key={t.id} 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-4 bg-white border border-gray-100 rounded-3xl flex justify-between items-center shadow-sm"
                    >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                             <ArrowDownLeft className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="text-sm font-black text-gray-900 leading-none mb-1">
                              {t.senderDisplay}
                            </div>
                            <div className="text-[10px] text-gray-400 font-bold flex items-center gap-1 uppercase">
                              <Calendar className="w-3 h-3" />
                              {t.timestamp?.toDate().toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-black text-emerald-600">
                            + Rp { (t.amount).toLocaleString() }
                          </div>
                          <div className="text-[9px] font-black text-gray-300 uppercase tracking-tighter">{t.status || 'Success'}</div>
                        </div>
                    </motion.div>
                  ))
                )}
            </div>
          )}
        </div>
    </div>
  );
}
