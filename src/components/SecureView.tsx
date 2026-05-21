import React, { useState } from 'react';
import { Shield, Lock, Bell, Eye, Fingerprint, ChevronRight, Settings, Smartphone, Key, Copy, Check, History } from 'lucide-react';
import { motion } from 'motion/react';
import { useFirebase } from '../context/FirebaseContext';
import { query, collection, where, onSnapshot, doc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';

const menuItems = [
  { icon: Fingerprint, label: 'Biometric Lock', sub: 'Enable FaceID/Fingerprint', active: true },
  { icon: Smartphone, label: 'Two-Factor Auth', sub: 'Secure your login', active: false },
  { icon: Key, label: 'Manage Keys', sub: 'Cloud backup enabled', active: true },
  { icon: Bell, label: 'Alerts & Notifications', sub: 'Price and security alerts', active: true },
  { icon: Eye, label: 'Privacy Mode', sub: 'Hide balances on launch', active: false },
];

export function SecureView() {
  const { auth, db } = useFirebase();
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [balance, setBalance] = useState<number>(0);
  const uid = auth.currentUser?.uid || 'Not logged in';

  React.useEffect(() => {
    if (!auth.currentUser) return;
    
    // Fetch History (Unified transaction history logic would ideally go here)
    const q = query(collection(db, 'transfer_masuk'), where('penerimaUid', '==', auth.currentUser.uid));
    const unsubscribeHistory = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      docs.sort((a: any, b: any) => {
        const timeA = a.timestamp?.seconds || 0;
        const timeB = b.timestamp?.seconds || 0;
        return timeB - timeA;
      });
      setHistory(docs);
    });

    // Fetch User Profile for Balance
    const unsubscribeUser = onSnapshot(doc(db, 'users', auth.currentUser.uid), (docSnap) => {
      if (docSnap.exists()) {
        setBalance(docSnap.data()?.balance || 0);
      }
    });

    return () => {
        unsubscribeHistory();
        unsubscribeUser();
    };
  }, [auth.currentUser, db]);

  const copyUid = () => {
    navigator.clipboard.writeText(uid);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedBalance = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(balance);

  return (
    <div className="px-6 py-8">
      <h2 className="font-black text-3xl tracking-tighter text-white mb-8">Security Hub</h2>

      <div className="bg-gradient-to-br from-cyan-600 to-slate-900 p-8 rounded-[32px] text-white shadow-2xl mb-8 relative overflow-hidden border border-slate-700">
        <div className="relative z-10">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200 mb-2">
            Wallet Balance
          </div>
          <div className="text-4xl font-black tracking-tighter mb-4 text-white drop-shadow-md">
            {formattedBalance}
          </div>
        </div>
      </div>
      
      <div className="bg-slate-900 p-6 rounded-[32px] border border-slate-700 shadow-xl mb-8">
        <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">User UID</span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Share to receive</span>
        </div>
        <div 
            onClick={copyUid}
            className="flex items-center justify-between bg-slate-800 p-4 rounded-2xl cursor-pointer hover:bg-slate-750 transition-colors border border-slate-700"
        >
            <span className="font-mono text-xs text-slate-200 break-all">{uid}</span>
            {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5 text-slate-500" />}
        </div>
      </div>

      {history.length > 0 && (
          <div className="bg-slate-900 p-6 rounded-[32px] border border-slate-700 shadow-xl mb-8">
              <h3 className="font-bold text-white mb-6 flex items-center gap-2">
                  <History className="w-5 h-5 text-cyan-400" /> Recent Transfers
              </h3>
              <div className="space-y-4">
                  {history.map((tx) => (
                      <div key={tx.id} className="flex justify-between items-center p-4 bg-slate-800 rounded-2xl border border-slate-700">
                          <div>
                              <div className="font-black text-white text-sm">+{tx.jumlah.toLocaleString()} IDR</div>
                              <div className="text-[10px] text-slate-400 font-medium mt-1">{new Date(tx.timestamp?.toDate()).toLocaleString()}</div>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}

      <div className="space-y-4">
        {menuItems.map((item) => (
          <motion.div 
            key={item.label}
            whileTap={{ scale: 0.98 }}
            className="flex items-center justify-between p-6 bg-slate-900 border border-slate-700 rounded-3xl shadow-sm cursor-pointer hover:border-cyan-800 transition-all"
          >
            <div className="flex items-center gap-5">
              <div className="bg-slate-800 p-3 rounded-2xl border border-slate-700"><item.icon className="text-cyan-400 w-5 h-5" /></div>
              <div>
                <div className="font-bold text-white">{item.label}</div>
                <div className="text-[11px] text-slate-500 font-medium">{item.sub}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
                {item.active && <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></div>}
                <ChevronRight className="text-slate-600 w-5 h-5" />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-12 pt-8 border-t border-slate-800">
        <button 
            onClick={() => signOut(auth)}
            className="w-full flex items-center justify-center gap-2 text-rose-400 font-bold py-5 rounded-2xl hover:bg-rose-950 transition-colors">
            Log Out Account
        </button>
      </div>
    </div>
  );
}

