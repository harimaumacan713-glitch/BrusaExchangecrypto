import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useFirebase } from './FirebaseContext';
import { doc, onSnapshot, collection, query, where, runTransaction, serverTimestamp, addDoc, getDocs } from 'firebase/firestore';

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
  status: 'filled' | 'pending' | 'cancelled';
  pnl?: number; // Realized PNL for sell, or 'saved' for buy
}

interface ExternalTransfer {
    id: string;
    senderAccountNumber: string;
    receiverUid: string;
    receiverAccountNumber: string;
    jumlah: number;
    status: string;
    timestamp: any;
}

interface TradingContextType {
  balance: number; // This is IDR now
  balanceUsdt: number;
  eWalletBalance: number;
  accountNumber: string | null;
  userAssetIps: Record<string, string> | null;
  positions: Position[];
  orders: Order[];
  externalTransfers: ExternalTransfer[];
  incomingNotification: { amount: number, fromName: string, type: 'transfer' | 'deposit' | 'crypto_transfer_received', symbol?: string } | null;
  setIncomingNotification: (val: any) => void;
  totalRealizedPnl: number;
  withdraw: (projectId: string, amount: number) => Promise<boolean>;
  buyAsset: (symbol: string, amount: number, price: number) => Promise<boolean>;
  sellAsset: (symbol: string, amount: number, price: number) => Promise<boolean>;
  transferAsset: (symbol: string, recipientIp: string, amount: number, price: number) => Promise<boolean>;
  depositToExchange: (amount: number) => Promise<boolean>;
  withdrawFromExchange: (amount: number) => Promise<boolean>;
  clearHistory: () => void;
  getTotalValue: (currentPrices: Record<string, number>) => number;
  getUnrealizedPnl: (currentPrices: Record<string, number>) => number;
  usdtRate: number;
}

const TradingContext = createContext<TradingContextType | undefined>(undefined);

