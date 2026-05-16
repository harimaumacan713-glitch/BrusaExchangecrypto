import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Orbit } from 'lucide-react';

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(onComplete, 500);
          return 100;
        }
        return prev + 2;
      });
    }, 30);
    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <motion.div 
      exit={{ opacity: 0, scale: 1.1 }}
      className="fixed inset-0 z-[100] bg-gray-900 flex flex-col items-center justify-center p-6"
    >
      {/* Background Glow */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/20 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8 w-full max-w-[280px]">
        {/* Animated Logo */}
        <motion.div
          animate={{ 
            rotate: 360,
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            rotate: { duration: 20, repeat: Infinity, ease: "linear" },
            scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
          }}
          className="w-24 h-24 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-[32px] flex items-center justify-center shadow-2xl shadow-cyan-500/40"
        >
          <Orbit className="w-12 h-12 text-white" />
        </motion.div>

        <div className="text-center space-y-2">
           <motion.h1 
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             className="text-3xl font-black tracking-tighter text-white"
           >
             AETHER<span className="text-cyan-400">EX</span>
           </motion.h1>
           <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Secure • Instant • Global</p>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-gradient-to-r from-cyan-400 to-blue-600"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        <div className="flex justify-between w-full text-[10px] font-bold text-gray-600 uppercase tracking-widest">
            <span>Checking Integrity</span>
            <span>{progress}%</span>
        </div>
      </div>

      <div className="absolute bottom-12 text-[10px] font-bold text-gray-700 uppercase tracking-widest">
        Version 2.4.0 • Built for Elite Traders
      </div>
    </motion.div>
  );
}
