import React from 'react';
import { motion } from 'motion/react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { Orbit } from 'lucide-react';

export function LoginView() {
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Error signing in with Google', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900 flex flex-col items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center space-y-8 w-full max-w-sm"
      >
        <div className="w-24 h-24 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-[32px] flex items-center justify-center shadow-2xl shadow-cyan-500/40 mx-auto">
          <Orbit className="w-12 h-12 text-white" />
        </div>
        
        <h1 className="text-3xl font-black text-white">Welcome Back</h1>
        <p className="text-gray-400">Sign in to continue to your trading dashboard.</p>
        
        <button 
          onClick={handleLogin}
          className="w-full bg-white text-gray-900 font-bold py-4 rounded-xl shadow-lg hover:bg-gray-100 transition-colors"
        >
          Sign In with Google
        </button>
      </motion.div>
    </div>
  );
}
