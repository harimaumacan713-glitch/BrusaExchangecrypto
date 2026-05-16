/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Hero } from './components/Hero';
import { LiveMarket } from './components/LiveMarket';
import { Portfolio } from './components/Portfolio';
import { Features } from './components/Features';
import { Footer } from './components/Footer';
import { AssetsView } from './components/AssetsView';
import { TradeView } from './components/TradeView';
import { MarketView } from './components/MarketView';
import { SecureView } from './components/SecureView';
import { AnalyticsView } from './components/AnalyticsView';
import { WithdrawView } from './components/WithdrawView';
import { AcademyView } from './components/AcademyView';
import { RecurringView } from './components/RecurringView';
import { ChatView } from './components/ChatView';
import { Wallet, Zap, LineChart, Shield, Orbit, BarChart3, ChevronLeft, X } from 'lucide-react';

type TabType = 'home' | 'assets' | 'trade' | 'market' | 'secure' | 'analytics' | 'withdraw' | 'academy' | 'recurring' | 'chat' | 'chatroom';

const assetMeta = {
  BTC: { name: 'Bitcoin', amount: 0.005 },
  ETH: { name: 'Ethereum', amount: 0.08 },
  SOL: { name: 'Solana', amount: 1.2 },
  USDT: { name: 'TRether', amount: 65 },
};

import { TradingProvider } from './context/TradingContext';

export default function App() {
  return (
    <TradingProvider>
      <AppContent />
    </TradingProvider>
  );
}

import { auth } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { SplashScreen } from './components/SplashScreen';
import { LoginView } from './components/LoginView';

