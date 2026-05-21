import React, { useState } from 'react';
import { Landmark, Smartphone, QrCode, CreditCard, ChevronRight, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useFirebase } from '../context/FirebaseContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const METHODS = [
  { id: 'bank', name: 'Bank Transfer', icon: Landmark, color: 'bg-blue-500', desc: 'Permata, BCA, Mandiri, BRI' },
  { id: 'qris', name: 'QRIS / E-Wallet', icon: QrCode, color: 'bg-purple-500', desc: 'Dana, OVO, GoPay, ShopeePay' },
  { id: 'va', name: 'Virtual Account', icon: Smartphone, color: 'bg-cyan-500', desc: 'Instant deposit 24/7' },
  { id: 'card', name: 'Credit / Debit', icon: CreditCard, color: 'bg-indigo-500', desc: 'Visa, Mastercard, GPN' },
];

export function DepositView() {
  const { auth, db } = useFirebase();
  const [amount, setAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleDeposit = async () => {
    if (!amount || !selectedMethod || !auth.currentUser) return;
    
    setLoading(true);
    try {
      await addDoc(collection(db, 'deposits'), {
        userId: auth.currentUser.uid,
        amount: parseFloat(amount),
        method: selectedMethod,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      alert('Deposit request submitted successfully!');
      setAmount('');
      setSelectedMethod(null);
    } catch (error) {
      console.error('Error submitting deposit:', error);
      alert('Failed to submit deposit request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-8 bg-slate-950 flex-1 flex flex-col items-center">
      <div className="w-full max-w-lg">
        <div className="flex flex-col gap-2 mb-8">
          <h2 className="text-3xl font-black tracking-tighter text-white">Deposit</h2>
          <p className="text-slate-400 text-sm font-bold uppercase tracking-widest text-[10px]">Add funds to your wallet to start trading.</p>
        </div>

        <div className="space-y-6">
          <input 
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter Amount"
              className="w-full p-6 rounded-[32px] border-2 border-slate-800 bg-slate-900 outline-none focus:border-cyan-500 focus:bg-slate-800 transition-all text-2xl font-black text-white placeholder:text-slate-600 shadow-inner"
          />
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-2 block">Payment Methods</label>
          <div className="grid gap-3">
            {METHODS.map((method, index) => (
              <motion.button
                key={method.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setSelectedMethod(method.id)}
                className={`flex items-center gap-5 p-5 border rounded-[28px] transition-all text-left group shadow-lg ${
                  selectedMethod === method.id 
                  ? 'border-cyan-500 bg-cyan-500/10 shadow-cyan-500/20' 
                  : 'border-slate-800 bg-slate-900 hover:border-cyan-500/50 hover:bg-slate-800'
                }`}
              >
                <div className={`${method.color} p-4 rounded-2xl text-white shadow-lg`}>
                  <method.icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className={`font-black leading-tight mb-1 transition-colors ${selectedMethod === method.id ? 'text-cyan-400' : 'text-white'}`}>{method.name}</div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{method.desc}</div>
                </div>
                <ChevronRight className={`w-6 h-6 transition-all ${selectedMethod === method.id ? 'text-cyan-400' : 'text-slate-600 group-hover:text-cyan-400'}`} />
              </motion.button>
            ))}
          </div>
        </div>

        <button 
          onClick={handleDeposit}
          disabled={loading || !amount || !selectedMethod}
          className="w-full mt-8 py-5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-black uppercase tracking-widest text-lg rounded-[32px] shadow-xl shadow-cyan-500/20 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 transition-all border border-transparent"
        >
          {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : 'Confirm Deposit'}
        </button>

        <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-[32px] flex gap-5 mt-8 shadow-inner">
          <div className="bg-amber-500/20 border border-amber-500/30 p-3 h-fit rounded-[16px]">
             <AlertCircle className="w-6 h-6 text-amber-400" />
          </div>
          <div className="space-y-1.5">
              <h4 className="font-black text-white uppercase tracking-wide text-sm">Identity Verification</h4>
              <p className="text-xs font-bold text-slate-400 opacity-90 leading-relaxed uppercase tracking-widest">
                Ensure your bank name matches your Aether verified identity to avoid delays.
              </p>
          </div>
        </div>
      </div>
    </div>
  );
}
