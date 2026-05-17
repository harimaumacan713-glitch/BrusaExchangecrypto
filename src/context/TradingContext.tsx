import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useFirebase } from './FirebaseContext';
import { doc, onSnapshot, collection, query, where, runTransaction, serverTimestamp, addDoc } from 'firebase/firestore';

interface Position {
  symbol: string;
  amount: number;
  entryPrice: number;
  type: 'buy' | 'sell';
  timestamp: number;
}

interface Order {
  id: string;
  symbol: string;
  amount: number;
  price: number;
  type: 'buy' | 'sell';
  timestamp: number;
  status: 'filled';
  pnl?: number; // Realized PNL for sell, or 'saved' for buy
}

interface TradingContextType {
  balance: number;
  positions: Position[];
  orders: Order[];
  totalRealizedPnl: number;
  withdraw: (projectId: string, amount: number) => boolean;
  buyAsset: (symbol: string, amount: number, price: number, marketPrice?: number) => boolean;
  sellAsset: (symbol: string, amount: number, price: number, marketPrice?: number) => boolean;
  clearHistory: () => void;
  getTotalValue: (currentPrices: Record<string, number>) => number;
  getUnrealizedPnl: (currentPrices: Record<string, number>) => number;
}

const TradingContext = createContext<TradingContextType | undefined>(undefined);

export const TradingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { auth, db } = useFirebase();
  const [balance, setBalance] = useState(0); 
  const [positions, setPositions] = useState<Position[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // Real-time synchronization
  useEffect(() => {
    if (!auth.currentUser) return;
    
    // Listen to user balance
    const userWalletRef = doc(db, 'wallets', auth.currentUser.uid);
    const unsubscribeWallet = onSnapshot(userWalletRef, (doc) => {
        if (doc.exists()) {
            setBalance(doc.data().balance || 0);
        }
    });

    // Listen to user transactions
    const q = query(
        collection(db, 'transactions'),
        where('userId', '==', auth.currentUser.uid)
    );
    const unsubscribeTransactions = onSnapshot(q, (snapshot) => {
        const newOrders: Order[] = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Order));
        setOrders(newOrders);
    });

    return () => {
        unsubscribeWallet();
        unsubscribeTransactions();
    };
  }, [auth.currentUser, db]);

  const buyAsset = async (symbol: string, amount: number, price: number): Promise<boolean> => {
    if (!auth.currentUser) return false;
    const cost = amount * price;
    if (balance < cost) return false;

    try {
        const walletRef = doc(db, 'wallets', auth.currentUser.uid);
        await runTransaction(db, async (transaction) => {
            const wallet = await transaction.get(walletRef);
            if (!wallet.exists()) throw new Error('Wallet not found');
            const data = wallet.data();
            if ((data.balance || 0) < cost) throw new Error('Insufficient balance');

            transaction.update(walletRef, { balance: (data.balance || 0) - cost });
            
            const transactionRef = doc(collection(db, 'transactions'));
            transaction.set(transactionRef, {
                userId: auth.currentUser!.uid,
                symbol,
                amount,
                price,
                type: 'buy',
                status: 'filled',
                timestamp: serverTimestamp()
            });
        });
        return true;
    } catch(error) {
        console.error(error);
        return false;
    }
  };

  const sellAsset = async (symbol: string, amount: number, price: number): Promise<boolean> => {
    if (!auth.currentUser) return false;
    const position = positions.find(p => p.symbol === symbol);
    if (!position || position.amount < amount) return false;

    const proceeds = amount * price;

    try {
        const walletRef = doc(db, 'wallets', auth.currentUser.uid);
        await runTransaction(db, async (transaction) => {
            const wallet = await transaction.get(walletRef);
            if (!wallet.exists()) throw new Error('Wallet not found');
            const data = wallet.data();

            transaction.update(walletRef, { balance: (data.balance || 0) + proceeds });
            
            const transactionRef = doc(collection(db, 'transactions'));
            transaction.set(transactionRef, {
                userId: auth.currentUser!.uid,
                symbol,
                amount,
                price,
                type: 'sell',
                status: 'filled',
                timestamp: serverTimestamp()
            });
        });
        
        // Update local positions
        setPositions(prev => {
           const newPositions = prev.map(p => {
             if (p.symbol === symbol) {
               return { ...p, amount: p.amount - amount };
             }
             return p;
           }).filter(p => p.amount > 0);
           return newPositions;
        });

        return true;
    } catch(error) {
        console.error(error);
        return false;
    }
  };

  const withdraw = async (projectId: string, amount: number): Promise<boolean> => {
    if (!auth.currentUser) return false;
    if (balance < amount || amount <= 0) return false;

    try {
        const walletRef = doc(db, 'wallets', auth.currentUser.uid);
        await runTransaction(db, async (transaction) => {
            const wallet = await transaction.get(walletRef);
            if (!wallet.exists()) throw new Error('Wallet not found');
            const data = wallet.data();

            if ((data.balance || 0) < amount) throw new Error('Insufficient balance');

            transaction.update(walletRef, { balance: (data.balance || 0) - amount });
            
            const transactionRef = doc(collection(db, 'transactions'));
            transaction.set(transactionRef, {
                userId: auth.currentUser!.uid,
                symbol: 'USDT',
                amount,
                price: 1,
                type: 'withdraw',
                status: 'filled',
                metadata: { projectId },
                timestamp: serverTimestamp()
            });
        });
        return true;
    } catch(error) {
        console.error(error);
        return false;
    }
  };

  const clearHistory = () => {
    setOrders([]);
  };

  const getTotalValue = useCallback((currentPrices: Record<string, number>) => {
    return balance + getUnrealizedPnl(currentPrices) + positions.reduce((acc, pos) => acc + (pos.amount * pos.entryPrice), 0);
  }, [balance, positions]);

  const getUnrealizedPnl = useCallback((currentPrices: Record<string, number>) => {
    return positions.reduce((acc, pos) => {
      const currentPrice = currentPrices[pos.symbol];
      // Only calculate if we have a valid price, otherwise it stays at last known (entry)
      if (currentPrice === undefined || currentPrice === 0) return acc;
      return acc + (pos.amount * (currentPrice - pos.entryPrice));
    }, 0);
  }, [positions]);

  const totalRealizedPnl = orders.reduce((acc, order) => acc + (order.pnl || 0), 0);

  return (
    <TradingContext.Provider value={{ balance, positions, orders, totalRealizedPnl, buyAsset, sellAsset, withdraw, clearHistory, getTotalValue, getUnrealizedPnl }}>
      {children}
    </TradingContext.Provider>
  );
};

export const useTrading = () => {
  const context = useContext(TradingContext);
  if (!context) throw new Error('useTrading must be used within a TradingProvider');
  return context;
};
