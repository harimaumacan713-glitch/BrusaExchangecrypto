/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot, query, where, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import { Login } from './components/Login';
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
import { AetherArena } from './components/AetherArena';
import { Wallet, Zap, LineChart, Shield, Orbit, BarChart3, ChevronLeft, X, Swords } from 'lucide-react';
import { SplashScreen } from './components/SplashScreen';
import { IncomingFundsNotification } from './components/IncomingFundsNotification';

type TabType = 'home' | 'assets' | 'trade' | 'market' | 'secure' | 'analytics' | 'withdraw' | 'academy' | 'recurring' | 'chat' | 'chatroom' | 'arena';

const assetMeta = {
  BTC: { name: 'Bitcoin', amount: 0.005 },
  ETH: { name: 'Ethereum', amount: 0.08 },
  SOL: { name: 'Solana', amount: 1.2 },
  USDT: { name: 'TRether', amount: 65 },
};

import { TradingProvider } from './context/TradingContext';
import { ToastProvider } from './context/ToastContext';

export default function App() {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        try {
          // Ensure realtime wallet exists
          const walletRef = doc(db, 'wallets', user.uid);
          const walletSnap = await getDoc(walletRef);
          if (!walletSnap.exists()) {
            await setDoc(walletRef, {
              balance: 100000000, // 100M IDR Initial
              currency: 'IDR'
            });
          } else if (walletSnap.data().balance === undefined || walletSnap.data().balance === null) {
            await setDoc(walletRef, {
              balance: 100000000,
              currency: 'IDR'
            }, { merge: true });
          }

          // Ensure exchange wallet exists
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
          
          // Update lastLoginAt and ensure accountNumber and asset IP addresses
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          const userData = userSnap.data();
          
          const updates: Record<string, any> = {
            lastLoginAt: serverTimestamp()
          };

          if (!userData?.accountNumber) {
            updates.accountNumber = Math.floor(1000000000 + Math.random() * 9000000000).toString();
          }
          if (!userData?.btc_ip) {
            updates.btc_ip = `10.101.${Math.floor(10 + Math.random() * 235)}.${Math.floor(1 + Math.random() * 254)}`;
          }
          if (!userData?.eth_ip) {
            updates.eth_ip = `10.102.${Math.floor(10 + Math.random() * 235)}.${Math.floor(1 + Math.random() * 254)}`;
          }
          if (!userData?.sol_ip) {
            updates.sol_ip = `10.103.${Math.floor(10 + Math.random() * 235)}.${Math.floor(1 + Math.random() * 254)}`;
          }
          if (!userData?.usdt_ip) {
            updates.usdt_ip = `10.104.${Math.floor(10 + Math.random() * 235)}.${Math.floor(1 + Math.random() * 254)}`;
          }
          if (!userData?.xrp_ip) {
            updates.xrp_ip = `10.105.${Math.floor(10 + Math.random() * 235)}.${Math.floor(1 + Math.random() * 254)}`;
          }

          await setDoc(userRef, updates, { merge: true });

        } catch (error) {
          console.error("Error ensuring user data on auth state change:", error);
        }
      }
      
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-screen bg-slate-950 text-white font-sans">Loading...</div>;

  return (
    <ToastProvider>
      <TradingProvider>
          <div className="min-h-screen bg-slate-950 font-sans text-slate-100 selection:bg-cyan-500/30">
            {user ? <AppContent /> : <Login onLogin={() => setUser(auth.currentUser)} />}
          </div>
      </TradingProvider>
    </ToastProvider>
  );
}

