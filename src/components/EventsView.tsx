import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Gift, Trophy, Zap, Sparkles, Timer, ChevronRight, Coins, Users, 
  Flame, ArrowUpRight, Lock, CheckCircle, Calendar, DollarSign, 
  Plus, Award, Compass, Bell, Shield, TrendingUp, RefreshCw, BarChart2,
  Copy, ExternalLink, HelpCircle, Check, Percent, ArrowRight, ZapOff
} from 'lucide-react';
import { useTrading } from '../context/TradingContext';

// We can play some nice sounds if the global window supports it
function playSynthSoundExchange(type: 'click' | 'claim' | 'success' | 'join') {
  try {
    const isMuted = localStorage.getItem('aether_muted') === 'true';
    if (isMuted) return;
    
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    const now = audioCtx.currentTime;
    
    switch (type) {
      case 'click': {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(500, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.08);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.08);
        break;
      }
      case 'claim': {
        const notes = [261.63, 329.63, 392.00, 523.25]; // C E G C ascending
        notes.forEach((freq, idx) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.07);
          gain.gain.setValueAtTime(0.05, now + idx * 0.07);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.25);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(now + idx * 0.07);
          osc.stop(now + idx * 0.07 + 0.25);
        });
        break;
      }
      case 'success': {
        const osc1 = audioCtx.createOscillator();
        const osc2 = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc1.type = 'triangle';
        osc2.type = 'sine';
        osc1.frequency.setValueAtTime(392, now);
        osc2.frequency.setValueAtTime(587.33, now);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(audioCtx.destination);
        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.35);
        osc2.stop(now + 0.35);
        break;
      }
      case 'join': {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(330, now);
        osc.frequency.exponentialRampToValueAtTime(660, now + 0.2);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.2);
        break;
      }
    }
  } catch (e) {
    // console block sandbox restriction
  }
}

function getEventBg(id: string): string {
  switch (id) {
    case 'coin_trading_comp':
      return '/src/assets/images/btc_tournament_bg_1779443990853.png';
    case 'futures_volume_battle':
      return '/src/assets/images/futures_battle_bg_1779444009008.png';
    case 'new_user_bonus':
      return '/src/assets/images/new_user_bonus_bg_1779444027703.png';
    case 'ai_signal_challenge':
      return '/src/assets/images/ai_signal_intel_bg_1779444044693.png';
    case 'launchpad_token_sale':
      return '/src/assets/images/launchpad_oculus_bg_1779444061664.png';
    default:
      return '';
  }
}

function getQuestBg(type: string): string {
  switch (type) {
    case 'daily':
      return '/src/assets/images/new_user_bonus_bg_1779444027703.png';
    case 'referral':
      return '/src/assets/images/launchpad_oculus_bg_1779444061664.png';
    case 'cashback':
      return '/src/assets/images/futures_battle_bg_1779444009008.png';
    case 'staking':
      return '/src/assets/images/ai_signal_intel_bg_1779444044693.png';
    case 'vip':
      return '/src/assets/images/btc_tournament_bg_1779443990853.png';
    default:
      return '';
  }
}

// Interfaces & Types
interface EventCampaign {
  id: string;
  name: string;
  type: string;
  prizePool: string;
  participants: number;
  timeRemaining: string;
  tag: string;
  description: string;
  requirements: string;
  hot?: boolean;
}

interface LeaderboardUser {
  rank: number;
  name: string;
  roi: number;
  volumeUsdt: number;
  profitUsdt: number;
  isMe?: boolean;
}

interface LaunchpadProject {
  id: string;
  name: string;
  ticker: string;
  price: string;
  totalRaised: number;
  hardCap: number;
  participants: number;
  status: 'active' | 'upcoming' | 'finished';
  logoGradient: string;
  description: string;
}

interface RewardQuest {
  id: string;
  title: string;
  desc: string;
  rewardValue: string;
  type: 'daily' | 'referral' | 'cashback' | 'vip' | 'staking';
  status: 'claimable' | 'claimed' | 'locked';
}

