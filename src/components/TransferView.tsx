import React, { useState } from 'react';
import { Loader2, User, DollarSign } from 'lucide-react';
import { useFirebase } from '../context/FirebaseContext';
import { doc, runTransaction, collection, serverTimestamp } from 'firebase/firestore';

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
      
      const senderWalletRef = doc(db, 'wallets', senderUid);
      const recipientWalletRef = doc(db, 'wallets', recipientUid);

      await runTransaction(db, async (transaction) => {
        const senderWallet = await transaction.get(senderWalletRef);
        const recipientWallet = await transaction.get(recipientWalletRef);
        
        if (!senderWallet.exists()) throw new Error('Sender wallet not found');
        if (!recipientWallet.exists()) throw new Error('Recipient wallet not found');

        const senderData = senderWallet.data();
        const recipientData = recipientWallet.data();

        if ((senderData.balance || 0) < transferAmount) {
          throw new Error('Insufficient balance');
        }

        transaction.update(senderWalletRef, { balance: (senderData.balance || 0) - transferAmount });
        transaction.update(recipientWalletRef, { balance: (recipientData.balance || 0) + transferAmount });
        
        const transactionRef = doc(collection(db, 'transactions'));
        transaction.set(transactionRef, {
            senderUid,
            recipientUid,
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
                placeholder="Recipient UID"
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
