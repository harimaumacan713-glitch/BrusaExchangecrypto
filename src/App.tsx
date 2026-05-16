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
import { Wallet, Zap, LineChart, Shield, Orbit } from 'lucide-react';

type TabType = 'home' | 'assets' | 'trade' | 'market' | 'secure';

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

function AppContent() {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [prices, setPrices] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrices = () => {
      fetch('/api/prices')
        .then(res => res.json())
        .then(data => {
          if (data.RAW) {
            setPrices(data);
          }
          setLoading(false);
        })
        .catch(err => {
          console.error('Error fetching prices:', err);
          setLoading(false);
        });
    };

    fetchPrices();

    // WebSocket implementation
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'PRICE_UPDATE') {
          setPrices((prevPrices: any) => {
            if (!prevPrices || !prevPrices.RAW || !prevPrices.DISPLAY) return prevPrices;

            const { symbol, price, volume, change, mktcap } = data;
            if (!prevPrices.RAW[symbol]) return prevPrices;

            // Deep copy to ensure UI triggers update
            const newPrices = {
              ...prevPrices,
              RAW: {
                ...prevPrices.RAW,
                [symbol]: {
                  ...prevPrices.RAW[symbol],
                  IDR: {
                    ...prevPrices.RAW[symbol].IDR,
                    PRICE: price ?? prevPrices.RAW[symbol].IDR.PRICE,
                    VOLUME24HOUR: volume ?? prevPrices.RAW[symbol].IDR.VOLUME24HOUR,
                    CHANGEPCT24HOUR: change ?? prevPrices.RAW[symbol].IDR.CHANGEPCT24HOUR,
                    MKTCAP: mktcap ?? prevPrices.RAW[symbol].IDR.MKTCAP
                  }
                }
              },
              DISPLAY: {
                ...prevPrices.DISPLAY,
                [symbol]: {
                  ...prevPrices.DISPLAY[symbol],
                  IDR: {
                    ...prevPrices.DISPLAY[symbol].IDR,
                    PRICE: price !== undefined 
                      ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(price)
                      : prevPrices.DISPLAY[symbol].IDR.PRICE,
                    CHANGEPCT24HOUR: change !== undefined ? change.toFixed(2) : prevPrices.DISPLAY[symbol].IDR.CHANGEPCT24HOUR,
                    MKTCAP: mktcap !== undefined ? `Rp ${(mktcap / 1_000_000_000_000).toFixed(1)} T` : prevPrices.DISPLAY[symbol].IDR.MKTCAP
                  }
                }
              }
            };

            return newPrices;
          });
        }
      } catch (e) {
        console.error('WebSocket message error:', e);
      }
    };

    ws.onclose = () => {
      console.log('WS connection closed');
    };

    return () => {
      ws.close();
    };
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <motion.div
            key="home"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="bg-gradient-to-b from-[#06b6d4] to-[#0ea5e9] text-white p-6 pb-24">
              <Hero prices={prices} />
            </div>
            <div className="px-6 -mt-16">
              <div className="bg-white rounded-3xl p-6 shadow-xl mb-6">
                <Portfolio prices={prices} loading={loading} />
              </div>
              <LiveMarket prices={prices} loading={loading} />
              <Features />
            </div>
            <Footer />
          </motion.div>
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
            <AssetsView prices={prices} loading={loading} />
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
      default:
        return null;
    }
  };

  return (
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
          <motion.div
            animate={{ 
              scale: activeTab === 'home' ? 1.1 : 1,
              translateY: activeTab === 'home' ? -12 : 0
            }}
            className={`p-3 rounded-2xl transition-all duration-300 ${
              activeTab === 'home' 
                ? 'bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/30 text-white' 
                : 'bg-transparent text-gray-400 hover:text-cyan-500'
            }`}
          >
            <Orbit className="w-6 h-6" />
          </motion.div>
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
  );
}
