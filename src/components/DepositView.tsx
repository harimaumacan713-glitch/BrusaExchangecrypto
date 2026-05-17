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
    <div className="p-6 pb-24 space-y-8 bg-white min-h-screen">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-black tracking-tight text-gray-900">Deposit</h2>
        <p className="text-gray-500 text-sm">Add funds to your wallet to start trading.</p>
      </div>

      <div className="space-y-4">
        <input 
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter Amount"
            className="w-full p-4 rounded-[28px] border border-gray-100 bg-gray-50 outline-none focus:ring-2 focus:ring-cyan-500"
        />
        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Payment Methods</label>
        <div className="grid gap-3">
          {METHODS.map((method, index) => (
            <motion.button
              key={method.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => setSelectedMethod(method.id)}
              className={`flex items-center gap-5 p-5 border rounded-[28px] transition-all text-left group ${
                selectedMethod === method.id 
                ? 'border-cyan-500 bg-cyan-50 shadow-lg shadow-cyan-500/10' 
                : 'border-gray-100 bg-gray-50 hover:border-cyan-500 hover:bg-white'
              }`}
            >
              <div className={`${method.color} p-4 rounded-2xl text-white shadow-lg`}>
                <method.icon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="font-black text-gray-900 leading-tight mb-1">{method.name}</div>
                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">{method.desc}</div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-cyan-500 transition-all" />
            </motion.button>
          ))}
        </div>
      </div>

      <button 
        onClick={handleDeposit}
        disabled={loading || !amount || !selectedMethod}
        className="w-full p-5 bg-cyan-600 text-white font-black text-center rounded-[28px] hover:bg-cyan-700 disabled:opacity-50 transition-all"
      >
        {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : 'Confirm Deposit'}
      </button>

      <div className="bg-orange-50 border border-orange-100 p-6 rounded-[32px] flex gap-4">
        <div className="bg-orange-100 p-2 h-fit rounded-xl">
           <AlertCircle className="w-5 h-5 text-orange-600" />
        </div>
        <div className="space-y-1">
            <h4 className="font-bold text-orange-900 text-sm">Identity Verification</h4>
            <p className="text-xs text-orange-800 opacity-80 leading-relaxed">
                Ensure your bank name matches your Aether verified identity to avoid delays.
            </p>
        </div>
      </div>
    </div>
  );
}
