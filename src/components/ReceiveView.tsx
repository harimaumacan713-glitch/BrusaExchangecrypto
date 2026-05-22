import React, { useEffect, useState } from 'react';
import { Loader2, QrCode, Copy, Check, ArrowDownLeft, Calendar, Bitcoin, Coins, ShipWheel, DollarSign, Activity, Orbit } from 'lucide-react';
import { useFirebase } from '../context/FirebaseContext';
import { useTrading } from '../context/TradingContext';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { motion } from 'motion/react';

const iconMap: Record<string, any> = {
  BTC: { icon: Bitcoin, color: 'text-orange-500', bg: 'bg-orange-505/10', name: 'Bitcoin' },
  ETH: { icon: Coins, color: 'text-indigo-400', bg: 'bg-indigo-505/10', name: 'Ethereum' },
  SOL: { icon: ShipWheel, color: 'text-purple-400', bg: 'bg-purple-505/10', name: 'Solana' },
  USDT: { icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-505/10', name: 'Tether' },
  XRP: { icon: Activity, color: 'text-sky-400', bg: 'bg-sky-505/10', name: 'Ripple' },
};

export function ReceiveView() {
  const { auth, db } = useFirebase();
  const { userAssetIps } = useTrading();
  const [accountNumber, setAccountNumber] = useState<string | null>(null);
  const [incomingTransactions, setIncomingTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  
  const [activeSubTab, setActiveSubTab] = useState<'idr' | 'crypto'>('idr');
  const [copiedIp, setCopiedIp] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.currentUser) return;

    // 1. Fetch Account Number from profile
    const userRef = doc(db, 'users', auth.currentUser.uid);
    getDoc(userRef).then(snap => {
      if (snap.exists()) {
        setAccountNumber(snap.data().accountNumber);
      }
    });

    // 2. Listen to /external_transfers (Incoming transfers)
    const qExt = query(
      collection(db, 'external_transfers'),
      where('receiverUid', '==', auth.currentUser.uid)
    );

    const unsubscribeExt = onSnapshot(qExt, (snapshot) => {
      const txs = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
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
      setTimeout(() => setCopied(false), 2050);
    }
  };

  return (
    <div className="p-8 space-y-8 bg-slate-950 flex-1 flex flex-col items-center">
      <div className="w-full max-w-lg space-y-8">
        
        {/* Title */}
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-black tracking-tighter text-white">Receive</h2>
          <p className="text-slate-400 text-sm font-bold uppercase tracking-widest text-[10px]">
            Receive fiat IDR or digital assets directly to your account.
          </p>
        </div>

        {/* Sub tabs selector */}
        <div className="flex bg-slate-905 p-1 rounded-2xl border border-slate-900/60 shadow-lg">
          <button
            onClick={() => setActiveSubTab('idr')}
            className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              activeSubTab === 'idr'
                ? 'bg-gradient-to-r from-indigo-500/80 to-purple-500/80 text-white font-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Fiat IDR Wallet
          </button>
          <button
            onClick={() => setActiveSubTab('crypto')}
            className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              activeSubTab === 'crypto'
                ? 'bg-gradient-to-r from-cyan-500/80 to-indigo-500/80 text-white font-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Crypto Key Address
          </button>
        </div>

        {/* E-Wallet Card IDR */}
        {activeSubTab === 'idr' ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-slate-800 rounded-[32px] p-8 text-white relative overflow-hidden shadow-2xl group hover:border-indigo-505/30 transition-colors"
          >
              <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:scale-110 transition-transform duration-700">
                <QrCode className="w-48 h-48 text-indigo-400" />
              </div>
              
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-6 text-slate-500">Nomor Akun Dompet</h4>
              
              <div className="flex items-center justify-between gap-4 mb-4 relative z-10 font-mono">
                 {accountNumber ? (
                   <div className="text-4xl font-black tracking-tighter tabular-nums text-white group-hover:text-indigo-400 transition-colors">
                     {accountNumber.match(/.{1,4}/g)?.join(' ')}
                   </div>
                 ) : (
                   <div className="h-10 w-48 bg-slate-800 animate-pulse rounded-lg" />
                 )}
                 
                 <button 
                   onClick={copyToClipboard}
                   className="p-3 bg-slate-805 border border-slate-750 hover:bg-indigo-505/20 hover:border-indigo-550/30 rounded-2xl transition-all active:scale-95 shadow-inner"
                 >
                   {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5 text-indigo-400" />}
                 </button>
              </div>
              
              <p className="text-xs text-slate-400 font-bold leading-relaxed max-w-[200px] relative z-10">
                Bagikan nomor akun di atas untuk menerima dana secara instan.
              </p>
          </motion.div>
        ) : (
          /* Crypto Asset IP Addresses list */
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-4"
          >
            <div className="bg-slate-900 border border-slate-800/80 rounded-[28px] p-6 text-slate-300">
               <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 text-cyan-400 flex items-center gap-1.5 leading-none">
                 <Orbit className="w-4 h-4 animate-spin text-cyan-400" /> Cyber Asset Key Address (CAKA)
               </h4>
               <p className="text-xs text-slate-400 leading-relaxed font-bold">
                 Setiap aset kripto Anda memiliki alamat API Key Address unik yang aman. Bagikan alamat Key berikut kepada pengirim untuk menerima transfer instan tanpa biaya gas.
               </p>
            </div>

            <div className="space-y-3">
              {Object.entries((userAssetIps || {}) as Record<string, string>).map(([symbol, ip]) => {
                const meta = iconMap[symbol] || { icon: Coins, color: 'text-indigo-400', bg: 'bg-indigo-505/10', name: symbol };
                const Icon = meta.icon;
                const isCopied = copiedIp === symbol;

                return (
                  <div
                    key={symbol}
                    className="p-4 bg-slate-900 border border-slate-805 rounded-3xl flex justify-between items-center group hover:border-cyan-500/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-11 h-11 rounded-2xl bg-slate-800 border border-slate-755 flex items-center justify-center ${meta.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-black text-white leading-none mb-1 flex items-center gap-1.5">
                          {meta.name} 
                          <span className="text-[8px] tracking-wider bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded font-mono font-black text-slate-400">{symbol}</span>
                        </div>
                        <div className="text-xs font-mono font-bold text-cyan-400 tracking-wide select-all">
                          {ip || 'Initializing Key Address...'}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        if (ip) {
                          navigator.clipboard.writeText(ip);
                          setCopiedIp(symbol);
                          setTimeout(() => setCopiedIp(null), 2000);
                        }
                      }}
                      className="p-2.5 bg-slate-800 border border-slate-700 hover:bg-cyan-500/10 hover:border-cyan-505/30 rounded-xl transition-all active:scale-95"
                    >
                      {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-cyan-400" />}
                    </button>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
        
        {/* Historical Logs */}
        <div className="mt-4">
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
                {incomingTransactions.length === 0 ? (
                  <div className="py-12 text-center border-2 border-dashed border-slate-800 rounded-[32px] bg-slate-900/50">
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Belum ada dana masuk.</p>
                  </div>
                ) : (
                  incomingTransactions.map(t => {
                    const isCrypto = !!t.symbol;
                    const meta = isCrypto ? iconMap[t.symbol] : null;

                    return (
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
                                {t.timestamp?.toDate ? t.timestamp.toDate().toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : 'Baru saja'}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-base font-black text-emerald-400 mb-1 font-mono">
                              {isCrypto ? (
                                `+${t.amount} ${t.symbol}`
                              ) : (
                                `+ Rp ${(t.amount).toLocaleString()}`
                              )}
                            </div>
                            <div className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">
                              {isCrypto ? 'Direct Key Transfer' : 'E-Wallet Transfer'}
                            </div>
                          </div>
                      </motion.div>
                    );
                  })
                )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
