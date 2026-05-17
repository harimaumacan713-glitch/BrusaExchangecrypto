import React, { useState, useEffect } from 'react';
import { Bitcoin, Wallet, Coins, ShipWheel, DollarSign, Loader2, TrendingUp, Activity, TrendingDown } from 'lucide-react';
import { motion } from 'motion/react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

import { useTrading } from '../context/TradingContext';

const iconMap: Record<string, any> = {
  BTC: { icon: Bitcoin, color: 'text-orange-500', bg: 'bg-orange-100', name: 'Bitcoin' },
  ETH: { icon: Coins, color: 'text-blue-500', bg: 'bg-blue-100', name: 'Ethereum' },
  SOL: { icon: ShipWheel, color: 'text-purple-500', bg: 'bg-purple-100', name: 'Solana' },
  USDT: { icon: DollarSign, color: 'text-green-500', bg: 'bg-green-100', name: 'TRether' },
  XRP: { icon: Activity, color: 'text-blue-400', bg: 'bg-blue-50', name: 'Ripple' },
};

export function Portfolio({ prices, loading }: { prices: any; loading: boolean }) {
  const { balance, positions, totalRealizedPnl } = useTrading();
  const [assets, setAssets] = useState<any[]>([]);

  useEffect(() => {
    if (prices && prices.RAW && positions.length > 0) {
      const usdtIdrRate = 16150;

      setAssets(prevAssets => {
        const newAssets = positions.map(pos => {
          const symbol = pos.symbol;
          const raw = prices.RAW[symbol]?.IDR;
          const display = prices.DISPLAY[symbol]?.IDR;
          
          if (!raw) {
            // Check if we already have this asset in prevAssets to avoid losing it temporarily
            const existing = prevAssets.find(a => a.symbol === symbol);
            if (existing) return existing;
            return null; // Should not happen if data is consistent
          }

          const meta = iconMap[symbol] || { icon: Wallet, color: 'text-gray-500', bg: 'bg-gray-100', name: symbol };
          const logoUrl = display?.IMAGEURL ? `https://www.cryptocompare.com${display.IMAGEURL}` : null;
          
          const currentPriceUsdt = raw.PRICE_USDT || (raw.PRICE / usdtIdrRate) || pos.entryPrice;
          const currentPriceIdr = currentPriceUsdt * usdtIdrRate;

          const pnlUsdt = (currentPriceUsdt - pos.entryPrice) * pos.amount;
          const pnlIdr = pnlUsdt * usdtIdrRate;
          const pnlPercent = ((currentPriceUsdt - pos.entryPrice) / pos.entryPrice) * 100;
          const marketValueIdr = pos.amount * currentPriceIdr;

          const pnlFormatted = new Intl.NumberFormat('id-ID', { 
            style: 'currency', 
            currency: 'IDR', 
            maximumFractionDigits: 0,
            signDisplay: 'always'
          }).format(pnlIdr);

          // Find existing sparkline or generate once
          const existingAsset = prevAssets.find(a => a.symbol === symbol);
          let sparklineData = existingAsset?.sparklineData;
          if (!sparklineData) {
            const points = 15;
            const trend = (raw.CHANGEPCT24HOUR || 0) > 0 ? 1 : -1;
            sparklineData = Array.from({ length: points }).map((_, i) => ({
              value: 50 + (i * trend * Math.random() * 2) + (Math.random() * 10 - 5)
            }));
          }

          return {
            symbol,
            name: meta.name,
            amount: pos.amount,
            balance: new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(marketValueIdr),
            pnl: pnlFormatted,
            rawPnlIdr: pnlIdr,
            pnlPercent: pnlPercent.toFixed(2),
            change: raw.CHANGEPCT24HOUR ? `${raw.CHANGEPCT24HOUR.toFixed(2)}%` : '0%',
            changeRaw: raw.CHANGEPCT24HOUR || 0,
            icon: meta.icon,
            color: meta.color,
            bg: meta.bg,
            logoUrl,
            sparklineData
          };
        }).filter(Boolean);

        return newAssets;
      });
    } else if (!loading) {
      setAssets([]);
    }
  }, [prices, positions, loading]);

  const totalUnrealizedPnlIdr = assets.reduce((acc, asset) => acc + asset.rawPnlIdr, 0);
  const balanceIdr = balance;

  return (
    <div className="px-6">
        <div className="flex justify-between items-center mb-6">
            <h2 className="font-bold text-xl tracking-tight text-gray-900">Your Assets</h2>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Live Updates</div>
        </div>

        {assets.length > 0 && (
          <div className="mb-6 p-5 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-[32px] text-white shadow-xl shadow-gray-200 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <TrendingUp className="w-32 h-32 rotate-12" />
            </div>
            <div className="relative z-10 flex justify-between items-end">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">Unrealized PnL</div>
                <div className={`text-2xl font-black ${totalUnrealizedPnlIdr >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0, signDisplay: 'always' }).format(totalUnrealizedPnlIdr)}
                </div>
                <div className="text-[10px] font-bold text-gray-500">
                  ≈ ${ (totalUnrealizedPnlIdr / 16150).toFixed(2) } USDT
                </div>
              </div>
              <div className="text-right">
                <div className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">Realized Profit</div>
                <div className={`text-sm font-bold ${totalRealizedPnl >= 0 ? 'text-cyan-400' : 'text-orange-400'}`}>
                  ${totalRealizedPnl.toFixed(2)} USDT
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 gap-4 mb-8">
            {loading && positions.length > 0 ? (
              <div className="flex justify-center p-12">
                <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
              </div>
            ) : positions.length === 0 ? (
              <div className="text-center p-8 bg-gray-50 border border-dashed border-gray-200 rounded-3xl">
                <p className="text-sm text-gray-400 font-medium">No active positions</p>
                <p className="text-xs text-gray-300 mt-1">Start trading to see your assets here</p>
              </div>
            ) : (
              assets.map((asset) => (
                <div 
                  key={asset.symbol}
                  className="flex justify-between p-5 bg-white border border-gray-100 rounded-3xl items-center shadow-sm hover:border-cyan-200 transition-colors cursor-pointer group"
                >
                  <div className="flex gap-4 items-center">
                      <div className={`${asset.bg} p-2.5 rounded-2xl group-hover:scale-110 transition-transform flex items-center justify-center overflow-hidden w-11 h-11`}>
                        {asset.logoUrl ? (
                          <img src={asset.logoUrl} alt={asset.symbol} className="w-8 h-8 object-contain" referrerPolicy="no-referrer" />
                        ) : (
                          <asset.icon className={`${asset.color} w-6 h-6`}/>
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">{asset.name}</div>
                        <div className="flex gap-2 text-[10px] font-bold">
                          <span className="text-gray-400">{asset.amount.toFixed(4)} {asset.symbol}</span>
                          <motion.span 
                            key={asset.pnl}
                            initial={{ opacity: 0.5 }}
                            animate={{ opacity: 1 }}
                            className={parseFloat(asset.pnlPercent) >= 0 ? 'text-green-500' : 'text-red-500'}
                          >
                             {parseFloat(asset.pnlPercent) >= 0 ? '+' : ''}{asset.pnlPercent}%
                          </motion.span>
                        </div>
                      </div>
                  </div>

                  {/* Visual Sparkline Trend */}
                  <div className="flex-1 h-10 max-w-[100px] mx-4 opacity-40 group-hover:opacity-100 transition-all duration-500 hidden sm:block">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={asset.sparklineData}>
                        <Line 
                          type="monotone" 
                          dataKey="value" 
                          stroke={asset.changeRaw >= 0 ? '#22c55e' : '#f43f5e'} 
                          strokeWidth={2} 
                          dot={false} 
                          isAnimationActive={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="text-right flex flex-col items-end gap-1.5 ml-2">
                    <div className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-0.5">Asset Value</div>
                    <div className="font-bold text-gray-900 leading-none">{asset.balance}</div>
                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-black uppercase tracking-tight transition-all duration-300 ${
                      parseFloat(asset.pnlPercent) >= 0 
                        ? 'bg-green-50 text-green-600 border-green-100 shadow-sm shadow-green-500/5' 
                        : 'bg-red-50 text-red-600 border-red-100 shadow-sm shadow-red-500/5'
                    }`}>
                      {parseFloat(asset.pnlPercent) >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      <span className="ml-0.5">{asset.pnl}</span>
                      <span className="opacity-60 ml-1">({parseFloat(asset.pnlPercent) >= 0 ? '+' : ''}{asset.pnlPercent}%)</span>
                    </div>
                  </div>
                </div>
              ))
            )}

            <div className="flex justify-between p-5 bg-white border border-gray-100 rounded-3xl items-center mt-2 shadow-sm">
                <div className="flex gap-4 items-center">
                   <div className="bg-cyan-50 p-2.5 rounded-2xl border border-cyan-100/50"><Wallet className="text-cyan-600 w-6 h-6"/></div>
                    <div>
                      <div className="font-bold text-gray-800">Available USDT</div>
                      <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Trading balance</div>
                    </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900">${useTrading().balanceUsdt.toLocaleString()} USDT</div>
                  <div className="text-[9px] font-black text-cyan-600 uppercase">≈ IDR {balanceIdr.toLocaleString('id-ID')}</div>
                </div>
            </div>
        </div>
    </div>
  );
}

