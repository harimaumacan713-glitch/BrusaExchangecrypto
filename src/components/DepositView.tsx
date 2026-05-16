import React from 'react';
import { Landmark, Smartphone, QrCode, CreditCard, ChevronRight, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

const METHODS = [
  { id: 'bank', name: 'Bank Transfer', icon: Landmark, color: 'bg-blue-500', desc: 'Permata, BCA, Mandiri, BRI' },
  { id: 'qris', name: 'QRIS / E-Wallet', icon: QrCode, color: 'bg-purple-500', desc: 'Dana, OVO, GoPay, ShopeePay' },
  { id: 'va', name: 'Virtual Account', icon: Smartphone, color: 'bg-cyan-500', desc: 'Instant deposit 24/7' },
  { id: 'card', name: 'Credit / Debit', icon: CreditCard, color: 'bg-indigo-500', desc: 'Visa, Mastercard, GPN' },
];

export function DepositView() {
  return (
    <div className="p-6 pb-24 space-y-8 bg-white min-h-screen">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-black tracking-tight text-gray-900">Deposit</h2>
        <p className="text-gray-500 text-sm">Add funds to your wallet to start trading.</p>
      </div>

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

      <div className="space-y-4">
         <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Payment Methods</label>
         <div className="grid gap-3">
            {METHODS.map((method, index) => (
                <motion.button
                    key={method.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-5 p-5 bg-gray-50 border border-gray-100 rounded-[28px] hover:border-cyan-500 hover:bg-white hover:shadow-xl hover:shadow-cyan-500/5 transition-all text-left group"
                >
                    <div className={`${method.color} p-4 rounded-2xl text-white shadow-lg`}>
                        <method.icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                        <div className="font-black text-gray-900 leading-tight mb-1">{method.name}</div>
                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">{method.desc}</div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-cyan-500 group-hover:translate-x-1 transition-all" />
                </motion.button>
            ))}
         </div>
      </div>

      <div className="p-8 bg-gray-900 rounded-[40px] text-white text-center space-y-4 shadow-2xl relative overflow-hidden">
         <div className="absolute top-0 right-0 p-4 opacity-10">
            <Landmark className="w-24 h-24" />
         </div>
         <h4 className="text-lg font-black tracking-tight">Need Large Deposit?</h4>
         <p className="text-xs text-gray-400 max-w-[200px] mx-auto leading-relaxed">
            For deposits over Rp 500.000.000, please contact our OTC desk for zero fees.
         </p>
         <button className="text-cyan-400 font-bold text-sm uppercase tracking-widest hover:underline">
            Contact OTC
         </button>
      </div>
    </div>
  );
}
