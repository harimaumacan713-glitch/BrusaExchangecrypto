import React, { useState } from 'react';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';
import { motion } from 'motion/react';

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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-[32px] shadow-xl text-center w-full max-w-sm"
      >
        <h1 className="text-2xl font-black mb-2">Welcome Back</h1>
        <p className="text-gray-500 mb-8">Please login to access your wallet</p>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm text-left">
            {error}
          </div>
        )}

        <button 
          onClick={handleGoogleLogin}
          disabled={loading}
          className={`w-full text-white font-bold py-4 rounded-xl transition-colors mb-8 flex items-center justify-center gap-2 ${
            loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-900 hover:bg-gray-800'
          }`}
        >
          {loading ? (
            <>
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
              />
              Logging in...
            </>
          ) : (
            'Login with Google'
          )}
        </button>

        <div className="pt-6 border-t border-gray-100">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6 text-center">Licensed & Regulated by</p>
          <div className="flex items-center justify-center gap-6">
            
            {/* Bappebti */}
            <div className="flex flex-col items-center gap-2 group cursor-pointer">
              <div className="flex items-center gap-1 grayscale group-hover:grayscale-0 opacity-60 group-hover:opacity-100 transition-all">
                <svg viewBox="0 0 100 100" className="h-5 w-5" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10,50 C10,10 90,10 90,50 C90,90 10,90 10,50Z" stroke="#0e519c" strokeWidth="4"/>
                  <path d="M30,50 C30,20 70,20 70,50 C70,80 30,80 30,50Z" stroke="#7cbd43" strokeWidth="4"/>
                  <path d="M20,50 L80,50" stroke="#0e519c" strokeWidth="4"/>
                  <path d="M50,20 L50,80" stroke="#0e519c" strokeWidth="4"/>
                </svg>
                <span className="font-[900] text-[14px] text-[#2c3e50] tracking-tight leading-none">Bappebti</span>
              </div>
              <p className="text-[7px] text-gray-400 font-bold uppercase transition-colors group-hover:text-blue-900">BAPPEBTI</p>
            </div>
            
            <div className="w-[1px] h-8 bg-gray-100"></div>
            
            {/* CFX */}
            <div className="flex flex-col items-center gap-2 group cursor-pointer">
              <div className="flex items-center gap-0.5 grayscale group-hover:grayscale-0 opacity-60 group-hover:opacity-100 transition-all">
                <span className="font-black text-[18px] text-[#2c1259] tracking-tighter leading-none">CFX</span>
              </div>
              <p className="text-[7px] text-gray-400 font-bold uppercase transition-colors group-hover:text-purple-900">CFX</p>
            </div>
            
            <div className="w-[1px] h-8 bg-gray-100"></div>

            {/* J.P.Morgan */}
            <div className="flex flex-col items-center gap-2 group cursor-pointer">
              <div className="flex items-center grayscale group-hover:grayscale-0 opacity-60 group-hover:opacity-100 transition-all h-[18px]">
                <span className="font-serif font-bold text-[16px] text-[#003565] tracking-tight leading-none">J.P.Morgan</span>
              </div>
              <p className="text-[7px] text-gray-400 font-bold uppercase mt-1 transition-colors group-hover:text-blue-800">PARTNER</p>
            </div>

          </div>
        </div>
      </motion.div>
    </div>
  );
}