function AppContent() {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [assetAction, setAssetAction] = useState<'none' | 'withdraw' | 'deposit' | 'buy' | 'transfer' | 'receive' | 'exchange_transfer'>('none');
  const [prices, setPrices] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isInitializing, setIsInitializing] = useState(true);

  // Buffer and throttle high-frequency WebSocket price updates
  const priceUpdatesBufferRef = useRef<Record<string, any>>({});
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleWithdrawClick = () => {
    setActiveTab('assets');
    setAssetAction('withdraw');
  };

  useEffect(() => {
    // 1. Initial State Fetch
    fetch('/api/prices').then(res => {
      if (!res.ok) throw new Error('Failed to fetch prices');
      return res.json();
    }).then(data => {
      if (data && data.RAW) setPrices(data);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });

    // 2. Real-time Firestore sync (for initial fallback or persisted data)
    const unsubscribe = onSnapshot(collection(db, 'market_data'), (snapshot) => {
      setPrices((prevPrices: any) => {
        if (!prevPrices || !prevPrices.RAW) return prevPrices;
        const newRaw = { ...prevPrices.RAW };
        const newDisplay = prevPrices.DISPLAY ? { ...prevPrices.DISPLAY } : {};
        const usdtRate = newRaw.USDT?.IDR?.PRICE || 16150;

        snapshot.docChanges().forEach((change) => {
          const data = change.doc.data();
          const symbol = change.doc.id;
          let idrPrice = data.price;
          let priceUsdt = data.price;

          if (data.isStock) {
            const isIdx = data.isIdx || data.isIndex;
            if (isIdx) priceUsdt = data.price / usdtRate;
            else idrPrice = data.price * usdtRate;
          } else {
            idrPrice = data.price * usdtRate;
          }

          if (symbol === 'USDT') { idrPrice = data.price; priceUsdt = 1; }

          newRaw[symbol] = {
            ...newRaw[symbol],
            IDR: {
              ...(newRaw[symbol]?.IDR || {}),
              PRICE: idrPrice,
              PRICE_USDT: priceUsdt,
              CHANGEPCT24HOUR: data.change,
              MKTCAP: data.mktcap,
              VOLUME24HOUR: data.volume
            }
          };

          const isUsStock = data.isStock && !data.isIdx && !data.isIndex;
          const formattedPrice = isUsStock
            ? `$${data.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}` 
            : `Rp ${idrPrice.toLocaleString('id-ID')}`;

          newDisplay[symbol] = {
            ...newDisplay[symbol],
            IDR: {
              ...(newDisplay[symbol]?.IDR || {}),
              PRICE: formattedPrice,
              CHANGEPCT24HOUR: data.change ? data.change.toFixed(2) : "0.00"
            }
          };
        });

        return { ...prevPrices, RAW: newRaw, DISPLAY: newDisplay };
      });
    });

    // Helper to flush current updates buffer to the state
    const commitUpdates = () => {
      setPrices((prevPrices: any) => {
        if (!prevPrices || !prevPrices.RAW) return prevPrices;
        const buffer = priceUpdatesBufferRef.current;
        const symbols = Object.keys(buffer);
        if (symbols.length === 0) return prevPrices;

        const newRaw = { ...prevPrices.RAW };
        const newDisplay = prevPrices.DISPLAY ? { ...prevPrices.DISPLAY } : {};
        const usdtRate = newRaw.USDT?.IDR?.PRICE || 16150;

        symbols.forEach((symbol) => {
          const data = buffer[symbol];
          let idrPrice = data.price;
          let priceUsdt = data.price;

          if (data.isStock) {
            if (data.isIdx) {
              priceUsdt = data.price / usdtRate;
            } else {
              idrPrice = data.price * usdtRate;
            }
          } else {
            // Crypto - WSS data.price is ALREADY in IDR
            idrPrice = data.price;
            priceUsdt = data.price / usdtRate;
          }
          if (symbol === 'USDT') { idrPrice = data.price; priceUsdt = 1; }

          newRaw[symbol] = {
            ...newRaw[symbol],
            IDR: {
              ...(newRaw[symbol]?.IDR || {}),
              PRICE: idrPrice,
              PRICE_USDT: priceUsdt,
              CHANGEPCT24HOUR: data.change || (newRaw[symbol]?.IDR?.CHANGEPCT24HOUR),
              MKTCAP: data.mktcap || (newRaw[symbol]?.IDR?.MKTCAP),
              VOLUME24HOUR: data.volume || (newRaw[symbol]?.IDR?.VOLUME24HOUR)
            }
          };

          const isUsStock = data.isStock && !data.isIdx && !data.isIndex;
          const formattedPrice = isUsStock
            ? `$${data.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}` 
            : `Rp ${idrPrice.toLocaleString('id-ID')}`;

          newDisplay[symbol] = {
            ...newDisplay[symbol],
            IDR: {
              ...(newDisplay[symbol]?.IDR || {}),
              PRICE: formattedPrice,
              CHANGEPCT24HOUR: data.change ? parseFloat(data.change).toFixed(2) : (newDisplay[symbol]?.IDR?.CHANGEPCT24HOUR)
            }
          };
        });

        // Reset the buffer
        priceUpdatesBufferRef.current = {};
        return { ...prevPrices, RAW: newRaw, DISPLAY: newDisplay };
      });
    };

    // 3. Ultra Real-Time WebSocket sync from our server
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const ws = new WebSocket(`${protocol}//${host}`);

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'PRICE_UPDATE') {
          priceUpdatesBufferRef.current[message.symbol] = message;
          if (!updateTimeoutRef.current) {
            updateTimeoutRef.current = setTimeout(() => {
              commitUpdates();
              updateTimeoutRef.current = null;
            }, 300); // Batch/throttle pricing changes in 300ms windows
          }
        }
      } catch(e) {
        // ignore
      }
    };

    return () => {
      unsubscribe();
      ws.close();
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div key="home" className="relative">
            <Hero prices={prices} onTabChange={setActiveTab} />
            <div className="px-4 sm:px-6 -mt-16 relative z-10 space-y-6">
              {/* Premium Dashboard Portfolio Allocations & Growth Trends */}
              <Portfolio prices={prices} loading={loading} isDashboard={true} />
              
              {/* Split layout for Live Market and Quick Feed Actions */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                <div className="xl:col-span-8">
                  <LiveMarket prices={prices} loading={loading} />
                </div>
                <div className="xl:col-span-4 bg-slate-900 border border-slate-800 p-6 rounded-[32px] shadow-xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 blur-2xl rounded-full" />
                  <div className="relative z-10">
                    <span className="text-[10px] font-mono font-black text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-md uppercase tracking-widest inline-block mb-3">
                      🚀 SWAP & STRIKE FEED
                    </span>
                    <h4 className="text-white font-extrabold text-base mb-1">Aether Trading Terminal</h4>
                    <p className="text-slate-400 text-xs font-semibold leading-relaxed mb-6">
                      Execute low-slippage lightning trades with automated liquidity, and challenge neural agent bot models in the high stakes AI Duel Arena!
                    </p>
                    <div className="space-y-3">
                      <button 
                        onClick={() => setActiveTab('trade')}
                        className="w-full py-3.5 bg-gradient-to-br from-cyan-400 to-indigo-600 text-slate-950 font-black text-xs uppercase tracking-widest rounded-2xl transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-cyan-500/10 flex items-center justify-center gap-2"
                      >
                        <Zap className="w-4 h-4 fill-current text-slate-950" /> Instant Trade Hub
                      </button>
                      <button 
                        onClick={() => setActiveTab('arena')}
                        className="w-full py-3.5 bg-slate-800 hover:bg-slate-750 text-white font-black text-xs uppercase tracking-widest rounded-2xl border border-slate-750 hover:border-cyan-500/30 transition-all flex items-center justify-center gap-2"
                      >
                        <Swords className="w-4 h-4 text-cyan-400" /> Enter AI Arena
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Real-time Ticker and News Analysis Stream */}
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
      case 'arena':
        return (
          <motion.div
            key="arena"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
          >
            <AetherArena prices={prices} loading={loading} />
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
    <div className="bg-slate-950 min-h-screen font-sans text-gray-100">
      <div className="w-full min-h-screen relative overflow-x-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <AnimatePresence>
          {isInitializing ? (
            <SplashScreen onComplete={() => setIsInitializing(false)} />
          ) : (
            <motion.div
              key="main"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col min-h-screen"
            >
              <div className="flex flex-col lg:flex-row min-h-screen">
                {/* Desktop Sidebar */}
                <div className="hidden lg:flex flex-col w-64 bg-slate-900 border-r border-white/10 p-6 sticky top-0 h-screen">
                  <div className="flex items-center gap-3 mb-10 px-2">
                    <div className="w-8 h-8 bg-cyan-500 rounded-xl flex items-center justify-center">
                      <Orbit className="w-5 h-5 text-slate-950" />
                    </div>
                    <span className="font-black tracking-tighter text-lg text-white">AETHEREX</span>
                  </div>
                  
                  <nav className="flex-1 space-y-2">
                    {[
                      { id: 'home', icon: Orbit, label: 'Dashboard' },
                      { id: 'assets', icon: Wallet, label: 'Portfolio' },
                      { id: 'trade', icon: Zap, label: 'Trade' },
                      { id: 'market', icon: LineChart, label: 'Markets' },
                      { id: 'arena', icon: Swords, label: 'AI Duel Arena' },
                      { id: 'secure', icon: Shield, label: 'Security' },
                    ].map(item => (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id as TabType)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-bold text-sm ${
                          activeTab === item.id 
                            ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20' 
                            : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                        }`}
                      >
                        <item.icon className="w-5 h-5" />
                        {item.label}
                      </button>
                    ))}
                  </nav>

                  <div className="pt-6 border-t border-slate-800">
                    <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
                      <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Support 24/7</p>
                      <button 
                        onClick={() => setActiveTab('chat')}
                        className="w-full bg-slate-900 border border-slate-700 py-2 rounded-xl text-xs font-bold text-slate-200 hover:border-cyan-500 hover:text-cyan-400 transition-colors"
                      >
                        Contact Support
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex-1 pb-28 lg:pb-0 overflow-y-auto">
                  <div className="max-w-7xl mx-auto w-full">
                    <IncomingFundsNotification />
                    <AnimatePresence mode="wait">
                      {renderContent()}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* Bottom Navigation Locked to Container (Mobile Only) */}
              <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none lg:hidden">
                <div className="max-w-sm md:max-w-md mx-auto pointer-events-auto px-1 pb-1">
                  <div className="bg-slate-900 border border-white/10 flex justify-around items-center p-3 rounded-t-[32px] md:rounded-[32px] md:mb-4 shadow-[0_-10px_40px_rgba(0,0,0,0.3)]">
                    
                    {/* Nav Item: Home */}
                    <button 
                      onClick={() => setActiveTab('home')}
                      className="flex flex-col items-center gap-1 group relative outline-none"
                    >
                      <div
                        className={`p-2.5 rounded-2xl transition-all duration-300 ${
                          activeTab === 'home' 
                            ? 'bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/30 text-white' 
                            : 'bg-transparent text-slate-400 hover:text-cyan-500'
                        }`}
                      >
                        <Orbit className="w-6 h-6" />
                      </div>
                      <span className={`text-[9px] font-black uppercase tracking-wider transition-all duration-300 ${
                        activeTab === 'home' ? 'text-cyan-400 opacity-100' : 'text-slate-500 opacity-60'
                      }`}>Home</span>
                    </button>

                    {/* Nav Item: Assets */}
                    <button 
                      onClick={() => setActiveTab('assets')}
                      className="flex flex-col items-center gap-1 outline-none"
                    >
                      <div className={`p-2 rounded-xl transition-all duration-300 ${activeTab === 'assets' ? 'text-cyan-400' : 'text-slate-400 hover:text-cyan-500'}`}>
                        <Wallet className="w-5 h-5" />
                      </div>
                      <span className={`text-[9px] font-bold transition-all duration-300 ${activeTab === 'assets' ? 'text-cyan-400' : 'text-slate-500'}`}>Assets</span>
                    </button>

                    {/* Nav Item: Trade */}
                    <button 
                      onClick={() => setActiveTab('trade')}
                      className="flex flex-col items-center gap-1 outline-none"
                    >
                      <div className={`p-2 rounded-xl transition-all duration-300 ${activeTab === 'trade' ? 'text-cyan-400' : 'text-slate-400 hover:text-cyan-500'}`}>
                        <Zap className="w-5 h-5" />
                      </div>
                      <span className={`text-[9px] font-bold transition-all duration-300 ${activeTab === 'trade' ? 'text-cyan-400' : 'text-slate-500'}`}>Trade</span>
                    </button>

                    {/* Nav Item: Market */}
                    <button 
                      onClick={() => setActiveTab('market')}
                      className="flex flex-col items-center gap-1 outline-none"
                    >
                      <div className={`p-2 rounded-xl transition-all duration-300 ${activeTab === 'market' ? 'text-cyan-400' : 'text-slate-400 hover:text-cyan-500'}`}>
                        <LineChart className="w-5 h-5" />
                      </div>
                      <span className={`text-[9px] font-bold transition-all duration-300 ${activeTab === 'market' ? 'text-cyan-400' : 'text-slate-500'}`}>Market</span>
                    </button>

                    {/* Nav Item: Secure */}
                    <button 
                      onClick={() => setActiveTab('secure')}
                      className="flex flex-col items-center gap-1 outline-none"
                    >
                      <div className={`p-2 rounded-xl transition-all duration-300 ${activeTab === 'secure' ? 'text-cyan-400' : 'text-slate-400 hover:text-cyan-500'}`}>
                        <Shield className="w-5 h-5" />
                      </div>
                      <span className={`text-[9px] font-bold transition-all duration-300 ${activeTab === 'secure' ? 'text-cyan-400' : 'text-slate-500'}`}>Secure</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
