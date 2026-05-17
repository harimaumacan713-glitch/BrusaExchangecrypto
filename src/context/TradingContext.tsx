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
  balance: number; // This is IDR now
  balanceUsdt: number;
  eWalletBalance: number;
  positions: Position[];
  orders: Order[];
  totalRealizedPnl: number;
  withdraw: (projectId: string, amount: number) => Promise<boolean>;
  buyAsset: (symbol: string, amount: number, price: number) => Promise<boolean>;
  sellAsset: (symbol: string, amount: number, price: number) => Promise<boolean>;
  depositToExchange: (amount: number) => Promise<boolean>;
  withdrawFromExchange: (amount: number) => Promise<boolean>;
  clearHistory: () => void;
  getTotalValue: (currentPrices: Record<string, number>) => number;
  getUnrealizedPnl: (currentPrices: Record<string, number>) => number;
}

const TradingContext = createContext<TradingContextType | undefined>(undefined);

export const TradingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { auth, db } = useFirebase();
  const [balance, setBalance] = useState(0); // Exchange IDR
  const [eWalletBalance, setEWalletBalance] = useState(0); // E-Wallet IDR
  const [positions, setPositions] = useState<Position[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [usdtRate, setUsdtRate] = useState(16150);

  // Fetch exchange rate
  useEffect(() => {
    fetch('https://min-api.cryptocompare.com/data/price?fsym=USDT&tsyms=IDR')
      .then(res => res.json())
      .then(data => {
        if (data.IDR) setUsdtRate(data.IDR);
      })
      .catch(() => {});
  }, []);

  const balanceUsdt = balance / usdtRate;

  // Real-time synchronization
  useEffect(() => {
    if (!auth.currentUser) return;
    
    // Listen to e-wallet balance (original wallets collection)
    const userWalletRef = doc(db, 'wallets', auth.currentUser.uid);
    const unsubscribeWallet = onSnapshot(userWalletRef, (doc) => {
        if (doc.exists()) {
            setEWalletBalance(doc.data().balance || 0);
        }
    });

    // Listen to exchange balance (new exchange_wallets collection)
    const exchangeWalletRef = doc(db, 'exchange_wallets', auth.currentUser.uid);
    const unsubscribeExchangeWallet = onSnapshot(exchangeWalletRef, (doc) => {
        if (doc.exists()) {
            // Mapping 'idr' from exchange_wallets to 'balance' for trading
            setBalance(doc.data().idr || 0);
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
        unsubscribeExchangeWallet();
        unsubscribeTransactions();
    };
  }, [auth.currentUser, db]);

  const buyAsset = async (symbol: string, amount: number, price: number): Promise<boolean> => {
    if (!auth.currentUser) return false;
    const costUsdt = amount * price; 
    const costIdr = costUsdt * usdtRate;
    if (balance < costIdr) return false;

    try {
        const exchangeWalletRef = doc(db, 'exchange_wallets', auth.currentUser.uid);
        await runTransaction(db, async (transaction) => {
            const wallet = await transaction.get(exchangeWalletRef);
            if (!wallet.exists()) throw new Error('Exchange wallet not found');
            const data = wallet.data();
            if ((data.idr || 0) < costIdr) throw new Error('Insufficient balance');

            transaction.update(exchangeWalletRef, { idr: (data.idr || 0) - costIdr });
            
            const transactionRef = doc(collection(db, 'transactions'));
            transaction.set(transactionRef, {
                userId: auth.currentUser!.uid,
                symbol,
                amount,
                price, // Still logging price in USDT
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

    const proceedsUsdt = amount * price;
    const proceedsIdr = proceedsUsdt * usdtRate;

    try {
        const exchangeWalletRef = doc(db, 'exchange_wallets', auth.currentUser.uid);
        await runTransaction(db, async (transaction) => {
            const wallet = await transaction.get(exchangeWalletRef);
            if (!wallet.exists()) throw new Error('Exchange wallet not found');
            const data = wallet.data();

            transaction.update(exchangeWalletRef, { idr: (data.idr || 0) + proceedsIdr });
            
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

  const depositToExchange = async (amount: number): Promise<boolean> => {
    if (!auth.currentUser || amount <= 0) return false;
    
    try {
      const uid = auth.currentUser.uid;
      const walletRef = doc(db, 'wallets', uid);
      const exchangeWalletRef = doc(db, 'exchange_wallets', uid);

      await runTransaction(db, async (transaction) => {
        const wallet = await transaction.get(walletRef);
        const exchangeWallet = await transaction.get(exchangeWalletRef);

        if (!wallet.exists()) throw new Error('E-Wallet not found');
        if (!exchangeWallet.exists()) throw new Error('Exchange wallet not found');

        const currentBalance = wallet.data()?.balance || 0;
        if (currentBalance < amount) throw new Error('Insufficient E-Wallet balance');

        transaction.update(walletRef, { balance: currentBalance - amount });
        transaction.update(exchangeWalletRef, { 
          idr: (exchangeWallet.data()?.idr || 0) + amount,
          updatedAt: serverTimestamp()
        });

        const logRef = doc(collection(db, 'transactions'));
        transaction.set(logRef, {
          userId: uid,
          amount,
          type: 'deposit_to_exchange',
          status: 'filled',
          timestamp: serverTimestamp()
        });
      });
      return true;
    } catch (error) {
      console.error("Deposit to Exchange failed:", error);
      return false;
    }
  };

  const withdrawFromExchange = async (amount: number): Promise<boolean> => {
    if (!auth.currentUser || amount <= 0) return false;
    
    try {
      const uid = auth.currentUser.uid;
      const walletRef = doc(db, 'wallets', uid);
      const exchangeWalletRef = doc(db, 'exchange_wallets', uid);

      await runTransaction(db, async (transaction) => {
        const wallet = await transaction.get(walletRef);
        const exchangeWallet = await transaction.get(exchangeWalletRef);

        if (!wallet.exists()) throw new Error('E-Wallet not found');
        if (!exchangeWallet.exists()) throw new Error('Exchange wallet not found');

        const currentExchangeBalance = exchangeWallet.data()?.idr || 0;
        if (currentExchangeBalance < amount) throw new Error('Insufficient Exchange balance');

        transaction.update(exchangeWalletRef, { idr: currentExchangeBalance - amount });
        transaction.update(walletRef, { 
          balance: (wallet.data()?.balance || 0) + amount,
          updatedAt: serverTimestamp()
        });

        const logRef = doc(collection(db, 'transactions'));
        transaction.set(logRef, {
          userId: uid,
          amount,
          type: 'withdraw_from_exchange',
          status: 'filled',
          timestamp: serverTimestamp()
        });
      });
      return true;
    } catch (error) {
      console.error("Withdraw from Exchange failed:", error);
      return false;
    }
  };

  const withdraw = async (projectId: string, amountUsdt: number): Promise<boolean> => {
    if (!auth.currentUser) return false;
    const amountIdr = amountUsdt * usdtRate;
    if (balance < amountIdr || amountUsdt <= 0) return false;

    try {
        const exchangeWalletRef = doc(db, 'exchange_wallets', auth.currentUser.uid);
        await runTransaction(db, async (transaction) => {
            const wallet = await transaction.get(exchangeWalletRef);
            if (!wallet.exists()) throw new Error('Exchange wallet not found');
            const data = wallet.data();

            if ((data.idr || 0) < amountIdr) throw new Error('Insufficient balance');

            transaction.update(exchangeWalletRef, { idr: (data.idr || 0) - amountIdr });
            
            const transactionRef = doc(collection(db, 'transactions'));
            transaction.set(transactionRef, {
                userId: auth.currentUser!.uid,
                symbol: 'USDT',
                amount: amountUsdt,
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

  const getUnrealizedPnl = useCallback((currentPrices: Record<string, number>) => {
    const pnlUsdt = positions.reduce((acc, pos) => {
      const currentPrice = currentPrices[pos.symbol];
      if (currentPrice === undefined || currentPrice === 0) return acc;
      return acc + (pos.amount * (currentPrice - pos.entryPrice));
    }, 0);
    return pnlUsdt * usdtRate;
  }, [positions, usdtRate]);

  const getTotalValue = useCallback((currentPrices: Record<string, number>) => {
    const portfolioValueUsdt = positions.reduce((acc, pos) => acc + (pos.amount * pos.entryPrice), 0);
    const unrealizedPnlIdr = getUnrealizedPnl(currentPrices);
    return balance + unrealizedPnlIdr + (portfolioValueUsdt * usdtRate);
  }, [balance, positions, getUnrealizedPnl, usdtRate]);

  const totalRealizedPnl = orders.reduce((acc, order) => acc + (order.pnl || 0), 0);

  return (
    <TradingContext.Provider value={{ balance, balanceUsdt, eWalletBalance, positions, orders, totalRealizedPnl, buyAsset, sellAsset, withdraw, depositToExchange, withdrawFromExchange, clearHistory, getTotalValue, getUnrealizedPnl }}>
      {children}
    </TradingContext.Provider>
  );
};

export const useTrading = () => {
  const context = useContext(TradingContext);
  if (!context) throw new Error('useTrading must be used within a TradingProvider');
  return context;
};
