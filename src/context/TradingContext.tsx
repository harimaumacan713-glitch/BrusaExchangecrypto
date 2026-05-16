import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

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
  const [balance, setBalance] = useState(10000); // 10,000 USDT Initial
  const [positions, setPositions] = useState<Position[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // Persistent storage
  useEffect(() => {
    const saved = localStorage.getItem('trading_data_v2');
    if (saved) {
      const { balance: sBalance, positions: sPositions, orders: sOrders } = JSON.parse(saved);
      setBalance(sBalance !== undefined ? sBalance : 10000);
      setPositions(sPositions || []);
      setOrders(sOrders || []);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('trading_data_v2', JSON.stringify({ balance, positions, orders }));
  }, [balance, positions, orders]);

  const buyAsset = (symbol: string, amount: number, price: number) => {
    const cost = amount * price;
    if (balance < cost) return false;

    setBalance(prev => prev - cost);
    setPositions(prev => {
      const existing = prev.find(p => p.symbol === symbol);
      if (existing) {
        const totalAmount = existing.amount + amount;
        const avgPrice = (existing.amount * existing.entryPrice + cost) / totalAmount;
        return prev.map(p => p.symbol === symbol ? { ...p, amount: totalAmount, entryPrice: avgPrice } : p);
      }
      return [...prev, { symbol, amount, entryPrice: price, type: 'buy', timestamp: Date.now() }];
    });

    setOrders(prev => [{
      id: Math.random().toString(36).substr(2, 9),
      symbol,
      amount,
      price,
      type: 'buy',
      timestamp: Date.now(),
      status: 'filled'
    }, ...prev]);

    return true;
  };

  const sellAsset = (symbol: string, amount: number, price: number) => {
    const position = positions.find(p => p.symbol === symbol);
    if (!position || position.amount < amount) return false;

    const realizedPnl = (price - position.entryPrice) * amount;
    const proceeds = amount * price;
    
    setBalance(prev => prev + proceeds);
    setPositions(prev => {
      const newPositions = prev.map(p => {
        if (p.symbol === symbol) {
          return { ...p, amount: p.amount - amount };
        }
        return p;
      }).filter(p => p.amount > 0);
      return newPositions;
    });

    setOrders(prev => [{
      id: Math.random().toString(36).substr(2, 9),
      symbol,
      amount,
      price,
      type: 'sell',
      pnl: realizedPnl,
      timestamp: Date.now(),
      status: 'filled'
    }, ...prev]);

    return true;
  };

  const withdraw = (projectId: string, amount: number) => {
    if (balance < amount || amount <= 0) return false;

    setBalance(prev => prev - amount);
    setOrders(prev => [{
      id: Math.random().toString(36).substr(2, 9),
      symbol: 'USDT',
      amount,
      price: 1,
      type: 'sell', // Use sell type for withdrawal
      timestamp: Date.now(),
      status: 'filled',
      pnl: 0,
      metadata: { type: 'withdrawal', projectId }
    } as any, ...prev]);

    return true;
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
