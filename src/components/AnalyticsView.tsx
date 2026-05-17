import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { BarChart3, TrendingUp, Activity, PieChart, Gauge, Zap, AlertTriangle, Sparkles, Loader2 } from 'lucide-react';

interface AnalyticsViewProps {
  prices: any;
}

const AISignalCard = ({ symbol, index }: { symbol: string, index: number }) => {
  const [signal, setSignal] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSignal = async () => {
      try {
        const res = await fetch(`/api/ai-signal?symbol=${symbol}`);
        const data = await res.json();
        setSignal(data);
      } catch (e) {
        console.error('AI Signal error:', e);
      } finally {
        setLoading(false);
      }
    };

    // Staggered loading
    const timer = setTimeout(fetchSignal, index * 12000); // 12 seconds per call to stay within 5/min limit effectively
    return () => clearTimeout(timer);
  }, [symbol, index]);

  if (loading) return (
    <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-400">
      <Loader2 className="w-3 h-3 animate-spin" /> Analyzing market...
    </div>
  );

  if (!signal) return null;

  return (
    <div className="flex flex-col gap-1 mt-3 pt-3 border-t border-indigo-50/50">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 shrink-0">
          <Sparkles className="w-3 h-3 text-indigo-500" />
          <span className="text-[9px] font-black uppercase tracking-widest text-indigo-600">AI SIGNAL</span>
        </div>
        <div className={`text-[9px] font-black px-2 py-0.5 rounded-full shrink-0 ${
          signal.signal.includes('Buy') ? 'bg-green-100/80 text-green-700' : 
          signal.signal.includes('Sell') ? 'bg-red-100/80 text-red-700' : 'bg-gray-100 text-gray-600'
        }`}>
          {signal.signal} ({signal.confidence}%)
        </div>
      </div>
      <p className="text-[10px] text-gray-500 font-semibold italic mt-0.5 leading-tight">"{signal.summary}"</p>
    </div>
  );
};

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ prices }) => {
  const rawData = prices?.RAW || {};
  const symbols = Object.keys(rawData);

  // Derived Analytics Data
  const analytics = useMemo(() => {
    return symbols.map(symbol => {
      const data = rawData[symbol].IDR;
      const change = data.CHANGEPCT24HOUR || 0;
      
      // Real-ish Volatility based on 24h change magnitude
      const volatility = Math.abs(change);
      
      // Initial Logic Sentiment
      const sentiment = change > 0 ? 'Bullish' : change < -2 ? 'Bearish' : 'Neutral';
      const sentimentScore = 50 + (change * 5); // 0-100 scale

      const display = prices?.DISPLAY?.[symbol]?.IDR;
      const logoUrl = display?.IMAGEURL ? `https://www.cryptocompare.com${display.IMAGEURL}` : null;

      return {
        symbol,
        change,
        volatility,
        sentiment,
        sentimentScore: Math.max(10, Math.min(90, sentimentScore)),
        price: data.PRICE,
        logoUrl
      };
    });
  }, [prices]);

  const marketFearGreed = useMemo(() => {
    const avgChange = analytics.reduce((acc, curr) => acc + curr.change, 0) / (analytics.length || 1);
    return Math.max(5, Math.min(95, 50 + (avgChange * 8)));
  }, [analytics]);

  return (
    <div className="px-6 pb-24">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-black tracking-tight text-gray-900 uppercase">Pro Analytics</h2>
        <div className="flex items-center gap-2 px-3 py-1 bg-indigo-50 rounded-full border border-indigo-100">
           <Activity className="w-3 h-3 text-indigo-600" />
           <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Real-time Stats</span>
        </div>
      </div>

      {/* Market Sentiment Gauge */}
      <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-[32px] p-6 text-white mb-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <Gauge className="w-4 h-4 text-indigo-300" />
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-200/60">Fear & Greed Index</span>
          </div>
          
          <div className="flex items-end gap-4 mb-2">
            <div className="text-4xl font-black">{Math.round(marketFearGreed)}</div>
            <div className={`text-sm font-bold uppercase mb-1 ${marketFearGreed > 70 ? 'text-green-400' : marketFearGreed < 30 ? 'text-orange-400' : 'text-indigo-200'}`}>
              {marketFearGreed > 70 ? 'Extreme Greed' : marketFearGreed > 55 ? 'Greed' : marketFearGreed < 30 ? 'Extreme Fear' : marketFearGreed < 45 ? 'Fear' : 'Neutral'}
            </div>
          </div>

          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${marketFearGreed}%` }}
              className={`h-full ${marketFearGreed > 60 ? 'bg-green-400' : marketFearGreed < 40 ? 'bg-orange-500' : 'bg-indigo-400'}`}
            />
          </div>
          <div className="flex justify-between mt-2 text-[8px] font-black uppercase text-white/40 tracking-tighter">
            <span>Extreme Fear</span>
            <span>Neutral</span>
            <span>Extreme Greed</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {analytics.map((item, idx) => (
          <motion.div 
            key={item.symbol}
            whileHover={{ y: -2 }}
            className="bg-white border border-gray-100 p-5 rounded-3xl shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-50 rounded-2xl flex items-center justify-center font-black text-xs border border-gray-100 overflow-hidden">
                  {item.logoUrl ? (
                    <img src={item.logoUrl} alt={item.symbol} className="w-8 h-8 object-contain" referrerPolicy="no-referrer" />
                  ) : (
                    item.symbol.substring(0, 3)
                  )}
                </div>
                <div>
                  <div className="font-black text-gray-900">{item.symbol}</div>
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Technical Data</div>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-sm font-black ${item.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {item.change >= 0 ? '+' : ''}{item.change.toFixed(2)}%
                </div>
                <div className="text-[9px] font-bold text-gray-400 uppercase">24h Change</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gray-50 p-3 rounded-2xl">
                <div className="text-[8px] font-black text-gray-400 uppercase mb-1">Volatility</div>
                <div className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${item.volatility > 5 ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
                  <span className="text-[10px] font-black text-gray-800">{item.volatility > 5 ? 'High' : 'Stable'}</span>
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-2xl">
                <div className="text-[8px] font-black text-gray-400 uppercase mb-1">Sentiment</div>
                <div className="flex items-center gap-1.5">
                  <Zap className={`w-3 h-3 ${item.sentiment === 'Bullish' ? 'text-orange-500' : 'text-blue-500'}`} />
                  <span className="text-[10px] font-black text-gray-800">{item.sentiment}</span>
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-2xl border-l-2 border-indigo-500/20">
                <div className="text-[8px] font-black text-gray-400 uppercase mb-1">Conf. Score</div>
                <div className="text-[10px] font-black text-indigo-600">{item.sentimentScore.toFixed(0)}%</div>
              </div>
            </div>
            
            <AISignalCard symbol={item.symbol} index={idx} />
          </motion.div>
        ))}
      </div>

      <div className="mt-8 p-5 bg-orange-50 border border-orange-100 rounded-3xl flex gap-4 items-start">
        <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-xs font-black text-orange-900 uppercase mb-1">Market Risk Warning</h4>
          <p className="text-[10px] leading-relaxed text-orange-800 font-medium opacity-80">
            Real-time analytics is based on live market volatility data. Crypto assets are highly volatile and carry significant risk. Never invest more than you can afford to lose.
          </p>
        </div>
      </div>
    </div>
  );
};
