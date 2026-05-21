import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTrading } from '../context/TradingContext';
import { 
  Swords, Trophy, Zap, Bot, User, Flame, Coins, 
  TrendingUp, TrendingDown, RefreshCw, AlertCircle, 
  X, Check, Sparkles, MessageSquare, AlertTriangle, Play
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis } from 'recharts';

interface AetherArenaProps {
  prices: any;
  loading: boolean;
}

interface Copilot {
  id: string;
  name: string;
  avatar: string;
  role: string;
  style: string;
  winRate: number;
  streak: number;
  xp: number;
  portfolioValue: number;
  focus: string[];
  motto: string;
}

export function AetherArena({ prices, loading }: AetherArenaProps) {
  const { buyAsset, sellAsset, balance, balanceUsdt, positions } = useTrading();
  
  const [activeTab, setActiveTab] = useState<'lounge' | 'duel'>('lounge');
  const [selectedCopilot, setSelectedCopilot] = useState<string>('ahmad');
  
  // Real-time rates
  const currentUsdtRate = prices?.RAW?.USDT?.IDR?.PRICE || 16150;
  const getAssetPriceUsdt = (symbol: string): number => {
    if (!prices || !prices.RAW || !prices.RAW[symbol]) return 100;
    return prices.RAW[symbol].IDR.PRICE_USDT || (prices.RAW[symbol].IDR.PRICE / currentUsdtRate);
  };

  // Copilots specifications
  const copilots: Copilot[] = [
    {
      id: 'ahmad',
      name: 'Budi "Scalp Legend" Ahmad',
      avatar: '👨‍🎤',
      role: 'Indonesian High-Risk Force',
      style: 'Aggressive High Frequency',
      winRate: 78.4,
      streak: 5,
      xp: 14200,
      portfolioValue: 24500,
      focus: ['BTC', 'SOL', 'ETH'],
      motto: 'Mumpung tren lagi naik, pencet BUY terus sampek dapet jackpot!'
    },
    {
      id: 'siti',
      name: 'Siti "Jawara Swing" Rahayu',
      avatar: '👩‍💼',
      role: 'IDX & Bluechip Analyst',
      style: 'Dynamic Value Follower',
      winRate: 83.2,
      streak: 9,
      xp: 18900,
      portfolioValue: 48900,
      focus: ['BBCA', 'TLKM', 'BBRI'],
      motto: 'Ikuti arus akumulasi paus besar. Lebih baik profit pelan asal konsisten.'
    },
    {
      id: 'satoshi',
      name: 'Nakamoto-Bot v4.2',
      avatar: '🤖',
      role: 'Autonomous AI Quant Protocol',
      style: 'Mathematical Mean Reversion',
      winRate: 88.7,
      streak: 14,
      xp: 31200,
      portfolioValue: 125000,
      focus: ['BTC', 'NVDA', 'ETH'],
      motto: 'Trend divergence detected. Execution of algorithmic delta-neutral trades initiated.'
    }
  ];

  // Simulated live orders stream for copilots
  type SimulatedTrade = {
    id: number;
    copilotId: string;
    symbol: string;
    type: 'buy' | 'sell';
    amount: number;
    price: number;
    timestamp: string;
    executed: boolean;
  };

  const [simulatedTrades, setSimulatedTrades] = useState<SimulatedTrade[]>([
    { id: 101, copilotId: 'ahmad', symbol: 'BTC', type: 'buy', amount: 0.15, price: 67250, timestamp: '16:35:10', executed: true },
    { id: 102, copilotId: 'siti', symbol: 'BBRI', type: 'buy', amount: 500, price: 3.12, timestamp: '16:38:15', executed: true },
    { id: 103, copilotId: 'satoshi', symbol: 'NVDA', type: 'sell', amount: 15, price: 924.50, timestamp: '16:40:02', executed: true }
  ]);

  const [traderLogs, setTraderLogs] = useState<string[]>([
    'Budi Ahmad is scanning BTC order books...',
    'Siti Rahayu calculated a support bounce for BBRI',
    'Nakamoto-Bot v4.2 updated weights for quant volatility index'
  ]);

  // Feed simulated orders in real-time
  useEffect(() => {
    const tradeInterval = setInterval(() => {
      const randomCopilot = copilots[Math.floor(Math.random() * copilots.length)];
      const randomSymbol = randomCopilot.focus[Math.floor(Math.random() * randomCopilot.focus.length)];
      const isBuy = Math.random() > 0.45;
      const priceUsdt = getAssetPriceUsdt(randomSymbol);
      
      const newTrade: SimulatedTrade = {
        id: Date.now(),
        copilotId: randomCopilot.id,
        symbol: randomSymbol,
        type: isBuy ? 'buy' : 'sell',
        amount: parseFloat((Math.random() * 2 + 0.01).toFixed(randomSymbol === 'BTC' ? 3 : 1)),
        price: priceUsdt,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        executed: true
      };

      setSimulatedTrades(prev => [newTrade, ...prev.slice(0, 14)]);
      
      // Post log
      const logTemplates = [
        `${randomCopilot.name} opened a ${newTrade.type.toUpperCase()} position on ${randomSymbol}`,
        `${randomCopilot.name} noticed heavy breakout volume on ${randomSymbol}`,
        `${randomCopilot.name} rebalanced portfolio for ${randomSymbol} trade`,
      ];
      setTraderLogs(prev => [logTemplates[Math.floor(Math.random() * logTemplates.length)], ...prev.slice(0, 4)]);
    }, 12000);

    return () => clearInterval(tradeInterval);
  }, [prices]);

  // Copy trade implementation
  const [copyTradeStatus, setCopyTradeStatus] = useState<{ id: number, status: 'idle' | 'success' | 'error' | 'loading' }>({ id: 0, status: 'idle' });
  
  const handleCopyTrade = async (trade: SimulatedTrade) => {
    setCopyTradeStatus({ id: trade.id, status: 'loading' });
    try {
      let success = false;
      if (trade.type === 'buy') {
        success = await buyAsset(trade.symbol, trade.amount, trade.price);
      } else {
        success = await sellAsset(trade.symbol, trade.amount, trade.price);
      }
      
      if (success) {
        setCopyTradeStatus({ id: trade.id, status: 'success' });
      } else {
        setCopyTradeStatus({ id: trade.id, status: 'error' });
      }
    } catch {
      setCopyTradeStatus({ id: trade.id, status: 'error' });
    }
    setTimeout(() => setCopyTradeStatus({ id: 0, status: 'idle' }), 3000);
  };

  // --- DUEL ARENA STATE ---
  const [duelOpponentId, setDuelOpponentId] = useState<string>('ahmad');
  const [duelState, setDuelState] = useState<'idle' | 'countdown' | 'active' | 'finished'>('idle');
  const [countdown, setCountdown] = useState<number>(3);
  const [duelTimer, setDuelTimer] = useState<number>(60);
  const [userDuelBalance, setUserDuelBalance] = useState<number>(50000); // virtual USDT
  const [botDuelBalance, setBotDuelBalance] = useState<number>(50000); // virtual USDT
  const [duelAsset, setDuelAsset] = useState<string>('BTC');
  const [userDuelPositions, setUserDuelPositions] = useState<{ [asset: string]: number }>({ BTC: 0, ETH: 0, SOL: 0 });
  const [botDuelPositions, setBotDuelPositions] = useState<{ [asset: string]: number }>({ BTC: 0, ETH: 0, SOL: 0 });
  const [duelPnlHistory, setDuelPnlHistory] = useState<any[]>([]);
  const [duelLog, setDuelLog] = useState<string[]>([]);
  const [duelWinnerInfo, setDuelWinnerInfo] = useState<any>(null);

  const activeOpponent = copilots.find(c => c.id === duelOpponentId) || copilots[0];

  // Start Duel Process
  const startDuelCountdown = () => {
    setDuelState('countdown');
    setCountdown(3);
    setDuelTimer(60);
    setUserDuelBalance(50000);
    setBotDuelBalance(50000);
    setUserDuelPositions({ BTC: 0, ETH: 0, SOL: 0 });
    setBotDuelPositions({ BTC: 0, ETH: 0, SOL: 0 });
    setDuelPnlHistory([]);
    setDuelLog(['Duel Arena initialized. 50,000 USDT assigned to both players.']);
  };

  // Countdown clock effect
  useEffect(() => {
    if (duelState === 'countdown') {
      if (countdown > 0) {
        const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        setDuelState('active');
      }
    }
  }, [countdown, duelState]);

  // Real-time AI bot action simulation during active duel
  useEffect(() => {
    if (duelState !== 'active') return;

    // AI bot triggers a random trading decision every 4-8 seconds
    const interval = setInterval(() => {
      const assets = ['BTC', 'ETH', 'SOL'];
      const targetAsset = assets[Math.floor(Math.random() * assets.length)];
      const price = getAssetPriceUsdt(targetAsset);
      const isBuying = Math.random() > 0.4;
      
      if (isBuying) {
        // buy
        const maxSpend = botDuelBalance * 0.4; // spend 40% of balance
        const buyQty = maxSpend / price;
        if (buyQty > 0) {
          setBotDuelBalance(prev => prev - (buyQty * price));
          setBotDuelPositions(prev => ({ ...prev, [targetAsset]: prev[targetAsset] + buyQty }));
          setDuelLog(prev => [`🤖 [AI] ${activeOpponent.name} BOUGHT ${buyQty.toFixed(4)} ${targetAsset} at $${price.toFixed(2)}`, ...prev]);
        }
      } else {
        // sell
        const holdQty = botDuelPositions[targetAsset];
        if (holdQty > 0) {
          const sellQty = holdQty * 0.8; // sell 80% of holding
          setBotDuelBalance(prev => prev + (sellQty * price));
          setBotDuelPositions(prev => ({ ...prev, [targetAsset]: prev[targetAsset] - sellQty }));
          setDuelLog(prev => [`🦾 [AI] ${activeOpponent.name} SOLD ${sellQty.toFixed(4)} ${targetAsset} at $${price.toFixed(2)}`, ...prev]);
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [duelState, botDuelBalance, botDuelPositions, duelOpponentId]);

  // Main Duel countdown & PNL simulation ticks
  useEffect(() => {
    if (duelState !== 'active') return;

    const timer = setInterval(() => {
      setDuelTimer(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          finishDuel();
          return 0;
        }
        return prev - 1;
      });

      // Calculate portfolio values
      const currentPrices = {
        BTC: getAssetPriceUsdt('BTC'),
        ETH: getAssetPriceUsdt('ETH'),
        SOL: getAssetPriceUsdt('SOL')
      };

      const userHoldingsValue = Object.keys(userDuelPositions).reduce((acc, sym) => {
        return acc + (userDuelPositions[sym] * currentPrices[sym as 'BTC'|'ETH'|'SOL']);
      }, 0);

      const botHoldingsValue = Object.keys(botDuelPositions).reduce((acc, sym) => {
        return acc + (botDuelPositions[sym] * currentPrices[sym as 'BTC'|'ETH'|'SOL']);
      }, 0);

      const userTotal = userDuelBalance + userHoldingsValue;
      const botTotal = botDuelBalance + botHoldingsValue;

      const userPnl = userTotal - 50000;
      const botPnl = botTotal - 50000;

      setDuelPnlHistory(prev => [
        ...prev,
        {
          second: 60 - duelTimer,
          userPnl,
          botPnl
        }
      ]);

    }, 1000);

    return () => clearInterval(timer);
  }, [duelState, duelTimer, userDuelBalance, userDuelPositions, botDuelBalance, botDuelPositions]);

  // Complete the Duel and allocate results
  const finishDuel = () => {
    const currentPrices = {
      BTC: getAssetPriceUsdt('BTC'),
      ETH: getAssetPriceUsdt('ETH'),
      SOL: getAssetPriceUsdt('SOL')
    };

    const userHoldingsValue = Object.keys(userDuelPositions).reduce((acc, sym) => {
      return acc + (userDuelPositions[sym] * currentPrices[sym as 'BTC'|'ETH'|'SOL']);
    }, 0);

    const botHoldingsValue = Object.keys(botDuelPositions).reduce((acc, sym) => {
      return acc + (botDuelPositions[sym] * currentPrices[sym as 'BTC'|'ETH'|'SOL']);
    }, 0);

    const userFinal = userDuelBalance + userHoldingsValue;
    const botFinal = botDuelBalance + botHoldingsValue;

    const userW = userFinal > botFinal;
    const difference = Math.abs(userFinal - botFinal);

    setDuelWinnerInfo({
      winner: userW ? 'user' : 'bot',
      userTotal: userFinal,
      botTotal: botFinal,
      userPnl: userFinal - 50000,
      botPnl: botFinal - 50000,
      reward: userW ? 150000 : 0 // Rp 150,000 IDR
    });

    setDuelState('finished');
  };

  // Quick Action Trading inside the duel
  const handleDuelAction = (actionSymbol: string, actionType: 'buy' | 'sell') => {
    const price = getAssetPriceUsdt(actionSymbol);
    if (actionType === 'buy') {
      const cost = 0.5 * price; // action unit: 0.5 BTC / 0.5 ETH / etc.
      if (userDuelBalance >= cost) {
        setUserDuelBalance(prev => prev - cost);
        setUserDuelPositions(prev => ({ ...prev, [actionSymbol]: prev[actionSymbol] + 0.5 }));
        setDuelLog(prev => [`🟢 [Kamu] Membeli 0.50 ${actionSymbol} @ $${price.toFixed(2)}`, ...prev]);
      } else {
        setDuelLog(prev => [`⚠️ [System] Saldo duel tidak cukup untuk membeli 0.5 ${actionSymbol}`, ...prev]);
      }
    } else {
      const currentHolding = userDuelPositions[actionSymbol];
      if (currentHolding >= 0.5) {
        setUserDuelBalance(prev => prev + (0.5 * price));
        setUserDuelPositions(prev => ({ ...prev, [actionSymbol]: currentHolding - 0.5 }));
        setDuelLog(prev => [`🔴 [Kamu] Menjual 0.50 ${actionSymbol} @ $${price.toFixed(2)}`, ...prev]);
      } else {
        setDuelLog(prev => [`⚠️ [System] Koin ${actionSymbol} tidak cukup untuk dijual`, ...prev]);
      }
    }
  };

  const currentPricesLocal = {
    BTC: getAssetPriceUsdt('BTC'),
    ETH: getAssetPriceUsdt('ETH'),
    SOL: getAssetPriceUsdt('SOL')
  };

  const liveUserTotalVal = userDuelBalance + Object.keys(userDuelPositions).reduce((acc, sym) => {
    return acc + (userDuelPositions[sym] * currentPricesLocal[sym as 'BTC'|'ETH'|'SOL']);
  }, 0);

  const liveBotTotalVal = botDuelBalance + Object.keys(botDuelPositions).reduce((acc, sym) => {
    return acc + (botDuelPositions[sym] * currentPricesLocal[sym as 'BTC'|'ETH'|'SOL']);
  }, 0);

  const userLivePnl = liveUserTotalVal - 50000;
  const botLivePnl = liveBotTotalVal - 50000;

  return (
    <div className="p-4 lg:p-8 space-y-8 bg-slate-950 font-sans text-slate-100 min-h-screen">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs uppercase tracking-widest font-black mb-1">
            <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
            Exclusive Real-Time Arena
          </div>
          <h1 className="text-3xl font-black bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            AETHER DUEL ARENA
          </h1>
          <p className="text-slate-400 text-sm font-medium mt-1">
            Tantang AI Copilot canggih dalam pertempuran trading real-time 60-detik atau salin posisi emas mereka secara langsung!
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-slate-900 border border-slate-800 p-1.5 rounded-2xl w-full md:w-auto self-start">
          <button
            onClick={() => setActiveTab('lounge')}
            className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all w-1/2 md:w-auto ${
              activeTab === 'lounge'
                ? 'bg-gradient-to-br from-cyan-500 to-indigo-600 text-slate-950 shadow-lg shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Bot className="w-4 h-4" />
            AI Lounge
          </button>
          <button
            onClick={() => setActiveTab('duel')}
            className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all w-1/2 md:w-auto ${
              activeTab === 'duel'
                ? 'bg-gradient-to-br from-cyan-500 to-indigo-600 text-slate-950 shadow-lg shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Swords className="w-4 h-4" />
            Speed Trading Duel
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <RefreshCw className="w-10 h-10 text-cyan-400 animate-spin mb-4" />
          <p className="font-bold text-slate-400 text-sm">Menghubungkan real-time ticker feed...</p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {activeTab === 'lounge' ? (
            <motion.div
              key="lounge"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* Left & Middle Column: Copilot Profiles & Order copy */}
              <div className="lg:col-span-2 space-y-8">
                {/* Copilot Selector Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {copilots.map((copilot) => {
                    const isSelected = selectedCopilot === copilot.id;
                    return (
                      <button
                        key={copilot.id}
                        onClick={() => setSelectedCopilot(copilot.id)}
                        className={`text-left p-5 rounded-3xl border transition-all relative overflow-hidden group flex flex-col justify-between h-48 ${
                          isSelected
                            ? 'bg-slate-900 border-cyan-500/70 shadow-lg shadow-cyan-500/10'
                            : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                        }`}
                      >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-3xl rounded-full" />
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-3xl">{copilot.avatar}</span>
                            <div className="flex bg-slate-950 border border-slate-800 px-2 py-1 rounded-lg text-[9px] font-mono text-cyan-400 font-bold">
                              WIN RATE {copilot.winRate}%
                            </div>
                          </div>
                          <h3 className="font-bold text-white text-base tracking-tight">{copilot.name}</h3>
                          <p className="text-[10px] text-zinc-400 font-medium font-mono uppercase tracking-wider mt-0.5">{copilot.role}</p>
                        </div>

                        <div className="flex justify-between items-center border-t border-slate-800/80 pt-3">
                          <span className="text-xs font-mono font-medium text-slate-500">Streak</span>
                          <span className="text-sm font-black text-emerald-400 flex items-center gap-1">
                            <Flame className="w-4 h-4 fill-current text-orange-500 animate-pulse" />
                            +{copilot.streak} Wins
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Selected Copilot Alpha Focus */}
                {(() => {
                  const current = copilots.find(c => c.id === selectedCopilot)!;
                  return (
                    <div className="bg-slate-900/40 border border-slate-800 rounded-[32px] p-6 md:p-8 space-y-6 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-8 text-7xl select-none opacity-5">{current.avatar}</div>
                      
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <h2 className="text-2xl font-black text-white">{current.name}</h2>
                          <p className="text-zinc-400 font-mono text-xs uppercase tracking-wider mt-1">{current.style}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400 font-mono">Focus Assets:</span>
                          <div className="flex gap-1.5">
                            {current.focus.map(ast => (
                              <span key={ast} className="bg-slate-800 border border-slate-700/60 px-2.5 py-1 rounded-xl text-xs font-bold text-slate-200">
                                {ast}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Motto speech bubble */}
                      <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 flex gap-3 items-start">
                        <MessageSquare className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                        <p className="text-sm text-slate-300 italic font-medium">"{current.motto}"</p>
                      </div>

                      {/* Simulated Portfolio Assets */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-slate-950/60 border border-slate-900 rounded-2xl p-4">
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Portfolio Allocation</p>
                          <p className="text-lg font-black text-white font-mono">${current.portfolioValue.toLocaleString()}</p>
                        </div>
                        <div className="bg-slate-950/60 border border-slate-900 rounded-2xl p-4">
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Win Ratio</p>
                          <p className="text-lg font-black text-emerald-400 font-mono">{current.winRate}%</p>
                        </div>
                        <div className="bg-slate-950/60 border border-slate-900 rounded-2xl p-4">
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Current XP</p>
                          <p className="text-lg font-black text-indigo-400 font-mono">{current.xp.toLocaleString()} XP</p>
                        </div>
                        <div className="bg-slate-950/60 border border-slate-900 rounded-2xl p-4">
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Status</p>
                          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-bold mt-1 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                            Live Analyzing
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Trade Copy stream */}
                <div className="bg-slate-900 border border-slate-800 rounded-[32px] p-6 space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-black text-white">Live Signals & Order Stream</h3>
                    <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-xl text-[10px] font-mono text-zinc-400 border border-slate-800">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      Dynamic Order Link
                    </div>
                  </div>

                  <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                    {simulatedTrades.map((trade) => {
                      const copilotRef = copilots.find(c => c.id === trade.copilotId)!;
                      const isTargetCopilot = trade.copilotId === selectedCopilot;
                      return (
                        <div
                          key={trade.id}
                          className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                            isTargetCopilot
                              ? 'bg-slate-900/80 border-slate-700/60 shadow'
                              : 'bg-slate-950/40 border-slate-900 opacity-60 hover:opacity-100'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{copilotRef?.avatar || '👤'}</span>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-white">{copilotRef?.name || 'Copilot'}</span>
                                <span className="text-[10px] font-mono text-slate-500">{trade.timestamp}</span>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`text-xs font-black uppercase px-2 py-0.5 rounded ${
                                  trade.type === 'buy' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                }`}>
                                  {trade.type}
                                </span>
                                <span className="text-xs font-mono font-bold text-slate-300">
                                  {trade.amount} {trade.symbol}
                                </span>
                                <span className="text-xs text-slate-400 font-medium">
                                  @ ${trade.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => handleCopyTrade(trade)}
                            disabled={copyTradeStatus.id === trade.id && copyTradeStatus.status === 'loading'}
                            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                              copyTradeStatus.id === trade.id && copyTradeStatus.status === 'success'
                                ? 'bg-emerald-500 text-slate-950'
                                : copyTradeStatus.id === trade.id && copyTradeStatus.status === 'error'
                                ? 'bg-rose-500 text-white'
                                : 'bg-indigo-600 hover:bg-indigo-500 text-white active:scale-95'
                            }`}
                          >
                            {copyTradeStatus.id === trade.id ? (
                              copyTradeStatus.status === 'loading' ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : copyTradeStatus.status === 'success' ? (
                                <Check className="w-3.5 h-3.5" />
                              ) : (
                                'Gagal'
                              )
                            ) : (
                              'Copy Trade'
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Column: Mini Lobby Stats and live status Logs */}
              <div className="space-y-8 h-full">
                {/* Visual Rank Progression */}
                <div className="bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-slate-800 rounded-[32px] p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xs font-mono uppercase text-indigo-400 font-bold tracking-widest">Arena Profile</h4>
                      <h3 className="text-xl font-black text-white mt-1">Trading Gladiator</h3>
                    </div>
                    <Trophy className="w-8 h-8 text-amber-400" />
                  </div>

                  <div className="space-y-2 pt-2">
                    <div className="flex justify-between text-xs font-bold text-slate-400">
                      <span>Rank Points</span>
                      <span className="text-indigo-400 font-mono">1,250 XP to Platinum</span>
                    </div>
                    <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                      <div className="bg-gradient-to-r from-cyan-400 to-indigo-600 h-full rounded-full" style={{ width: '65%' }} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-slate-800 pt-4">
                    <div>
                      <p className="text-[10px] font-medium text-slate-500 uppercase">Duels Placed</p>
                      <p className="text-lg font-black text-white">24</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-medium text-slate-500 uppercase">Win Ratio</p>
                      <p className="text-lg font-black text-emerald-400">70.8%</p>
                    </div>
                  </div>
                </div>

                {/* Real-time terminal action feed */}
                <div className="bg-slate-900 border border-slate-800 rounded-[32px] p-6 space-y-4 flex flex-col h-[320px]">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
                      <h3 className="font-bold text-sm text-white">Live System Log</h3>
                    </div>
                    <span className="text-[9px] font-mono text-cyan-400 uppercase font-black">WS Stream</span>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-3 font-mono text-[11px] text-zinc-400 flex flex-col">
                    {traderLogs.map((log, index) => (
                      <div key={index} className="border-l border-zinc-800 pl-2 py-0.5 animate-fadeIn">
                        <span className="text-slate-600 font-bold">[{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}]</span>{' '}
                        {log}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="duel"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8"
            >
              {duelState === 'idle' && (
                <div className="max-w-2xl mx-auto bg-slate-900/60 border border-slate-800 p-8 rounded-[32px] text-center space-y-8 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 blur-3xl rounded-full" />
                  
                  <div className="space-y-3">
                    <div className="mx-auto w-16 h-16 bg-gradient-to-br from-cyan-400 to-indigo-600 rounded-3xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                      <Swords className="w-8 h-8 text-slate-950" />
                    </div>
                    <h2 className="text-2xl font-black tracking-tight text-white">Real-Time Speed Duel</h2>
                    <p className="text-sm text-slate-400 max-w-md mx-auto">
                      Balapan PNL trading berdurasi 60 detik melawan AI cerdas. Buktikan refleks dan analisis pasarmu dalam kondisi harga bergerak real-time!
                    </p>
                  </div>

                  {/* Competitor list */}
                  <div className="space-y-4">
                    <p className="text-xs uppercase font-mono tracking-widest text-indigo-400 font-bold">Pilih Musuh AI Kamu</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {copilots.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => setDuelOpponentId(c.id)}
                          className={`p-4 rounded-2xl border text-center transition-all flex flex-col items-center gap-2 ${
                            duelOpponentId === c.id
                              ? 'bg-slate-900 border-indigo-500 bg-gradient-to-br from-indigo-950/20 to-slate-900'
                              : 'bg-slate-950 border-slate-800 opacity-60 hover:opacity-100'
                          }`}
                        >
                          <span className="text-3xl">{c.avatar}</span>
                          <span className="text-sm font-bold text-white block truncate w-full">{c.name}</span>
                          <span className="text-[10px] text-indigo-400 font-bold font-mono">Win Rate: {c.winRate}%</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Duel rules and reward visualization */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950 border border-slate-850 p-4 rounded-2xl text-left">
                    <div className="flex gap-2.5 items-start">
                      <Coins className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-slate-300">Reward Kemenangan</p>
                        <p className="text-xs text-slate-400">Bawa pulang Rp 150.000 saldo bonus jika kamu finish dengan profit lebih tinggi dari AI.</p>
                      </div>
                    </div>
                    <div className="flex gap-2.5 items-start">
                      <AlertCircle className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-slate-300">Modal Virtual</p>
                        <p className="text-xs text-slate-400">Kedua petarung mulai dengan $50.000 USDT virtual saldo khusus arena sirkuit.</p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={startDuelCountdown}
                    className="w-full bg-gradient-to-br from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-black py-4 rounded-2xl text-sm uppercase tracking-widest transition-all shadow-xl shadow-indigo-500/10 active:scale-95"
                  >
                    Mulai Trading Duel
                  </button>
                </div>
              )}

              {duelState === 'countdown' && (
                <div className="flex flex-col items-center justify-center min-h-[400px]">
                  <motion.div
                    key={countdown}
                    initial={{ scale: 0.3, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 1.8, opacity: 0 }}
                    transition={{ duration: 0.8 }}
                    className="text-8xl font-black text-indigo-400 font-mono tracking-tighter"
                  >
                    {countdown === 0 ? 'GO!' : countdown}
                  </motion.div>
                  <p className="text-slate-400 text-sm font-bold tracking-widest uppercase mt-6">Menghubungkan Ke Sirkuit Pertempuran...</p>
                </div>
              )}

              {duelState === 'active' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Duel Centerpiece: countdown meter and realtime action chart */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Live score card */}
                    <div className="bg-slate-900 border border-slate-800 rounded-[32px] p-6 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
                      {/* Left: User stats */}
                      <div className="flex-1 text-center md:text-left space-y-1">
                        <div className="flex items-center justify-center md:justify-start gap-2">
                          <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
                          <p className="text-[10px] font-mono tracking-widest text-cyan-400 font-bold uppercase">Kamu (Trader)</p>
                        </div>
                        <h3 className="text-2xl font-black font-mono text-white">${liveUserTotalVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                        <p className={`text-xs font-bold font-mono tracking-tight ${userLivePnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {userLivePnl >= 0 ? '+' : ''}{userLivePnl.toFixed(4)} USDT PNL
                        </p>
                      </div>

                      {/* Center segment: Clock and visual match state */}
                      <div className="flex flex-col items-center">
                        <div className="bg-slate-950 border-2 border-indigo-500 rounded-full h-20 w-20 flex flex-col items-center justify-center shadow-lg shadow-indigo-500/10">
                          <span className="text-xs uppercase font-mono font-black text-indigo-400">SISA</span>
                          <span className="text-2xl font-bold font-mono text-white tracking-tighter">{duelTimer}s</span>
                        </div>
                        <div className="mt-2 text-center">
                          <span className="text-[9px] font-mono tracking-widest uppercase text-slate-500">Dual PNL Gap:</span>
                          <p className="text-xs font-black text-indigo-400 font-mono mt-0.5">
                            ${Math.abs(liveUserTotalVal - liveBotTotalVal).toFixed(2)} USDT
                          </p>
                        </div>
                      </div>

                      {/* Right: AI opponent stats */}
                      <div className="flex-1 text-center md:text-right space-y-1">
                        <div className="flex items-center justify-center md:justify-end gap-2">
                          <p className="text-[10px] font-mono tracking-widest text-purple-400 font-bold uppercase">{activeOpponent.name} (AI)</p>
                          <span className="h-2 w-2 rounded-full bg-purple-400 animate-ping" />
                        </div>
                        <h3 className="text-2xl font-black font-mono text-white">${liveBotTotalVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                        <p className={`text-xs font-bold font-mono tracking-tight ${botLivePnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {botLivePnl >= 0 ? '+' : ''}{botLivePnl.toFixed(4)} USDT PNL
                        </p>
                      </div>
                    </div>

                    {/* Chart containing comparison progress lines */}
                    <div className="bg-slate-900 border border-slate-800 rounded-[32px] p-6 h-[260px] flex flex-col justify-between">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">Perbandingan Kumulatif PNL</h4>
                        <div className="flex gap-4">
                          <div className="flex items-center gap-1.5 text-xs text-cyan-400 font-bold">
                            <span className="h-2 w-2 rounded-full bg-cyan-400" /> Kamu
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-purple-400 font-bold">
                            <span className="h-2 w-2 rounded-full bg-purple-400" /> AI Bot
                          </div>
                        </div>
                      </div>

                      <div className="h-44 w-full">
                        {duelPnlHistory.length === 0 ? (
                          <div className="h-full flex items-center justify-center text-slate-500 text-xs font-bold font-mono uppercase">
                            Menunggu Ticker Pertama...
                          </div>
                        ) : (
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={duelPnlHistory}>
                              <defs>
                                <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.15}/>
                                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="botGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.15}/>
                                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <XAxis dataKey="second" hide />
                              <YAxis hide domain={['auto', 'auto']} />
                              <Area type="monotone" dataKey="userPnl" stroke="#06b6d4" strokeWidth={3} fillOpacity={1} fill="url(#userGrad)" isAnimationActive={false} />
                              <Area type="monotone" dataKey="botPnl" stroke="#a855f7" strokeWidth={3} fillOpacity={1} fill="url(#botGrad)" isAnimationActive={false} />
                            </AreaChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    </div>

                    {/* Fast buy/sell execution actions terminal */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {['BTC', 'ETH', 'SOL'].map((sym) => {
                        const price = getAssetPriceUsdt(sym);
                        const qty = userDuelPositions[sym] || 0;
                        return (
                          <div key={sym} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                            <div className="flex justify-between items-center">
                              <div>
                                <h4 className="font-bold text-sm text-white">{sym} / USDT</h4>
                                <p className="text-[11px] font-mono font-medium text-slate-500">Holding: {qty.toFixed(2)}</p>
                              </div>
                              <span className="font-mono text-xs font-black text-slate-200">
                                ${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => handleDuelAction(sym, 'buy')}
                                className="bg-emerald-500/10 hover:bg-emerald-500/20 active:scale-95 border border-emerald-500/20 text-emerald-400 font-extrabold text-xs py-2.5 rounded-xl uppercase tracking-wider transition-all"
                              >
                                BUY 0.5
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDuelAction(sym, 'sell')}
                                disabled={qty < 0.5}
                                className={`font-extrabold text-xs py-2.5 rounded-xl uppercase tracking-wider transition-all ${
                                  qty < 0.5
                                    ? 'bg-slate-950 border border-slate-900 text-slate-600 cursor-not-allowed'
                                    : 'bg-rose-500/10 hover:bg-rose-500/20 active:scale-95 border border-rose-500/20 text-rose-400'
                                }`}
                              >
                                SELL 0.5
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right Column: active order logger inside the speed match */}
                  <div className="bg-slate-900 border border-slate-800 rounded-[32px] p-6 flex flex-col h-[524px]">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <h4 className="font-bold text-sm text-white">Live Duel Log</h4>
                      <span className="bg-slate-950 border border-slate-850 px-2.5 py-1 rounded-lg text-[9px] font-mono text-cyan-400 font-bold uppercase">
                        Active Stream
                      </span>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3 font-mono text-[11px] text-zinc-400 mt-4 pr-1">
                      {duelLog.map((log, index) => (
                        <div key={index} className="border-l border-indigo-500/30 pl-2.5 py-0.5 animate-fadeIn">
                          {log}
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-slate-800/60 pt-4 mt-4 space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Saldo Cash Anda</span>
                        <span className="font-bold font-mono text-white">${userDuelBalance.toLocaleString()} USDT</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Saldo Cash AI</span>
                        <span className="font-bold font-mono text-white">${botDuelBalance.toLocaleString()} USDT</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {duelState === 'finished' && duelWinnerInfo && (
                <div className="max-w-xl mx-auto bg-slate-900 border-2 border-indigo-500 p-8 rounded-[32px] text-center space-y-6 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-500/5 blur-2xl rounded-full" />
                  
                  {duelWinnerInfo.winner === 'user' ? (
                    <div className="space-y-4">
                      <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20 animate-bounce">
                        <Trophy className="w-10 h-10 text-slate-950" />
                      </div>
                      <h2 className="text-2xl font-black text-white tracking-tight">🏆 VICTORY CHAMPION!</h2>
                      <p className="text-sm text-slate-300 max-w-sm mx-auto leading-relaxed">
                        Selamat! Refleks analisismu berhasil mengalahkan {activeOpponent.name}. Portfolio akhirmu sangat superior!
                      </p>
                      
                      <div className="bg-slate-950 border border-slate-850 p-4 rounded-2xl max-w-sm mx-auto">
                        <p className="text-xs font-mono uppercase text-indigo-400 font-bold mb-1">XP & Reward Bonus</p>
                        <p className="text-xl font-black text-white">+500 Arena XP</p>
                        <p className="text-base font-bold text-emerald-400 mt-1">Rp 150.000 (Test Cash Terkirim)</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="w-20 h-20 bg-gradient-to-br from-slate-600 to-slate-800 rounded-full flex items-center justify-center mx-auto shadow-lg">
                        <AlertTriangle className="w-10 h-10 text-slate-400" />
                      </div>
                      <h2 className="text-2xl font-black text-white tracking-tight">Kekalahan Terhormat</h2>
                      <p className="text-sm text-slate-300 max-w-sm mx-auto leading-relaxed">
                        {activeOpponent.name} berhasil memenangkan duel performa kali ini dengan selisih yang tipis. Jangan menyerah, asah terus analisismu!
                      </p>

                      <div className="bg-slate-950 border border-slate-850 p-4 rounded-2xl max-w-sm mx-auto">
                        <p className="text-xs font-mono uppercase text-indigo-400 font-bold mb-1">Partisipasi Bonus</p>
                        <p className="text-md font-black text-white">+50 Arena XP</p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 border-t border-b border-slate-800 py-4 font-mono text-xs">
                    <div>
                      <p className="text-slate-500">Portfolio Anda</p>
                      <p className="text-base font-black text-white">${duelWinnerInfo.userTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Portfolio AI Bot</p>
                      <p className="text-base font-black text-white">${duelWinnerInfo.botTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => setDuelState('idle')}
                      className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-heavy py-3.5 rounded-xl text-xs uppercase tracking-widest font-black transition-all"
                    >
                      Kembali ke Lobi
                    </button>
                    <button
                      onClick={startDuelCountdown}
                      className="flex-1 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-black py-3.5 rounded-xl text-xs uppercase tracking-widest transition-all"
                    >
                      Rematch!
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
