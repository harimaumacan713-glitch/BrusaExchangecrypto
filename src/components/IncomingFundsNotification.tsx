import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTrading } from '../context/TradingContext';
import { Bell, X, ArrowDownCircle, CheckCircle2 } from 'lucide-react';

export function IncomingFundsNotification() {
  const { incomingNotification, setIncomingNotification } = useTrading();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (incomingNotification) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(() => setIncomingNotification(null), 500);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [incomingNotification, setIncomingNotification]);

  return (
    <AnimatePresence>
      {visible && incomingNotification && (
        <motion.div
          initial={{ opacity: 0, y: -100, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -100, scale: 0.9 }}
          className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-md"
        >
          <div className="bg-white/80 backdrop-blur-2xl rounded-[32px] p-1 shadow-2xl shadow-green-500/20 border border-green-500/20 overflow-hidden">
            <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-[31px] p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <ArrowDownCircle className="w-32 h-32 text-green-600" />
              </div>
              
              <div className="flex justify-between items-start mb-4">
                <div className="bg-green-500 p-3 rounded-2xl shadow-lg shadow-green-500/30">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
                <button 
                  onClick={() => setVisible(false)}
                  className="p-2 hover:bg-black/5 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div>
                <h4 className="text-xs font-black text-green-600 uppercase tracking-widest mb-1">Dana Masuk Diterima</h4>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-3xl font-black text-gray-900 tracking-tight">
                    Rp {incomingNotification.amount.toLocaleString()}
                  </span>
                  <span className="text-xs font-bold text-gray-400">IDR</span>
                </div>
                <p className="text-sm text-gray-600 font-medium leading-relaxed">
                  {incomingNotification.type === 'transfer' 
                    ? `Kamu baru saja menerima transfer dari ${incomingNotification.fromName}.`
                    : `Deposit eksternal telah berhasil masuk ke akunmu.`
                  }
                </p>
              </div>

              <div className="mt-6 flex gap-3">
                 <div className="flex-1 h-1.5 bg-green-500/10 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: "100%" }}
                      animate={{ width: "0%" }}
                      transition={{ duration: 8, ease: "linear" }}
                      className="h-full bg-green-500"
                    />
                 </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
