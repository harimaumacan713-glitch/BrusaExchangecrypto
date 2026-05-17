import React, { useState } from 'react';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';
import { motion } from 'motion/react';

export function Login({ onLogin }: { onLogin: () => void }) {
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setError(null);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // 1. Save/Update user profile
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        name: user.displayName || 'No Name',
        displayName: user.displayName || 'No Name',
        photoURL: user.photoURL || '',
        provider: 'google',
        lastLoginAt: serverTimestamp(),
      }, { merge: true }); // Merge true prevents overwriting properties like balance if using the same collection

      // Also set createdAt only if it's new
      const userSnap = await getDoc(userRef);
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
      } else {
        setError(error.message || 'Terjadi kesalahan saat login.');
      }
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
          className="w-full bg-gray-900 text-white font-bold py-4 rounded-xl hover:bg-gray-800 transition-colors"
        >
          Login with Google
        </button>
      </motion.div>
    </div>
  );
}
