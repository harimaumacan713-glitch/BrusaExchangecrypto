import React, { useState } from 'react';
import { Loader2, User, DollarSign } from 'lucide-react';
import { useFirebase } from '../context/FirebaseContext';
import { doc, runTransaction, collection, serverTimestamp, getDocs, query, where } from 'firebase/firestore';

export function TransferView() {
  const { auth, db } = useFirebase();
  const [recipientUid, setRecipientUid] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTransfer = async () => {
    if (!amount || !recipientUid || !auth.currentUser) return;
    const transferAmount = parseFloat(amount);
    if (isNaN(transferAmount) || transferAmount <= 0) return;

    setLoading(true);
    try {
      const senderUid = auth.currentUser.uid;
      
      let finalRecipientUid = recipientUid.trim();

      // Look up by account number if it's numeric
      if (/^[0-9]+$/.test(finalRecipientUid)) {
         const q = query(collection(db, 'users'), where('accountNumber', '==', finalRecipientUid));
         const snaps = await getDocs(q);
         if (!snaps.empty) {
             finalRecipientUid = snaps.docs[0].id;
         } else {
             throw new Error('Account number not found');
         }
      }
      
      const senderWalletRef = doc(db, 'wallets', senderUid);
      const recipientWalletRef = doc(db, 'wallets', finalRecipientUid);

      await runTransaction(db, async (transaction) => {
        const senderWallet = await transaction.get(senderWalletRef);
        const recipientWallet = await transaction.get(recipientWalletRef);
        
        if (!senderWallet.exists()) throw new Error('Sender wallet not found');

        const senderData = senderWallet.data();
        let recipientBalance = 0;
        
        if (recipientWallet.exists()) {
           recipientBalance = recipientWallet.data()?.balance || 0;
        }

        if ((senderData.balance || 0) < transferAmount) {
          throw new Error('Insufficient balance');
        }

        transaction.update(senderWalletRef, { balance: Number(senderData.balance || 0) - transferAmount });
        transaction.set(recipientWalletRef, { 
            balance: Number(recipientBalance) + transferAmount,
            currency: 'IDR'
        }, { merge: true });
        
        const transactionRef = doc(collection(db, 'transactions'));
        transaction.set(transactionRef, {
            userId: senderUid,
            toId: finalRecipientUid,
            fromName: auth.currentUser.email || 'Anonymous',
            amount: transferAmount,
            type: 'transfer',
            createdAt: serverTimestamp()
        });
      });
      alert('Transfer successful!');
      setRecipientUid('');
      setAmount('');
    } catch (error) {
      console.error(error);
      alert('Transfer failed: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-6 bg-slate-950 flex-1 flex flex-col items-center">
      <div className="w-full max-w-lg space-y-6">
        <div className="flex flex-col gap-2 mb-8">
          <h2 className="text-3xl font-black tracking-tighter text-white">Transfer</h2>
          <p className="text-slate-400 text-sm font-bold uppercase tracking-widest text-[10px]">Send funds instantly to another account.</p>
        </div>

        <div className="relative">
            <User className="absolute left-6 top-6 text-slate-500 w-6 h-6" />
            <input 
                type="text"
                value={recipientUid}
                onChange={(e) => setRecipientUid(e.target.value)}
                placeholder="Recipient Account Number"
                className="w-full bg-slate-900 border-2 border-slate-800 rounded-[32px] pl-16 pr-6 py-6 text-lg font-black text-white focus:border-indigo-500 focus:bg-slate-800 outline-none transition-all placeholder:text-slate-600 shadow-inner"
            />
        </div>
        <div className="relative">
            <DollarSign className="absolute left-6 top-6 text-slate-500 w-6 h-6" />
            <input 
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Transfer Amount"
                className="w-full bg-slate-900 border-2 border-slate-800 rounded-[32px] pl-16 pr-6 py-6 text-xl font-black text-white focus:border-indigo-500 focus:bg-slate-800 outline-none transition-all placeholder:text-slate-600 shadow-inner"
            />
        </div>
        <button 
            onClick={handleTransfer}
            disabled={loading || !amount || !recipientUid}
            className="w-full mt-8 py-5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-black uppercase tracking-widest text-lg rounded-[32px] shadow-xl shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 transition-all border border-transparent"
        >
            {loading ? <Loader2 className="animate-spin mx-auto w-6 h-6" /> : 'Confirm Transfer'}
        </button>
      </div>
    </div>
  );
}