export function EventsView({ prices, loading }: { prices: any; loading: boolean }) {
  const { balance, positions } = useTrading();

  // --- REGISTRATION / JOIN EVENT STATES ---
  const [joinedEvents, setJoinedEvents] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('ax_joined_events');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const handleJoinEvent = (eventId: string) => {
    if (joinedEvents.includes(eventId)) return;
    playSynthSoundExchange('join');
    const updated = [...joinedEvents, eventId];
    setJoinedEvents(updated);
    localStorage.setItem('ax_joined_events', JSON.stringify(updated));
  };

  // --- DAILY CHECK-IN STATES ---
  const [checkInStreak, setCheckInStreak] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('ax_checkin_streak');
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

  const [lastCheckInDate, setLastCheckInDate] = useState<string | null>(() => {
    return localStorage.getItem('ax_last_checkin_date');
  });

  const [hasCheckedInToday, setHasCheckedInToday] = useState<boolean>(() => {
    const todayStr = new Date().toDateString();
    const lastCheck = localStorage.getItem('ax_last_checkin_date');
    return lastCheck === todayStr;
  });

  const handleDailyCheckIn = () => {
    if (hasCheckedInToday) return;
    playSynthSoundExchange('claim');
    
    const todayStr = new Date().toDateString();
    let nextStreak = checkInStreak + 1;
    if (nextStreak > 7) nextStreak = 1;

    setCheckInStreak(nextStreak);
    setLastCheckInDate(todayStr);
    setHasCheckedInToday(true);

    localStorage.setItem('ax_checkin_streak', nextStreak.toString());
    localStorage.setItem('ax_last_checkin_date', todayStr);
  };

  // --- REFERRAL LINK STATES ---
  const [referralsCount, setReferralsCount] = useState<number>(4);
  const [copiedReferrals, setCopiedReferrals] = useState(false);
  const referralCode = "AETHEX_98319";

  const handleCopyReferral = () => {
    playSynthSoundExchange('click');
    navigator.clipboard.writeText(`https://aetherex.io/register?ref=${referralCode}`);
    setCopiedReferrals(true);
    setTimeout(() => setCopiedReferrals(false), 2000);
  };

  // --- LAUNCHPAD COMMITTING STATES ---
  const [committedAmount, setCommittedAmount] = useState<string>('');
  const [launchpadGoal, setLaunchpadGoal] = useState<number>(1853400); // starts around 92.67%
  const [launchpadParticipants, setLaunchpadParticipants] = useState<number>(14205);
  const [launchpadError, setLaunchpadError] = useState<string | null>(null);
  const [launchpadSuccess, setLaunchpadSuccess] = useState<boolean>(false);

  const handleCommitUsdt = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(committedAmount);
    if (isNaN(amount) || amount <= 0) {
      setLaunchpadError("Please specify a valid USDT amount.");
      return;
    }
    if (amount > 100000) {
      setLaunchpadError("Maximum limit per user exceeded ($100,000 USDT).");
      return;
    }

    playSynthSoundExchange('success');
    setLaunchpadGoal(prev => Math.min(2000000, prev + amount));
    setLaunchpadParticipants(prev => prev + 1);
    setLaunchpadSuccess(true);
    setLaunchpadError(null);
    setCommittedAmount('');
    setTimeout(() => setLaunchpadSuccess(false), 4500);
  };

  // --- ACTIVE LEADERBOARD TAB ---
  const [leaderboardTab, setLeaderboardTab] = useState<'roi' | 'volume' | 'weekly'>('roi');

  // --- REWARDS LIST FOR INTERACTIVE PROGRESS TRACKING ---
  const [claimedRewards, setClaimedRewards] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('ax_claimed_rewards');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const handleClaimReward = (rewardId: string) => {
    if (claimedRewards.includes(rewardId)) return;
    playSynthSoundExchange('claim');
    const updated = [...claimedRewards, rewardId];
    setClaimedRewards(updated);
    localStorage.setItem('ax_claimed_rewards', JSON.stringify(updated));
  };

  // --- CONSTANT DATA ---
  const featuredEvents: EventCampaign[] = [
    {
      id: 'coin_trading_comp',
      name: 'BTC Supercycle Trading Tournament',
      type: 'Trading Competition',
      prizePool: '$250,000 USDT',
      participants: 5849,
      timeRemaining: '3d 14h 20m',
      tag: '🔥 HOT',
      description: 'Trade BTC spot & futures pairs. Top 50 traders with highest ROI/Volume split the mega prize pool.',
      requirements: 'Minimum trading volume $5,000 USDT.'
    },
    {
      id: 'futures_volume_battle',
      name: 'Futures Volume Mega-Showdown',
      type: 'Volume Battle',
      prizePool: '$150,000 USDT',
      participants: 2931,
      timeRemaining: '5d 20h 44m',
      tag: '⭐ VOL MAX',
      description: 'Engage leverage trading across major indexes. Direct volume multiplier rewards applied daily.',
      requirements: 'Open to standard registered retail tier/VIP 1+.'
    },
    {
      id: 'new_user_bonus',
      name: 'Launch Spark: New User Deposit Bonus',
      type: 'Deposit Campaign',
      prizePool: '100% Cashback & Up to $500',
      participants: 12402,
      timeRemaining: '12d 08h 15m',
      tag: '⚡ NEWBIE',
      description: 'Deposit a minimum of $100 equivalent in IDR/USDT to receive immediate cashback vouchers and a free random mystery box.',
      requirements: 'First deposit must be processed within 7 days of onboarding.'
    },
    {
      id: 'ai_signal_challenge',
      name: 'AI Signal Analytics Sprint',
      type: 'Staking & Intel Challenge',
      prizePool: '$80,000 USDT',
      participants: 1845,
      timeRemaining: '1d 06h 10m',
      tag: '🤖 TECH INC',
      description: 'Backtest automated quantitative signals. Win rewards by accurate prediction threshold matches.',
      requirements: 'Stake 200 AETHEX core tokens to request signal data stream.'
    },
    {
      id: 'launchpad_token_sale',
      name: 'Oculus Network (OCU) Launchpad Commits',
      type: 'Token Launchpad',
      prizePool: 'Core Seed Allocation',
      participants: 14205,
      timeRemaining: '2d 11h 05m',
      tag: '🚀 LAUNCHPAD',
      description: 'Pioneering decentralized AI networks. Lock your USDT allocation ahead of the exchange listing.',
      requirements: 'Must have fully completed Tier 1 KYC security checks.'
    }
  ];

  const leadersRoi: LeaderboardUser[] = [
    { rank: 1, name: 'Satoshi_Whale_01', roi: 485.22, volumeUsdt: 12450000, profitUsdt: 684500 },
    { rank: 2, name: 'QuantumViper_Algo', roi: 294.10, volumeUsdt: 8650000, profitUsdt: 320400 },
    { rank: 3, name: 'BaliCryptoKing', roi: 218.44, volumeUsdt: 4320000, profitUsdt: 189200 },
    { rank: 4, name: 'GigaChadScalper', roi: 195.30, volumeUsdt: 15400000, profitUsdt: 440200 },
    { rank: 5, name: 'You (Aetherex Trader)', roi: 144.15, volumeUsdt: 2450000, profitUsdt: 38400, isMe: true }
  ];

  const leadersVolume: LeaderboardUser[] = [
    { rank: 1, name: 'GigaChadScalper', roi: 195.30, volumeUsdt: 34100000, profitUsdt: 440200 },
    { rank: 2, name: 'Apex_Arbitrage', roi: 45.12, volumeUsdt: 28450000, profitUsdt: 112000 },
    { rank: 3, name: 'Satoshi_Whale_01', roi: 485.22, volumeUsdt: 24500000, profitUsdt: 684500 },
    { rank: 4, name: 'Singapore_OTC_Vault', roi: 12.80, volumeUsdt: 19680000, profitUsdt: 48300 },
    { rank: 5, name: 'You (Aetherex Trader)', roi: 144.15, volumeUsdt: 2450000, profitUsdt: 38400, isMe: true }
  ];

  const leadersWeekly: LeaderboardUser[] = [
    { rank: 1, name: 'Satoshi_Whale_01', roi: 122.45, volumeUsdt: 4500000, profitUsdt: 185000 },
    { rank: 2, name: 'BaliCryptoKing', roi: 94.12, volumeUsdt: 2100000, profitUsdt: 74200 },
    { rank: 3, name: 'Dynamic_Rider_IDX', roi: 88.35, volumeUsdt: 1850000, profitUsdt: 41900 },
    { rank: 4, name: 'You (Aetherex Trader)', roi: 144.15, volumeUsdt: 2450000, profitUsdt: 38400, isMe: true },
    { rank: 5, name: 'WagmiMaster_2026', roi: 62.40, volumeUsdt: 1240000, profitUsdt: 29000 }
  ];

  const activeLeaderboardList = leaderboardTab === 'roi' 
    ? leadersRoi 
    : leaderboardTab === 'volume' 
    ? leadersVolume 
    : leadersWeekly;

  const rewardQuests: RewardQuest[] = [
    { 
      id: 'daily_check_quest', 
      title: 'Persistent Check-in Bonus', 
      desc: 'Maintain daily connections to accumulate cashback cards.', 
      rewardValue: 'UP TO $5 USDT CASHBACK', 
      type: 'daily',
      status: 'claimable'
    },
    { 
      id: 'referral_quest_1', 
      title: 'Partner Network Growth', 
      desc: 'Invite dynamic members onto Aetherex to claim cashback voucher matches.', 
      rewardValue: '15% COMMISSION + $10 USDT', 
      type: 'referral',
      status: 'claimable' 
    },
    { 
      id: 'cashback_quest_1', 
      title: 'First Spot Trading Milestone', 
      desc: 'Accomplish or match first $500 volumes across major tokens.', 
      rewardValue: 'ZERO FEES VOUCHER DECK', 
      type: 'cashback',
      status: 'claimable' 
    },
    { 
      id: 'vip_benefits_quest', 
      title: 'Unlock Tier-1 VIP Stature', 
      desc: 'Accumulate exchange deposits to immediately claim optimized premium discount metrics.', 
      rewardValue: '0.015% MAKER/TAKER SAVING', 
      type: 'vip',
      status: 'locked' 
    },
    { 
      id: 'staking_quest_1', 
      title: 'Solana Yield Injection Pool', 
      desc: 'Lock outstanding SOL into passive staking mechanisms to capture boost APR.', 
      rewardValue: '🔥 12.4% EXTRA BOOST APY', 
      type: 'staking',
      status: 'claimable' 
    }
  ];

  const launchpadProj: LaunchpadProject = {
    id: 'ocu_network',
    name: 'Oculus Network Intelligence',
    ticker: 'OCU',
    price: '$0.05 USDT',
    totalRaised: launchpadGoal,
    hardCap: 2000000,
    participants: launchpadParticipants,
    status: 'active',
    logoGradient: 'from-cyan-400 via-blue-500 to-indigo-600',
    description: 'Decentralized computer intelligence layers built directly for hyper-frequency Web3 node computation pipelines. Backed by elite venture networks.'
  };

  const launchpadPercentage = (launchpadProj.totalRaised / launchpadProj.hardCap) * 100;

  return (
    <div id="events_rewards_container" className="p-4 sm:p-6 lg:p-8 space-y-8 bg-transparent font-sans text-slate-100 min-h-screen">
      
      {/* 1. HERO BANNER WITH DELIGHTFUL MULTI-GLOW GRADIENT */}
      <div className="relative rounded-[32px] overflow-hidden bg-slate-950 border border-slate-800/80 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        {/* Soft background ambient gradient meshes mirroring Binance premium design styles */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute -top-12 -left-12 w-[400px] h-[300px] bg-cyan-500/10 blur-[110px]" />
          <div className="absolute -bottom-16 -right-16 w-[450px] h-[350px] bg-indigo-600/10 blur-[130px]" />
          {/* Custom generated background banner image */}
          <img 
            src="/src/assets/images/events_hero_bg_1779443967844.png" 
            alt="Hero BG" 
            className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-screen"
            referrerPolicy="no-referrer"
          />
          {/* Subtle tech background net pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.003)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.003)_1px,transparent_1px)] bg-[size:30px_30px]" />
        </div>

        <div className="relative z-10 px-6 py-10 sm:py-14 sm:px-10 lg:px-14 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-cyan-500/15 to-indigo-500/15 border border-cyan-400/25 rounded-full">
              <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span className="text-[10.5px] font-mono font-extrabold text-cyan-400 uppercase tracking-widest">
                AETHEREX CAMPAIGN CENTER
              </span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent tracking-tight leading-none text-glow">
              Events & Rewards
            </h1>
            
            <p className="text-slate-400 font-medium text-sm sm:text-base leading-relaxed">
              Join elite trading campaigns, earn performance rewards, compete on live ROI leaderboards, and lock allocations in premium early-stage token launchpads.
            </p>

            <div className="flex flex-wrap items-center gap-3.5 pt-3">
              <a 
                href="#featured_events_section" 
                onClick={() => playSynthSoundExchange('click')}
                className="px-6 py-3 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 text-slate-950 font-black text-xs uppercase tracking-widest rounded-2xl transition-all duration-200 hover:scale-[1.02] active:scale-95 shadow-lg shadow-cyan-500/20 text-center cursor-pointer border-t border-white/25 flex items-center gap-2"
              >
                <Trophy className="w-3.5 h-3.5" />
                Join Event Now
              </a>
              <a 
                href="#interactive_rewards_section" 
                onClick={() => playSynthSoundExchange('click')}
                className="px-6 py-3 bg-slate-900 hover:bg-slate-850 text-slate-200 hover:text-white font-extrabold text-xs uppercase tracking-widest rounded-2xl border border-slate-800 transition-all text-center cursor-pointer flex items-center gap-2"
              >
                <Gift className="w-3.5 h-3.5 text-indigo-400" />
                View Reward Hub
              </a>
            </div>
          </div>

          {/* Interactive live metrics status card */}
          <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-3xl p-5 lg:w-80 shrink-0 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest">
                  LIVE TELEMETRY
                </span>
              </div>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/5 px-2 py-0.5 rounded border border-cyan-500/10">GMT+7</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">POOL DISTRIBUTED</p>
                <p className="text-base font-black text-white font-mono mt-0.5">$2,450,850</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">ACTIVE TRADERS</p>
                <p className="text-base font-black text-white font-mono mt-0.5">124,532</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">LAUNCHPADS DONE</p>
                <p className="text-base font-black text-white font-mono mt-0.5">14 Projects</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">TX FEE REBATES</p>
                <p className="text-base font-black text-emerald-400 font-mono mt-0.5">100% Free</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. LAUNCHPAD SECTION (BYBIT / BINANCE LAUNCHPAD INJECTION) */}
      <div id="launchpad_spotlight" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-12">
          <div className="flex items-center gap-2 mb-4">
            <Compass className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-bold tracking-tight text-white uppercase font-mono">Spotlight Token Launchpad</h2>
          </div>
        </div>

        {/* Featured Launchpad Project */}
        <div className="lg:col-span-8 bg-slate-950/40 backdrop-blur-xl border border-slate-800/80 rounded-[32px] p-6 lg:p-8 flex flex-col md:flex-row gap-6 justify-between items-stretch relative overflow-hidden group">
          <img 
            src="/src/assets/images/launchpad_oculus_bg_1779444061664.png" 
            alt="Launchpad BG" 
            className="absolute right-0 bottom-0 top-0 w-96 h-full object-cover opacity-15 mix-blend-screen pointer-events-none group-hover:scale-105 group-hover:opacity-25 transition-all duration-500 rounded-r-[32px]"
            referrerPolicy="no-referrer"
          />
          
          <div className="flex-1 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${launchpadProj.logoGradient} flex items-center justify-center font-black text-slate-950 text-xl tracking-tighter shadow-md`}>
                  {launchpadProj.ticker}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-white text-lg tracking-tight">{launchpadProj.name}</h3>
                    <span className="text-[9px] bg-cyan-500/10 border border-cyan-400/20 text-cyan-400 font-mono font-black py-0.5 px-2 rounded-full uppercase">SUSBSCRIPTION</span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono mt-1">Price: <span className="text-cyan-400 font-bold">{launchpadProj.price}</span> | Hard Cap: $2.0M USDT</p>
                </div>
              </div>

              <p className="text-slate-400 text-xs sm:text-sm font-medium leading-relaxed">
                {launchpadProj.description}
              </p>
            </div>

            {/* Launchpad Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-slate-400">Raised Progress</span>
                <span className="text-cyan-400 font-bold">{launchpadPercentage.toFixed(2)}% ({launchpadProj.totalRaised.toLocaleString()} / 2,000,000 USDT)</span>
              </div>
              <div className="w-full bg-slate-900 border border-slate-800 h-3 rounded-full overflow-hidden p-0.5">
                <div 
                  className="bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 h-full rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(6,182,212,0.6)]" 
                  style={{ width: `${launchpadPercentage}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[10.5px] text-slate-500 font-mono">
                <span>Participants: {launchpadProj.participants.toLocaleString()} Users</span>
                <span>Time Remaining: 02d 11h 05m</span>
              </div>
            </div>
          </div>

          <div className="w-full md:w-[1px] bg-slate-800/80 self-stretch my-2" />

          {/* User Commitment Form */}
          <div className="w-full md:w-80 flex flex-col justify-between bg-slate-950/60 p-5 rounded-2xl border border-slate-800/60">
            <div className="space-y-3">
              <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-widest font-mono">Commit Allocation</h4>
              <p className="text-[11px] text-slate-500 leading-normal">
                Commit USDT from your simulation wallet balance to receive seed node allocations. Locked till listing.
              </p>

              {launchpadError && (
                <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-450 text-[11px] font-bold">
                  {launchpadError}
                </div>
              )}

              {launchpadSuccess && (
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-[11px] font-semibold">
                  ✓ Successfully committed! Allocation registered.
                </div>
              )}
            </div>

            <form onSubmit={handleCommitUsdt} className="mt-4 space-y-3">
              <div className="relative">
                <input 
                  type="number" 
                  value={committedAmount}
                  onChange={(e) => setCommittedAmount(e.target.value)}
                  placeholder="USDT Allocation"
                  className="w-full px-3.5 py-2.5 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 focus:border-cyan-500 text-xs text-white rounded-xl outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setCommittedAmount('1000')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[9px] font-mono bg-cyan-500/15 text-cyan-400 hover:bg-cyan-500/25 px-2 py-1 rounded font-black border border-cyan-500/20"
                >
                  $1K MAX
                </button>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-black uppercase tracking-widest rounded-xl transition-all duration-200 active:scale-98 cursor-pointer shadow-md shadow-cyan-500/10 border-t border-white/20"
              >
                Commit USDT Now
              </button>
            </form>
          </div>
        </div>

        {/* 2b. Mini Daily Check-in Widget inside spotlight */}
        <div className="lg:col-span-4 bg-slate-950/40 backdrop-blur-xl border border-slate-800/80 rounded-[32px] p-6 flex flex-col justify-between relative overflow-hidden group">
          <img 
            src="/src/assets/images/new_user_bonus_bg_1779444027703.png" 
            alt="Checkin BG" 
            className="absolute -right-12 -top-12 w-48 h-48 object-cover opacity-10 mix-blend-screen pointer-events-none group-hover:scale-110 group-hover:opacity-20 transition-all duration-500 rounded-full"
            referrerPolicy="no-referrer"
          />
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-400 animate-pulse" />
                <h3 className="font-extrabold text-white text-base tracking-tight">Daily Check-In</h3>
              </div>
              <span className="text-[10px] font-mono font-black text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded uppercase">
                STREAK: {checkInStreak}/7
              </span>
            </div>

            <p className="text-slate-400 text-xs leading-normal">
              Claim daily booster cashback credits. Complete a 7-day streak to claim a premium Trading Fee Waiver.
            </p>

            {/* 7 Days streak display bubbles */}
            <div className="grid grid-cols-7 gap-1.5 pt-1">
              {[1, 2, 3, 4, 5, 6, 7].map((dayNum) => {
                const isClaimed = dayNum <= checkInStreak;
                const isCurrent = dayNum === checkInStreak + 1 && !hasCheckedInToday;
                return (
                  <div 
                    key={dayNum}
                    className={`h-11 rounded-lg flex flex-col items-center justify-center border font-mono transition-all ${
                      isClaimed 
                        ? 'bg-gradient-to-br from-indigo-500/10 to-blue-500/10 border-indigo-500/50 text-indigo-300 shadow-[0_0_8px_rgba(99,102,241,0.15)]'
                        : isCurrent
                        ? 'bg-slate-900 border-cyan-500 text-cyan-400 animate-pulse'
                        : 'bg-slate-950/60 border-slate-900 text-slate-600'
                    }`}
                  >
                    <span className="text-[9px] font-black leading-none">D{dayNum}</span>
                    <span className="text-[10.5px] font-black mt-1 leading-none">
                      {isClaimed ? (
                        <Check className="w-3.5 h-3.5 text-indigo-400 mx-auto" />
                      ) : (
                        `+$${dayNum}`
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            disabled={hasCheckedInToday}
            onClick={handleDailyCheckIn}
            className={`w-full py-3 mt-6 text-xs uppercase tracking-widest font-black rounded-xl transition-all duration-200 active:scale-98 flex items-center justify-center gap-2 cursor-pointer ${
              hasCheckedInToday 
                ? 'bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/15 border-t border-white/10'
            }`}
          >
            {hasCheckedInToday ? (
              <>
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                Checked In Today
              </>
            ) : (
              <>
                <Calendar className="w-3.5 h-3.5" />
                Claim Day {checkInStreak + 1} Reward
              </>
            )}
          </button>
        </div>
      </div>

      {/* 3. FEATURED EVENTS & TOURNAMENTS SECTION */}
      <div id="featured_events_section" className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-850">
          <div>
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-cyan-400 animate-bounce" />
              <h2 className="text-xl font-bold tracking-tight text-white uppercase font-mono">Featured Trading Campaigns</h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Select and register inside active tournaments to scale profits directly against global leaders.</p>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-[10.5px] font-mono text-zinc-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            REALTIME DEPLOYMENT
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredEvents.map((evt) => {
            const isJoined = joinedEvents.includes(evt.id);
            return (
              <div 
                key={evt.id}
                className={`bg-slate-950/40 backdrop-blur-xl border rounded-[32px] p-6 flex flex-col justify-between space-y-4 transition-all duration-300 relative overflow-hidden group ${
                  isJoined 
                    ? 'border-emerald-500/50 shadow-[0_4px_30px_rgba(16,185,129,0.06)]' 
                    : 'border-slate-800/80 hover:border-slate-700/80 hover:shadow-[0_4px_25px_rgba(0,0,0,0.4)]'
                }`}
              >
                {/* Tech glowing bar at top of block */}
                <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${
                  isJoined ? 'from-emerald-500 to-teal-400' : 'from-cyan-500 via-blue-500 to-indigo-600'
                }`} />

                {getEventBg(evt.id) && (
                  <img 
                    src={getEventBg(evt.id)} 
                    alt={evt.name} 
                    className="absolute right-0 bottom-0 w-44 h-44 object-cover opacity-[0.07] mix-blend-screen pointer-events-none group-hover:scale-105 group-hover:opacity-[0.22] transition-all duration-500 rounded-br-[32px]"
                    referrerPolicy="no-referrer"
                  />
                )}

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded-md font-mono uppercase font-black tracking-wide">
                      {evt.type}
                    </span>
                    <span className={`text-[10.5px] font-bold font-mono tracking-wide px-2 py-0.5 rounded-full ${
                      isJoined 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {evt.tag}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-white text-base tracking-tight leading-snug group-hover:text-cyan-400 transition-colors">
                    {evt.name}
                  </h3>

                  <p className="text-slate-400 text-xs font-medium leading-relaxed">
                    {evt.description}
                  </p>

                  <div className="pt-3 border-t border-slate-900/60 space-y-2 text-xs font-mono">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Prize Pool:</span>
                      <span className="text-emerald-400 font-extrabold">{evt.prizePool}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Participants:</span>
                      <span className="text-slate-350 font-bold">{evt.participants.toLocaleString()} Traders</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Requirements:</span>
                      <span className="text-slate-400 text-[10.5px] max-w-[180px] text-right truncate" title={evt.requirements}>
                        {evt.requirements}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-3 border-t border-slate-900">
                  <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-400">
                    <Timer className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{evt.timeRemaining}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleJoinEvent(evt.id)}
                    className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-200 active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer ${
                      isJoined 
                        ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                        : 'bg-slate-900 hover:bg-slate-850 hover:border-cyan-500/40 border border-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    {isJoined ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        Registered ✓
                      </>
                    ) : (
                      'Register Now'
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. LEADERBOARD & REWARDS REPARTITION TABBED MODULES */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* 4a. Trading Competition Leaderboards - 7 Columns */}
        <div className="lg:col-span-7 bg-slate-950/40 backdrop-blur-xl border border-slate-800/80 rounded-[32px] p-6 lg:p-8 flex flex-col justify-between relative overflow-hidden">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-850 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-cyan-400 animate-pulse" />
                  <h3 className="font-extrabold text-white text-base tracking-tight">Trading Live Leaderboard</h3>
                </div>
                <p className="text-slate-500 text-xs font-medium mt-0.5">Real-time status updates from active tournament registers.</p>
              </div>

              {/* Toggle filters */}
              <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 self-start">
                {[
                  { id: 'roi', label: 'ROI %' },
                  { id: 'volume', label: 'VOLUME' },
                  { id: 'weekly', label: 'WEEKLY' }
                ].map((tb) => (
                  <button
                    key={tb.id}
                    onClick={() => { playSynthSoundExchange('click'); setLeaderboardTab(tb.id as any); }}
                    className={`px-3 py-1.5 text-[10.5px] font-extrabold uppercase rounded-lg transition-all cursor-pointer ${
                      leaderboardTab === tb.id 
                        ? 'bg-slate-950 border border-slate-800 text-cyan-400 font-black shadow-sm' 
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {tb.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Leaderboard Row Loop */}
            <div className="space-y-2.5 pt-2">
              {activeLeaderboardList.map((row, idx) => {
                const isGold = row.rank === 1;
                const isSilver = row.rank === 2;
                const isBronze = row.rank === 3;
                return (
                  <div 
                    key={row.name}
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition-all duration-200 ${
                      row.isMe 
                        ? 'bg-cyan-500/10 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.06)]' 
                        : 'bg-slate-950/60 border-slate-900/60 hover:border-slate-800/80 hover:bg-slate-900/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Styled rank badge */}
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono font-black text-xs border ${
                        isGold 
                          ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                          : isSilver
                          ? 'bg-slate-300/20 text-slate-300 border-slate-400/30'
                          : isBronze
                          ? 'bg-amber-600/20 text-amber-500 border-amber-600/30'
                          : 'bg-slate-900 border-slate-800/50 text-slate-500'
                      }`}>
                        #{row.rank}
                      </div>

                      <div>
                        <span className={`text-sm font-extrabold flex items-center gap-2 ${
                          row.isMe ? 'text-cyan-400' : 'text-slate-100 font-bold'
                        }`}>
                          {row.name}
                          {row.isMe && (
                            <span className="text-[8px] bg-cyan-400 text-slate-950 font-black px-1.5 py-0.5 rounded tracking-wide leading-none uppercase">MY POS</span>
                          )}
                        </span>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                          Vol: <span className="font-bold text-slate-450">${row.volumeUsdt.toLocaleString()} USDT</span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right font-mono">
                      <p className="text-sm font-black text-emerald-400 flex items-center gap-1 justify-end">
                        <TrendingUp className="w-3.5 h-3.5" />
                        +{row.roi.toFixed(2)}%
                      </p>
                      <p className="text-[10.5px] text-slate-500 font-bold mt-0.5">+${row.profitUsdt.toLocaleString()}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-6 border-t border-slate-900 mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="text-xs text-slate-500 font-mono leading-normal max-w-sm">
              * Rankings compute live every 1 minute. ROI evaluates cumulative spot & futures performance matrices.
            </p>
            <a 
              href="#featured_events_section"
              className="text-xs font-extrabold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 uppercase tracking-wider font-mono self-start sm:self-center transition-colors cursor-pointer"
            >
              Learn ROI Calculation Rules
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* 4b. Active Rewards Quest Center - 5 Columns */}
        <div id="interactive_rewards_section" className="lg:col-span-5 bg-slate-950/40 backdrop-blur-xl border border-slate-800/80 rounded-[32px] p-6 lg:p-8 flex flex-col justify-between relative overflow-hidden">
          <div className="space-y-4">
            <div className="border-b border-slate-850 pb-4">
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-indigo-400" />
                <h3 className="font-extrabold text-white text-base tracking-tight">Active Quest Rewards Center</h3>
              </div>
              <p className="text-slate-500 text-xs font-medium mt-0.5">Fulfill active exchange milestones to claim premium cashbacks.</p>
            </div>

            <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
              {rewardQuests.map((qst) => {
                const isClaimed = claimedRewards.includes(qst.id);
                const isLocked = qst.status === 'locked';
                return (
                  <div 
                    key={qst.id}
                    className={`p-4 rounded-2xl border transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden group ${
                      isClaimed 
                        ? 'bg-slate-950/20 border-slate-900 opacity-60' 
                        : isLocked
                        ? 'bg-slate-950/30 border-slate-900/80 opacity-50'
                        : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-750'
                    }`}
                  >
                    {getQuestBg(qst.type) && (
                      <img 
                        src={getQuestBg(qst.type)} 
                        alt={qst.title} 
                        className="absolute right-0 bottom-0 w-24 h-24 object-cover opacity-[0.05] mix-blend-screen pointer-events-none group-hover:scale-110 group-hover:opacity-[0.14] transition-all duration-300 rounded-br-2xl"
                        referrerPolicy="no-referrer"
                      />
                    )}
                    <div className="space-y-1.5 flex-1 p-0.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-[8.5px] px-2 py-0.5 font-mono font-black uppercase rounded ${
                          qst.type === 'daily' 
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                            : qst.type === 'vip'
                            ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                            : qst.type === 'staking'
                            ? 'bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20'
                            : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                        }`}>
                          {qst.type.toUpperCase()}
                        </span>
                        
                        <h4 className="font-extrabold text-white text-xs sm:text-sm tracking-tight">{qst.title}</h4>
                      </div>
                      <p className="text-slate-400 text-xs font-medium leading-relaxed">{qst.desc}</p>
                      
                      <div className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 font-extrabold">
                        <Coins className="w-3.5 h-3.5" />
                        <span>Payout: {qst.rewardValue}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isClaimed || isLocked}
                      onClick={() => handleClaimReward(qst.id)}
                      className={`px-4 py-2 text-[10.5px] font-black uppercase tracking-wider rounded-xl transition-all duration-200 cursor-pointer ${
                        isClaimed 
                          ? 'bg-slate-950 text-slate-500 cursor-not-allowed border border-slate-900' 
                          : isLocked
                          ? 'bg-slate-950 text-slate-600 border border-slate-950 flex items-center gap-1'
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/10 border-t border-white/10 active:scale-95'
                      }`}
                    >
                      {isClaimed ? (
                        'CLAIMED'
                      ) : isLocked ? (
                        <>
                          <Lock className="w-3 h-3" />
                          LOCKED
                        </>
                      ) : (
                        'CLAIM REWARD'
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 flex items-center justify-between gap-3 mt-6">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-cyan-400" />
              <div>
                <p className="text-xs font-bold text-white">Join Aetherex Referral</p>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">Invite traders & split fee commissions.</p>
              </div>
            </div>

            <button
              onClick={handleCopyReferral}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-extrabold tracking-wide uppercase transition-all flex items-center gap-1 cursor-pointer ${
                copiedReferrals 
                  ? 'bg-emerald-500 text-slate-950 font-black' 
                  : 'bg-slate-900 hover:bg-slate-850 hover:text-white border border-slate-800 text-slate-300'
              }`}
            >
              {copiedReferrals ? (
                <>
                  <Check className="w-3 h-3 text-slate-950 font-black" />
                  COPIED
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  COPY CODE
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 5. MINOR MARKET CAMPAIGNS CENTER GRID */}
      <div id="exchange_campaigns" className="space-y-4">
        <h3 className="text-sm font-extrabold tracking-widest text-slate-400 font-mono uppercase">Promotional Campaigns</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="relative overflow-hidden group bg-slate-950/20 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700/80 transition-all flex flex-col justify-between h-40">
            <img 
              src="/src/assets/images/futures_battle_bg_1779444009008.png" 
              alt="Promo Pairs BG" 
              className="absolute right-0 bottom-0 w-24 h-24 object-cover opacity-[0.04] mix-blend-screen pointer-events-none group-hover:scale-110 group-hover:opacity-[0.14] transition-all duration-300 rounded-br-2xl"
              referrerPolicy="no-referrer"
            />
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono bg-cyan-500/15 text-cyan-400 font-black border border-cyan-500/20 px-2 py-0.5 rounded uppercase">CAMP</span>
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <h4 className="font-extrabold text-white text-sm tracking-tight mt-3">Aetherex Zero Fee spot Pairs</h4>
              <p className="text-slate-500 text-xs font-medium mt-1">Enjoy maker/taker execution matched with absolute zero fee slips.</p>
            </div>
            <span className="relative z-10 text-xs font-bold text-cyan-400 font-mono flex items-center gap-1 cursor-pointer hover:text-cyan-300">
              Active Trade <ChevronRight className="w-3 h-3" />
            </span>
          </div>

          <div className="relative overflow-hidden group bg-slate-950/20 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700/80 transition-all flex flex-col justify-between h-40">
            <img 
              src="/src/assets/images/new_user_bonus_bg_1779444027703.png" 
              alt="Meme Season BG" 
              className="absolute right-0 bottom-0 w-24 h-24 object-cover opacity-[0.04] mix-blend-screen pointer-events-none group-hover:scale-110 group-hover:opacity-[0.14] transition-all duration-300 rounded-br-2xl"
              referrerPolicy="no-referrer"
            />
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono bg-indigo-500/15 text-indigo-400 font-black border border-indigo-500/20 px-2 py-0.5 rounded uppercase">AIRDROP</span>
                <span className="text-[9.5px] font-mono text-zinc-500">CLOSED</span>
              </div>
              <h4 className="font-extrabold text-white text-sm tracking-tight mt-3">Meme Coin Mega Season</h4>
              <p className="text-slate-500 text-xs font-medium mt-1">Fulfill index challenges to claim massive meme multipliers.</p>
            </div>
            <span className="relative z-10 text-xs font-bold text-slate-600 font-mono flex items-center gap-1">
              Ended Campaign <Lock className="w-3 h-3" />
            </span>
          </div>

          <div className="relative overflow-hidden group bg-slate-950/20 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700/80 transition-all flex flex-col justify-between h-40">
            <img 
              src="/src/assets/images/ai_signal_intel_bg_1779444044693.png" 
              alt="ETH Yield BG" 
              className="absolute right-0 bottom-0 w-24 h-24 object-cover opacity-[0.04] mix-blend-screen pointer-events-none group-hover:scale-110 group-hover:opacity-[0.14] transition-all duration-300 rounded-br-2xl"
              referrerPolicy="no-referrer"
            />
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono bg-fuchsia-500/15 text-fuchsia-400 font-black border border-fuchsia-500/20 px-2 py-0.5 rounded uppercase">STAKING</span>
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <h4 className="font-extrabold text-white text-sm tracking-tight mt-3">ETH Flexible Yield Hub</h4>
              <p className="text-slate-500 text-xs font-medium mt-1">Acquire outstanding flexibility APR with minimal locking vectors.</p>
            </div>
            <span className="relative z-10 text-xs font-bold text-cyan-400 font-mono flex items-center gap-1 cursor-pointer hover:text-cyan-300">
              Stake Now <ChevronRight className="w-3 h-3" />
            </span>
          </div>

          <div className="relative overflow-hidden group bg-slate-950/20 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700/80 transition-all flex flex-col justify-between h-40">
            <img 
              src="/src/assets/images/btc_tournament_bg_1779443990853.png" 
              alt="VIP BG" 
              className="absolute right-0 bottom-0 w-24 h-24 object-cover opacity-[0.04] mix-blend-screen pointer-events-none group-hover:scale-110 group-hover:opacity-[0.14] transition-all duration-300 rounded-br-2xl"
              referrerPolicy="no-referrer"
            />
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono bg-amber-500/15 text-amber-500 font-black border border-amber-500/20 px-2 py-0.5 rounded uppercase">REWARDS</span>
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <h4 className="font-extrabold text-white text-sm tracking-tight mt-3">Exclusive VIP Level-Up</h4>
              <p className="text-slate-500 text-xs font-medium mt-1">Trade more than $1,000,000 in volume to redeem VIP status.</p>
            </div>
            <span className="relative z-10 text-xs font-bold text-cyan-400 font-mono flex items-center gap-1 cursor-pointer hover:text-cyan-300">
              Upgrade Account <ChevronRight className="w-3 h-3" />
            </span>
          </div>

        </div>
      </div>

    </div>
  );
}
