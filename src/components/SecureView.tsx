import React from 'react';
import { Shield, Lock, Bell, Eye, Fingerprint, ChevronRight, Settings, Smartphone, Key } from 'lucide-react';
import { motion } from 'motion/react';

const menuItems = [
  { icon: Fingerprint, label: 'Biometric Lock', sub: 'Enable FaceID/Fingerprint', active: true },
  { icon: Smartphone, label: 'Two-Factor Auth', sub: 'Secure your login', active: false },
  { icon: Key, label: 'Manage Keys', sub: 'Cloud backup enabled', active: true },
  { icon: Bell, label: 'Alerts & Notifications', sub: 'Price and security alerts', active: true },
  { icon: Eye, label: 'Privacy Mode', sub: 'Hide balances on launch', active: false },
];

export function SecureView() {
  return (
    <div className="px-6 py-4">
      <h2 className="font-bold text-2xl tracking-tight text-gray-900 mb-6">Security Hub</h2>
      
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
        <button className="w-full flex items-center justify-center gap-2 text-red-500 font-bold py-4 rounded-2xl hover:bg-red-50 transition-colors">
            Log Out
        </button>
      </div>
    </div>
  );
}