function AppContent() {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [assetAction, setAssetAction] = useState<'none' | 'withdraw' | 'deposit' | 'buy'>('none');
  const [prices, setPrices] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isInitializing, setIsInitializing] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoadingAuth(false);
    });
    return unsubscribe;
  }, []);

  const handleWithdrawClick = () => {
    setActiveTab('assets');
    setAssetAction('withdraw');
  };

  useEffect(() => {
    // 1. Initial Fetch for other metadata
    const fetchInitialPrices = () => {
      fetch('/api/prices')
        .then(res => res.json())
        .then(data => {
          if (data.RAW) {
            setPrices(data);
          }
          setLoading(false);
        })
        .catch(err => {
          console.error('Error fetching initial prices:', err);
          setLoading(false);
        });
    };

    fetchInitialPrices();

    // 2. Binance WebSocket for Top Assets
    const binanceSymbols = ['btcusdt', 'ethusdt', 'solusdt', 'xrpusdt', 'adausdt', 'dotusdt', 'dogeusdt', 'maticusdt', 'avaxusdt'];
    const binanceWs = new WebSocket(`wss://stream.binance.com:9443/ws/${binanceSymbols.join('@trade/') + '@trade'}`);

    // We'll update the USDT/IDR rate dynamically
    let usdtIdrRate = 16150; // New default closer to current market

    // Fetch live rate periodically
    const updateRate = () => {
      fetch('https://min-api.cryptocompare.com/data/price?fsym=USDT&tsyms=IDR')
        .then(res => res.json())
        .then(data => {
          if (data.IDR) usdtIdrRate = data.IDR;
        })
        .catch(() => {});
    };
    updateRate();
    const rateInterval = setInterval(updateRate, 60000); // Every minute

    binanceWs.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.e === 'trade' || data.stream?.includes('trade')) {
          const trade = data.data || data;
          const symbol = trade.s.replace('USDT', '');
          const price = parseFloat(trade.p);

          setPrices((prevPrices: any) => {
            if (!prevPrices || !prevPrices.RAW) return prevPrices;

            const idrPrice = price * usdtIdrRate;
            
            // Create a deep-ish clone to avoid mutation
            const newRaw = { ...prevPrices.RAW };
            const newDisplay = prevPrices.DISPLAY ? { ...prevPrices.DISPLAY } : {};

            if (newRaw[symbol]) {
              // Update RAW symbol
              newRaw[symbol] = {
                ...newRaw[symbol],
                IDR: {
                  ...newRaw[symbol].IDR,
                  PRICE: idrPrice,
                  PRICE_USDT: price,
                }
              };

              // Update DISPLAY symbol if it exists
              if (newDisplay[symbol]) {
                newDisplay[symbol] = {
                  ...newDisplay[symbol],
                  IDR: {
                    ...newDisplay[symbol].IDR,
                    PRICE: new Intl.NumberFormat('id-ID', {
                      style: 'currency',
                      currency: 'IDR',
                      maximumFractionDigits: 0
                    }).format(idrPrice)
                  }
                };
              }
            } else {
               // Initialize if missing
               newRaw[symbol] = {
                 IDR: { PRICE: idrPrice, PRICE_USDT: price, CHANGEPCT24HOUR: 0, MKTCAP: 0, VOLUME24HOUR: 0 }
               };
               newDisplay[symbol] = {
                 IDR: { PRICE: `Rp ${idrPrice.toLocaleString()}`, CHANGEPCT24HOUR: "0", MKTCAP: "0", VOLUME24HOUR: "0" }
               };
            }

            return { 
              ...prevPrices,
              RAW: newRaw,
              DISPLAY: newDisplay
            };
          });
        }
      } catch (e) {
        console.error('Binance WS error:', e);
      }
    };

    // 3. Local WebSocket (for simulation or other app features if needed)
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'PRICE_UPDATE') {
          const { symbol } = data;
          const trackedByBinance = ['BTC', 'ETH', 'SOL', 'XRP', 'ADA', 'DOT', 'DOGE', 'MATIC', 'AVAX'];
          if (trackedByBinance.includes(symbol)) return; // Prefer Binance Real-time

          setPrices((prevPrices: any) => {
            if (!prevPrices || !prevPrices.RAW) return prevPrices;
            const newPrices = { ...prevPrices };
            // ... logic for other symbols
            return newPrices;
          });
        }
      } catch (e) {}
    };

    return () => {
      binanceWs.close();
      ws.close();
      clearInterval(rateInterval);
    };
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div key="home" className="relative">
            <Hero prices={prices} onTabChange={setActiveTab} />
            <div className="px-6 -mt-16 relative z-10">
              <div className="bg-white rounded-3xl p-6 shadow-xl mb-6">
                <Portfolio prices={prices} loading={loading} />
              </div>
              <LiveMarket prices={prices} loading={loading} />
              <Features />
            </div>
            <Footer />
          </div>
        );
      case 'assets':
        return (
          <motion.div
            key="assets"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <AssetsView 
              prices={prices} 
              loading={loading} 
              activeAction={assetAction} 
              onActionChange={setAssetAction} 
            />
          </motion.div>
        );
      case 'trade':
        return (
          <motion.div
            key="trade"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <TradeView prices={prices} loading={loading} />
          </motion.div>
        );
      case 'market':
        return (
          <motion.div
            key="market"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <MarketView prices={prices} loading={loading} />
          </motion.div>
        );
      case 'secure':
        return (
          <motion.div
            key="secure"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <SecureView />
          </motion.div>
        );
      case 'analytics':
        return (
          <motion.div
            key="analytics"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
          >
            <AnalyticsView prices={prices} />
          </motion.div>
        );
      case 'academy':
      case 'recurring':
      case 'chat':
      case 'chatroom':
        const title = activeTab === 'academy' ? 'Academy' : activeTab === 'recurring' ? 'Recurring Buy' : activeTab === 'chat' ? 'Live Support' : 'Traders Room';
        return (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="bg-white min-h-screen"
          >
            <div className="p-6 flex items-center justify-between border-b border-gray-50 bg-white sticky top-0 z-20">
              <button 
                onClick={() => setActiveTab('home')}
                className="p-2 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <ChevronLeft className="w-6 h-6 text-gray-900" />
              </button>
              <h3 className="font-black tracking-tight text-lg uppercase">{title}</h3>
              <div className="w-10"></div>
            </div>
            {activeTab === 'academy' && <AcademyView />}
            {activeTab === 'recurring' && <RecurringView />}
            {(activeTab === 'chat' || activeTab === 'chatroom') && <ChatView isGroup={activeTab === 'chatroom'} />}
          </motion.div>
        );
      case 'withdraw':
        return null; // Integrated into Assets tab

      default:
        return null;
    }
  };

  return (
    <div className="max-w-md mx-auto bg-gray-50 min-h-screen relative shadow-2xl overflow-hidden font-sans">
      <AnimatePresence>
        {isInitializing ? (
          <SplashScreen key="splash" onComplete={() => setIsInitializing(false)} />
        ) : loadingAuth ? (
           <div key="auth-loading" className="fixed inset-0 flex items-center justify-center bg-gray-900 text-white">Loading...</div>
        ) : !user ? (
          <LoginView key="login" />
        ) : (
          <motion.div
            key="main"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="pb-24"
          >
            <div className="min-h-screen bg-[#F8FAFC] pb-28">
              <AnimatePresence mode="wait">
                {renderContent()}
              </AnimatePresence>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-100 flex justify-around items-center p-4 z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.04)]">
        
        {/* Nav Item: Home */}
        <button 
          onClick={() => setActiveTab('home')}
          className="flex flex-col items-center gap-1 group relative outline-none"
        >
          <div
            className={`p-3 rounded-2xl transition-all duration-300 ${
              activeTab === 'home' 
                ? 'bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/30 text-white' 
                : 'bg-transparent text-gray-400 hover:text-cyan-500'
            }`}
          >
            <Orbit className="w-6 h-6" />
          </div>
          <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors duration-300 ${
            activeTab === 'home' ? 'text-cyan-600 mt-1 opacity-100' : 'text-gray-400 opacity-60'
          }`}>Home</span>
        </button>

        {/* Nav Item: Assets */}
        <button 
          onClick={() => setActiveTab('assets')}
          className="flex flex-col items-center gap-1 outline-none"
        >
          <div className={`p-2 rounded-xl transition-all duration-300 ${activeTab === 'assets' ? 'text-cyan-600 scale-110' : 'text-gray-400 hover:text-cyan-500'}`}>
            <Wallet className="w-6 h-6" />
          </div>
          <span className={`text-[10px] font-bold transition-all duration-300 ${activeTab === 'assets' ? 'text-cyan-600' : 'text-gray-400'}`}>Assets</span>
        </button>

        {/* Nav Item: Trade */}
        <button 
          onClick={() => setActiveTab('trade')}
          className="flex flex-col items-center gap-1 outline-none"
        >
          <div className={`p-2 rounded-xl transition-all duration-300 ${activeTab === 'trade' ? 'text-cyan-600 scale-110' : 'text-gray-400 hover:text-cyan-500'}`}>
            <Zap className="w-6 h-6" />
          </div>
          <span className={`text-[10px] font-bold transition-all duration-300 ${activeTab === 'trade' ? 'text-cyan-600' : 'text-gray-400'}`}>Trade</span>
        </button>

        {/* Nav Item: Market */}
        <button 
          onClick={() => setActiveTab('market')}
          className="flex flex-col items-center gap-1 outline-none"
        >
          <div className={`p-2 rounded-xl transition-all duration-300 ${activeTab === 'market' ? 'text-cyan-600 scale-110' : 'text-gray-400 hover:text-cyan-500'}`}>
            <LineChart className="w-6 h-6" />
          </div>
          <span className={`text-[10px] font-bold transition-all duration-300 ${activeTab === 'market' ? 'text-cyan-600' : 'text-gray-400'}`}>Market</span>
        </button>

        {/* Nav Item: Analytics */}
        <button 
          onClick={() => setActiveTab('analytics')}
          className="flex flex-col items-center gap-1 outline-none"
        >
          <div className={`p-2 rounded-xl transition-all duration-300 ${activeTab === 'analytics' ? 'text-cyan-600 scale-110' : 'text-gray-400 hover:text-cyan-500'}`}>
            <BarChart3 className="w-6 h-6" />
          </div>
          <span className={`text-[10px] font-bold transition-all duration-300 ${activeTab === 'analytics' ? 'text-cyan-600' : 'text-gray-400'}`}>Stats</span>
        </button>

        {/* Nav Item: Secure */}
        <button 
          onClick={() => setActiveTab('secure')}
          className="flex flex-col items-center gap-1 outline-none"
        >
          <div className={`p-2 rounded-xl transition-all duration-300 ${activeTab === 'secure' ? 'text-cyan-600 scale-110' : 'text-gray-400 hover:text-cyan-500'}`}>
            <Shield className="w-6 h-6" />
          </div>
          <span className={`text-[10px] font-bold transition-all duration-300 ${activeTab === 'secure' ? 'text-cyan-600' : 'text-gray-400'}`}>Secure</span>
        </button>
      </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
