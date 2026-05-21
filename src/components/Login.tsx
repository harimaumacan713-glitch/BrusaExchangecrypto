import React, { useState } from 'react';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';
import { motion } from 'motion/react';
import { Orbit } from 'lucide-react';

export function Login({ onLogin }: { onLogin: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    if (loading) return;
    setError(null);
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // 1. Save/Update user profile
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      
      let accountNumber = userSnap.data()?.accountNumber;
      if (!accountNumber) {
        accountNumber = Math.floor(1000000000 + Math.random() * 9000000000).toString();
      }

      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        name: user.displayName || 'No Name',
        displayName: user.displayName || 'No Name',
        photoURL: user.photoURL || '',
        provider: 'google',
        accountNumber,
        lastLoginAt: serverTimestamp(),
      }, { merge: true }); // Merge true prevents overwriting properties like balance if using the same collection

      // Also set createdAt only if it's new
      if (!userSnap.data()?.createdAt) {
        await setDoc(userRef, { createdAt: serverTimestamp(), balance: 0 }, { merge: true });
      }

      // 2. Auto create realtime wallet
      const walletRef = doc(db, 'wallets', user.uid);
      const walletSnap = await getDoc(walletRef);
      if (!walletSnap.exists()) {
        await setDoc(walletRef, {
          balance: 0,
          currency: "IDR",
          updatedAt: serverTimestamp()
        });
      }

      // 3. Auto create exchange wallet
      const exchangeWalletRef = doc(db, 'exchange_wallets', user.uid);
      const exchangeWalletSnap = await getDoc(exchangeWalletRef);
      if (!exchangeWalletSnap.exists()) {
        await setDoc(exchangeWalletRef, {
          idr: 0,
          btc: 0,
          eth: 0,
          updatedAt: serverTimestamp()
        });
      }

      // 4. Add activity log
      await addDoc(collection(db, 'activity_logs'), {
        uid: user.uid,
        loginTime: serverTimestamp(),
        device: navigator.userAgent,
        ip: "Unknown", // Client-side IP tracking usually requires external API
        provider: 'google'
      });

      onLogin();
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.code === 'auth/unauthorized-domain') {
        setError("Domain ini belum diotorisasi di Firebase. Silakan ke Firebase Console -> Authentication -> Settings -> Authorized domains, lalu tambahkan domain aplikasi ini.");
      } else if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        // Silently handle user cancellation or simultaneous requests
        console.log('Login popup cancelled or duplicate request');
      } else {
        setError(error.message || 'Terjadi kesalahan saat login.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#f8fafc] md:bg-gray-100 p-6">
      {/* Background Decor for Desktop */}
      <div className="hidden md:block fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-100/30 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-100/30 rounded-full blur-[120px]"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 bg-white p-10 rounded-[48px] shadow-[0_20px_50px_rgba(0,0,0,0.05)] text-center w-full max-w-md border border-gray-100"
      >
        <div className="w-16 h-16 bg-gray-900 rounded-[22px] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-gray-900/20">
          <Orbit className="w-8 h-8 text-cyan-400" />
        </div>

        <h1 className="text-3xl font-black mb-3 tracking-tight text-gray-900">Welcome Back</h1>
        <p className="text-gray-500 mb-10 font-medium">Log in to manage your crypto portfolio</p>
        
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-3xl mb-8 text-sm text-left font-bold flex gap-3 items-center">
            <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse shrink-0"></span>
            {error}
          </div>
        )}

        <button 
          onClick={handleGoogleLogin}
          disabled={loading}
          className={`w-full text-white font-black py-5 rounded-3xl transition-all mb-10 flex items-center justify-center gap-3 active:scale-95 shadow-lg ${
            loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-900 hover:bg-black hover:shadow-gray-200'
          }`}
        >
          {loading ? (
            <>
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
              />
              Authenticating...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="white" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="white" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="white" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="white" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google
            </>
          )}
        </button>

        <div className="pt-8 border-t border-gray-100 relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-4">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Verified By</p>
          </div>
          
          <div className="flex items-center justify-center gap-6 mt-2">
            
            {/* Bappebti */}
            <div className="flex flex-col items-center gap-2 group cursor-pointer">
              <div className="flex items-center gap-2 transition-all">
                <svg viewBox="0 0 100 100" className="h-6 w-6" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10,50 C10,10 90,10 90,50 C90,90 10,90 10,50Z" stroke="#0e519c" strokeWidth="4"/>
                  <path d="M30,50 C30,20 70,20 70,50 C70,80 30,80 30,50Z" stroke="#7cbd43" strokeWidth="4"/>
                  <path d="M20,50 L80,50" stroke="#0e519c" strokeWidth="4"/>
                  <path d="M50,20 L50,80" stroke="#0e519c" strokeWidth="4"/>
                </svg>
                <span className="font-[900] text-[15px] text-gray-900 tracking-tight leading-none">Bappebti</span>
              </div>
              <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest group-hover:text-cyan-600 transition-colors">Licensed</p>
            </div>
            
            <div className="w-[1px] h-10 bg-gray-100"></div>
            
            {/* CFX */}
            <div className="flex flex-col items-center gap-2 group cursor-pointer text-center">
              <div className="flex items-center transition-all">
                <span className="font-black text-[22px] text-gray-900 tracking-tighter leading-none">CFX</span>
              </div>
              <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest group-hover:text-purple-600 transition-colors">Member</p>
            </div>
            
            <div className="w-[1px] h-10 bg-gray-100"></div>

            {/* J.P.Morgan */}
            <div className="flex flex-col items-center gap-2 group cursor-pointer text-center">
              <div className="flex items-center transition-all h-6">
                <span className="font-serif font-bold text-[16px] text-gray-900 tracking-tight leading-none">J.P.Morgan</span>
              </div>
              <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest group-hover:text-blue-600 transition-colors">Equity</p>
            </div>
          </div>
        </div>
      </motion.div>
      
      <p className="mt-8 text-[11px] text-gray-400 font-medium text-center max-w-xs leading-relaxed">
        By continuing, you agree to AetherEx <a href="#" className="text-gray-600 underline">Terms of Service</a> and <a href="#" className="text-gray-600 underline">Privacy Policy</a>.
      </p>
    </div>
  );
}
