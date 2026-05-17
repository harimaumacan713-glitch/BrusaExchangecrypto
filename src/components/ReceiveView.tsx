import React, { useEffect, useState } from 'react';
import { Loader2, QrCode } from 'lucide-react';
import { useFirebase } from '../context/FirebaseContext';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';

export function ReceiveView() {
  const { auth, db } = useFirebase();
  const [inboundTransfers, setInboundTransfers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;
    
    const q = query(
      collection(db, 'inbound_transfers'),
      where('recipientUid', '==', auth.currentUser.uid),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const transfers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setInboundTransfers(transfers);
      setLoading(false);
    });

    return unsubscribe;
  }, [auth.currentUser, db]);

  const acceptTransfer = async (transferId: string) => {
    try {
        await updateDoc(doc(db, 'inbound_transfers', transferId), { status: 'accepted' });
        alert('Transfer accepted!');
    } catch (e) {
        console.error(e);
        alert('Failed to accept transfer.');
    }
  }

  return (
    <div className="p-6 space-y-6">
        <div className="bg-emerald-50 p-6 rounded-[28px] border border-emerald-100 text-center">
            <QrCode className="w-16 h-16 mx-auto text-emerald-600 mb-4" />
            <h4 className="font-black text-emerald-900">Your UID</h4>
            <p className="text-sm font-mono bg-emerald-100 p-2 rounded mt-2">{auth.currentUser?.uid}</p>
        </div>
        
        <h4 className="font-black">Pending Inbound Transfers</h4>
        {loading ? <Loader2 className="animate-spin mx-auto" /> : (
            <div className="space-y-3">
                {inboundTransfers.map(t => (
                    <div key={t.id} className="p-4 bg-gray-50 rounded-2xl flex justify-between items-center">
                        <span>{t.amount}</span>
                        <button onClick={() => acceptTransfer(t.id)} className="px-4 py-2 bg-emerald-600 text-white rounded-full font-bold text-xs">Accept</button>
                    </div>
                ))}
            </div>
        )}
    </div>
  );
}