export const TradingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { auth, db } = useFirebase();
  const [balance, setBalance] = useState(0); // Exchange IDR
  const [eWalletBalance, setEWalletBalance] = useState(0); // E-Wallet IDR
  const [accountNumber, setAccountNumber] = useState<string | null>(null);
  const [userAssetIps, setUserAssetIps] = useState<Record<string, string> | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [externalTransfers, setExternalTransfers] = useState<ExternalTransfer[]>([]);
  const [incomingNotification, setIncomingNotification] = useState<{ amount: number, fromName: string, type: 'transfer' | 'deposit' | 'crypto_transfer_received', symbol?: string } | null>(null);
  const [usdtRate, setUsdtRate] = useState(16150);

  // Fetch exchange rate
  useEffect(() => {
    fetch('https://min-api.cryptocompare.com/data/price?fsym=USDT&tsyms=IDR')
      .then(res => res.json())
      .then(data => {
        if (data.IDR) setUsdtRate(data.IDR);
      })
      .catch((e) => {
        console.warn('Failed to fetch usdt rate', e);
      });
  }, []);

  const balanceUsdt = balance / usdtRate;

  // Real-time synchronization
  useEffect(() => {
    if (!auth.currentUser) return;
    
    // Listen to user profile
    const userProfileRef = doc(db, 'users', auth.currentUser.uid);
    const unsubscribeProfile = onSnapshot(userProfileRef, (doc) => {
        if (doc.exists()) {
            const data = doc.data();
            setAccountNumber(data.accountNumber || null);
            setUserAssetIps({
              BTC: data.btc_ip || '',
              ETH: data.eth_ip || '',
              SOL: data.sol_ip || '',
              USDT: data.usdt_ip || '',
              XRP: data.xrp_ip || ''
            });
        }
    });

    // Listen to e-wallet balance (wallets collection)
    const userWalletRef = doc(db, 'wallets', auth.currentUser.uid);
    const unsubscribeWallet = onSnapshot(userWalletRef, (doc) => {
        if (doc.exists()) {
            setEWalletBalance(doc.data().balance || 0);
        }
    });

    // Listen to exchange balance (exchange_wallets collection)
    const exchangeWalletRef = doc(db, 'exchange_wallets', auth.currentUser.uid);
    const unsubscribeExchangeWallet = onSnapshot(exchangeWalletRef, (doc) => {
        if (doc.exists()) {
            setBalance(doc.data().idr || 0);
        }
    });

    // Listen to exchange positions
    const positionsRef = collection(db, 'exchange_wallets', auth.currentUser.uid, 'positions');
    const unsubscribePositions = onSnapshot(positionsRef, (snapshot) => {
        const newPositions: Position[] = snapshot.docs.map(doc => ({
            ...doc.data()
        } as Position));
        setPositions(newPositions);
    });

    // Listen to user transactions (Outgoing & Incoming)
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

    // NEW: Listen for incoming transfers from e-wallet (external_transfers)
    const externalTxQ = query(
        collection(db, 'external_transfers'),
        where('receiverUid', '==', auth.currentUser.uid)
    );
    const unsubscribeExternal = onSnapshot(externalTxQ, (snapshot) => {
        let transfers = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as ExternalTransfer));

        // Sort: assuming timestamp is a Firestore Timestamp with toMillis()
        transfers.sort((a, b) => {
            const timeA = a.timestamp?.toMillis ? a.timestamp.toMillis() : 0;
            const timeB = b.timestamp?.toMillis ? b.timestamp.toMillis() : 0;
            return timeB - timeA;
        });

        setExternalTransfers(transfers);
        
        snapshot.docChanges().forEach((change) => {
            if (change.type === "added") {
                const data = change.doc.data();
                const now = Date.now();
                const txTime = data.timestamp?.toMillis ? data.timestamp.toMillis() : 0;
                
                if (txTime > now - 30000) {
                    let determinedType: 'transfer' | 'deposit' | 'crypto_transfer_received' = 'deposit';
                    if (data.type === 'transfer') {
                        determinedType = 'transfer';
                    } else if (data.type === 'crypto_transfer_received') {
                        determinedType = 'crypto_transfer_received';
                    }

                    setIncomingNotification({
                        amount: data.jumlah || data.amount || 0,
                        fromName: data.senderEmail || data.senderName || 'E-Wallet Transfer',
                        type: determinedType,
                        symbol: data.symbol || undefined
                    });
                }
            }
        });
    });

    return () => {
        unsubscribeProfile();
        unsubscribeWallet();
        unsubscribeExchangeWallet();
        unsubscribePositions();
        unsubscribeTransactions();
        unsubscribeExternal();
    };
  }, [auth.currentUser, db]);

  const buyAsset = async (symbol: string, amount: number, price: number): Promise<boolean> => {
    if (!auth.currentUser) return false;
    const costUsdt = amount * price; 
    const costIdr = costUsdt * usdtRate;
    if (balance < costIdr) return false;

    try {
        const uid = auth.currentUser.uid;
        const exchangeWalletRef = doc(db, 'exchange_wallets', uid);
        const positionRef = doc(db, 'exchange_wallets', uid, 'positions', symbol);

        await runTransaction(db, async (transaction) => {
            const walletDoc = await transaction.get(exchangeWalletRef);
            const positionDoc = await transaction.get(positionRef);

            if (!walletDoc.exists()) throw new Error('Exchange wallet not found');
            const walletData = walletDoc.data();
            if ((walletData.idr || 0) < costIdr) throw new Error('Insufficient IDR balance');

            // 1. Update main exchange wallet (Aggregated balance)
            const currentCryptoBalance = walletData[symbol.toLowerCase()] || 0;
            transaction.update(exchangeWalletRef, { 
                idr: (walletData.idr || 0) - costIdr,
                [symbol.toLowerCase()]: currentCryptoBalance + amount,
                updatedAt: serverTimestamp()
            });
            
            // 2. Update specific position (for entry price tracking)
            let newPosition;
            if (positionDoc.exists()) {
                const posData = positionDoc.data();
                const totalCost = (posData.amount * posData.entryPrice) + (amount * price);
                const totalAmount = posData.amount + amount;
                newPosition = {
                    symbol,
                    amount: totalAmount,
                    entryPrice: totalCost / totalAmount,
                    type: 'buy',
                    timestamp: Date.now()
                };
                transaction.update(positionRef, newPosition);
            } else {
                newPosition = {
                    symbol,
                    amount,
                    entryPrice: price,
                    type: 'buy',
                    timestamp: Date.now()
                };
                transaction.set(positionRef, newPosition);
            }

            // 3. Log transaction
            const transactionRef = doc(collection(db, 'transactions'));
            transaction.set(transactionRef, {
                userId: uid,
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
        console.error("Buy asset failed:", error);
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
        const uid = auth.currentUser.uid;
        const exchangeWalletRef = doc(db, 'exchange_wallets', uid);
        const positionRef = doc(db, 'exchange_wallets', uid, 'positions', symbol);

        await runTransaction(db, async (transaction) => {
            const walletDoc = await transaction.get(exchangeWalletRef);
            const positionDoc = await transaction.get(positionRef);

            if (!walletDoc.exists()) throw new Error('Exchange wallet not found');
            if (!positionDoc.exists()) throw new Error('Position not found');

            const walletData = walletDoc.data();
            const posData = positionDoc.data();

            if (posData.amount < amount) throw new Error('Insufficient crypto amount');

            // 1. Update main exchange wallet
            const currentCryptoBalance = walletData[symbol.toLowerCase()] || 0;
            transaction.update(exchangeWalletRef, { 
                idr: (walletData.idr || 0) + proceedsIdr,
                [symbol.toLowerCase()]: Math.max(0, currentCryptoBalance - amount),
                updatedAt: serverTimestamp()
            });

            // 2. Update/Delete position
            if (posData.amount === amount) {
                transaction.delete(positionRef);
            } else {
                transaction.update(positionRef, {
                    amount: posData.amount - amount,
                    timestamp: Date.now()
                });
            }

            // 3. Log transaction
            const transactionRef = doc(collection(db, 'transactions'));
            const pnl = (price - posData.entryPrice) * amount;
            transaction.set(transactionRef, {
                userId: uid,
                symbol,
                amount,
                price,
                type: 'sell',
                status: 'filled',
                pnl,
                timestamp: serverTimestamp()
            });
        });
        return true;
    } catch(error) {
        console.error("Sell asset failed:", error);
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

        const currentBalance = Number(wallet.data()?.balance || 0);
        if (currentBalance < amount) throw new Error('Insufficient E-Wallet balance');

        transaction.update(walletRef, { balance: currentBalance - amount });
        transaction.update(exchangeWalletRef, { 
          idr: Number(exchangeWallet.data()?.idr || 0) + amount,
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

        const currentExchangeBalance = Number(exchangeWallet.data()?.idr || 0);
        if (currentExchangeBalance < amount) throw new Error('Insufficient Exchange balance');

        transaction.update(exchangeWalletRef, { idr: currentExchangeBalance - amount });
        transaction.update(walletRef, { 
          balance: Number(wallet.data()?.balance || 0) + amount,
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

  const transferAsset = async (symbol: string, recipientIp: string, amount: number, price: number): Promise<boolean> => {
    if (!auth.currentUser || amount <= 0 || !recipientIp) return false;
    const cleanIp = recipientIp.trim();
    const upSymbol = symbol.toUpperCase();
    const lowSymbol = symbol.toLowerCase();

    try {
      const senderUid = auth.currentUser.uid;
      
      // 1. Find recipient by checking their specified asset IP address in the 'users' collection
      const ipField = `${lowSymbol}_ip`;
      const q = query(collection(db, 'users'), where(ipField, '==', cleanIp));
      const querySnap = await getDocs(q);
      
      if (querySnap.empty) {
        throw new Error(`Alamat IP Penerima untuk asset ${upSymbol} tidak ditemukan.`);
      }
      
      const recipientDoc = querySnap.docs[0];
      const recipientUid = recipientDoc.id;
      const recipientName = recipientDoc.data().name || recipientDoc.data().email || 'Trader';

      if (recipientUid === senderUid) {
        throw new Error("Tidak dapat mengirim asset kepada diri sendiri.");
      }

      // References for Wallets
      const senderWalletRef = doc(db, 'exchange_wallets', senderUid);
      const recipientWalletRef = doc(db, 'exchange_wallets', recipientUid);
      
      // References for Positions
      const senderPosRef = doc(db, 'exchange_wallets', senderUid, 'positions', upSymbol);
      const recipientPosRef = doc(db, 'exchange_wallets', recipientUid, 'positions', upSymbol);

      await runTransaction(db, async (transaction) => {
        // Read stats first
        const senderWallet = await transaction.get(senderWalletRef);
        const recipientWallet = await transaction.get(recipientWalletRef);
        const senderPos = await transaction.get(senderPosRef);
        const recipientPos = await transaction.get(recipientPosRef);

        if (!senderWallet.exists()) throw new Error('Dompet pengirim tidak ditemukan.');
        if (!senderPos.exists()) throw new Error(`Anda tidak memiliki posisi untuk ${upSymbol}.`);

        const senderPosData = senderPos.data();
        if (senderPosData.amount < amount) {
          throw new Error(`Saldo posisi ${upSymbol} tidak mencukupi. Tersedia: ${senderPosData.amount}`);
        }

        const senderWalletData = senderWallet.data();
        const currentSenderBalance = senderWalletData[lowSymbol] || 0;
        if (currentSenderBalance < amount) {
          throw new Error(`Saldo dompet ${upSymbol} tidak mencukupi.`);
        }

        // Setup recipient wallet
        const recipientWalletData = recipientWallet.exists() ? recipientWallet.data() : {};
        const currentRecipientBalance = recipientWalletData[lowSymbol] || 0;

        // Perform updates:
        // Update sender wallet fields
        transaction.update(senderWalletRef, {
          [lowSymbol]: Math.max(0, currentSenderBalance - amount),
          updatedAt: serverTimestamp()
        });

        // Update recipient wallet fields
        transaction.set(recipientWalletRef, {
          [lowSymbol]: currentRecipientBalance + amount,
          updatedAt: serverTimestamp()
        }, { merge: true });

        // Update sender position
        if (senderPosData.amount === amount) {
          transaction.delete(senderPosRef);
        } else {
          transaction.update(senderPosRef, {
            amount: senderPosData.amount - amount,
            timestamp: Date.now()
          });
        }

        // Update recipient position
        if (recipientPos.exists()) {
          const recipPosData = recipientPos.data();
          const totalCost = (recipPosData.amount * recipPosData.entryPrice) + (amount * price);
          const totalAmount = recipPosData.amount + amount;
          transaction.update(recipientPosRef, {
            amount: totalAmount,
            entryPrice: totalCost / totalAmount,
            timestamp: Date.now()
          });
        } else {
          transaction.set(recipientPosRef, {
            symbol: upSymbol,
            amount: amount,
            entryPrice: price,
            type: 'buy',
            timestamp: Date.now()
          });
        }

        // Add transaction entry for sender
        const txSenderRef = doc(collection(db, 'transactions'));
        transaction.set(txSenderRef, {
          userId: senderUid,
          toId: recipientUid,
          fromName: auth.currentUser?.email || 'Anonymous',
          toName: recipientName,
          symbol: upSymbol,
          amount: amount,
          price: price,
          type: 'crypto_transfer_sent',
          status: 'filled',
          recipientIp: cleanIp,
          timestamp: serverTimestamp()
        });

        // Add transfer entry in recipient's transaction / trigger notification
        const txRecipRef = doc(collection(db, 'external_transfers'));
        transaction.set(txRecipRef, {
          senderUid: senderUid,
          senderEmail: auth.currentUser?.email || 'Anonymous',
          senderName: auth.currentUser?.displayName || 'Trader',
          receiverUid: recipientUid,
          jumlah: amount, // amount/worth in asset
          symbol: upSymbol,
          type: 'crypto_transfer_received',
          senderIp: senderWallet.data()?.[lowSymbol + '_ip'] || '',
          timestamp: serverTimestamp()
        });
      });

      return true;
    } catch (e: any) {
      console.error("Asset transfer failed:", e);
      throw e;
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
    return positions.reduce((acc, pos) => {
      const currentPrice = currentPrices[pos.symbol];
      if (currentPrice === undefined || currentPrice === 0) return acc;
      return acc + (pos.amount * (currentPrice - pos.entryPrice));
    }, 0);
  }, [positions]);

  const getTotalValue = useCallback((currentPricesUsdt: Record<string, number>) => {
    const portfolioValueUsdt = positions.reduce((acc, pos) => {
      const currentPrice = currentPricesUsdt[pos.symbol] || pos.entryPrice;
      return acc + (pos.amount * currentPrice);
    }, 0);
    return (balance / usdtRate) + portfolioValueUsdt;
  }, [balance, positions, usdtRate]);

  const totalRealizedPnl = orders.reduce((acc, order) => acc + (order.pnl || 0), 0);

  return (
    <TradingContext.Provider value={{ balance, balanceUsdt, eWalletBalance, accountNumber, userAssetIps, positions, orders, externalTransfers, incomingNotification, setIncomingNotification, totalRealizedPnl, buyAsset, sellAsset, withdraw, transferAsset, depositToExchange, withdrawFromExchange, clearHistory, getTotalValue, getUnrealizedPnl, usdtRate }}>
      {children}
    </TradingContext.Provider>
  );
};

export const useTrading = () => {
  const context = useContext(TradingContext);
  if (!context) throw new Error('useTrading must be used within a TradingProvider');
  return context;
};
