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
    <div className="p-6 space-y-6">
        <div className="relative">
            <User className="absolute left-4 top-4 text-gray-400" />
            <input 
                type="text"
                value={recipientUid}
                onChange={(e) => setRecipientUid(e.target.value)}
                placeholder="Recipient Account Number or UID"
                className="w-full p-4 pl-12 rounded-[28px] border border-gray-100 bg-gray-50 outline-none focus:ring-2 focus:ring-indigo-500"
            />
        </div>
        <div className="relative">
            <DollarSign className="absolute left-4 top-4 text-gray-400" />
            <input 
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Amount"
                className="w-full p-4 pl-12 rounded-[28px] border border-gray-100 bg-gray-50 outline-none focus:ring-2 focus:ring-indigo-500"
            />
        </div>
        <button 
            onClick={handleTransfer}
            disabled={loading || !amount || !recipientUid}
            className="w-full p-5 bg-indigo-600 text-white rounded-[28px] font-black hover:bg-indigo-700 disabled:opacity-50 transition-all"
        >
            {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Confirm Transfer'}
        </button>
    </div>
  );
}
