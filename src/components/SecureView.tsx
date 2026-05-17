import React, { useState } from 'react';
import { Shield, Lock, Bell, Eye, Fingerprint, ChevronRight, Settings, Smartphone, Key, Copy, Check } from 'lucide-react';
import { motion } from 'motion/react';
import { useFirebase } from '../context/FirebaseContext';
import { query, collection, where, orderBy, onSnapshot, doc } from 'firebase/firestore';
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
    
    // Fetch History
    const q = query(collection(db, 'transfer_masuk'), where('penerimaUid', '==', auth.currentUser.uid));
    const unsubscribeHistory = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort client-side to avoid requiring a composite index
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
    <div className="px-6 py-4">
      <h2 className="font-bold text-2xl tracking-tight text-gray-900 mb-6">Security Hub</h2>

      <div className="bg-gradient-to-br from-green-500 to-emerald-700 p-6 rounded-[32px] text-white shadow-xl mb-6 relative overflow-hidden">
        <div className="relative z-10">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-green-100 mb-1">
            Wallet Balance
          </div>
          <div className="text-4xl font-black tracking-tight mb-2 text-white drop-shadow-md">
            {formattedBalance}
          </div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm mb-6">
        <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-gray-400">User UID</span>
            <span className="text-[10px] font-bold text-gray-300">SHARE TO RECEIVE FUNDS</span>
        </div>
        <div 
            onClick={copyUid}
            className="flex items-center justify-between bg-gray-50 p-4 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors"
        >
            <span className="font-mono text-sm text-gray-800 break-all">{uid}</span>
            {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5 text-gray-400" />}
        </div>
      </div>

      {history.length > 0 && (
          <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm mb-6">
              <h3 className="font-bold text-gray-900 mb-4">Incoming Transfers</h3>
              <div className="space-y-3">
                  {history.map((tx) => (
                      <div key={tx.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                          <div>
                              <div className="font-bold text-sm">+{tx.jumlah}</div>
                              <div className="text-[10px] text-gray-500">{new Date(tx.timestamp?.toDate()).toLocaleString()}</div>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}

      <div className="bg-gradient-to-br from-gray-900 to-slate-800 p-6 rounded-[32px] text-white shadow-xl mb-8 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-green-500/20 p-2 rounded-xl"><Shield className="text-green-500 w-6 h-6" /></div>
            <span className="font-bold text-lg">Protected</span>
          </div>
          <p className="text-gray-400 text-sm mb-6">Your account is secured with military-grade encryption and real-time monitoring.</p>
          <button className="w-full bg-white/10 hover:bg-white/20 py-3 rounded-2xl font-bold transition-colors">Run Security Audit</button>
        </div>
        <div className="absolute top-0 right-0 p-8 opacity-10">
            <Shield className="w-32 h-32" />
        </div>
      </div>

      <div className="space-y-4">
        {menuItems.map((item, index) => (
          <motion.div 
            key={item.label}
            whileTap={{ scale: 0.98 }}
            className="flex items-center justify-between p-5 bg-white border border-gray-50 rounded-2xl shadow-sm cursor-pointer hover:border-cyan-100 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="bg-gray-50 p-2.5 rounded-xl"><item.icon className="text-gray-600 w-5 h-5" /></div>
              <div>
                <div className="font-bold text-gray-900">{item.label}</div>
                <div className="text-[10px] text-gray-400 font-medium">{item.sub}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
                {item.active && <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>}
                <ChevronRight className="text-gray-300 w-5 h-5" />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-8 pt-8 border-t border-gray-100">
        <button 
            onClick={() => signOut(auth)}
            className="w-full flex items-center justify-center gap-2 text-red-500 font-bold py-4 rounded-2xl hover:bg-red-50 transition-colors">
            Log Out
        </button>
      </div>
    </div>
  );
}
