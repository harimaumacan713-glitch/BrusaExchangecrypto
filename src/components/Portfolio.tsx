import React, { useState, useEffect } from 'react';
import { Bitcoin, Wallet, Coins, ShipWheel, DollarSign, Loader2, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';

import { useTrading } from '../context/TradingContext';

const iconMap: Record<string, any> = {
  BTC: { icon: Bitcoin, color: 'text-orange-500', bg: 'bg-orange-100', name: 'Bitcoin' },
  ETH: { icon: Coins, color: 'text-blue-500', bg: 'bg-blue-100', name: 'Ethereum' },
  SOL: { icon: ShipWheel, color: 'text-purple-500', bg: 'bg-purple-100', name: 'Solana' },
  USDT: { icon: DollarSign, color: 'text-green-500', bg: 'bg-green-100', name: 'TRether' },
};

export function Portfolio({ prices, loading }: { prices: any; loading: boolean }) {
  const { balance, positions, totalRealizedPnl } = useTrading();
  const [assets, setAssets] = useState<any[]>([]);

  useEffect(() => {
    if (prices && prices.DISPLAY && positions.length > 0) {
      const formatted = positions.map(pos => {
        const symbol = pos.symbol;
        const display = prices.DISPLAY[symbol]?.IDR;
        const raw = prices.RAW[symbol]?.IDR;
        const meta = iconMap[symbol] || { icon: Wallet, color: 'text-gray-500', bg: 'bg-gray-100', name: symbol };
        
        const currentPrice = raw?.PRICE || pos.entryPrice;
        const marketValue = pos.amount * currentPrice;
        const pnl = marketValue - (pos.amount * pos.entryPrice);
        const pnlPercent = ((currentPrice - pos.entryPrice) / pos.entryPrice) * 100;

        const pnlFormatted = new Intl.NumberFormat('id-ID', { 
          style: 'currency', 
          currency: 'IDR', 
          maximumFractionDigits: 0,
          signDisplay: 'always'
        }).format(pnl);

        return {
          symbol,
          name: meta.name,
          amount: pos.amount,
          balance: new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(marketValue),
          pnl: pnlFormatted,
          rawPnl: pnl,
          pnlPercent: pnlPercent.toFixed(2),
          change: display?.CHANGEPCT24HOUR ? `${display.CHANGEPCT24HOUR}%` : '0%',
          icon: meta.icon,
          color: meta.color,
          bg: meta.bg
        };
      });
      setAssets(formatted);
    } else {
      setAssets([]);
    }
  }, [prices, positions]);

  const totalUnrealizedPnl = assets.reduce((acc, asset) => acc + asset.rawPnl, 0);

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
                <motion.div 
                  key={totalUnrealizedPnl}
                  initial={{ opacity: 0.5 }} animate={{ opacity: 1 }}
                  className={`text-2xl font-black ${totalUnrealizedPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}
                >
                  {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0, signDisplay: 'always' }).format(totalUnrealizedPnl)}
                </motion.div>
              </div>
              <div className="text-right">
                <div className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">Realized Profit</div>
                <div className={`text-sm font-bold ${totalRealizedPnl >= 0 ? 'text-cyan-400' : 'text-orange-400'}`}>
                  {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0, signDisplay: 'always' }).format(totalRealizedPnl)}
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
              assets.map((asset, index) => (
                <motion.div 
                  key={asset.symbol}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex justify-between p-5 bg-white border border-gray-100 rounded-3xl items-center shadow-sm hover:border-cyan-200 transition-colors cursor-pointer group"
                >
                  <div className="flex gap-4 items-center">
                      <div className={`${asset.bg} p-2.5 rounded-2xl group-hover:scale-110 transition-transform`}>
                        <asset.icon className={`${asset.color} w-6 h-6`}/>
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">{asset.name}</div>
                        <div className="text-xs text-gray-400 font-medium">
                          {asset.amount.toFixed(4)} {asset.symbol} • <span className={parseFloat(asset.pnlPercent) >= 0 ? 'text-green-500' : 'text-red-500'}>
                             {parseFloat(asset.pnlPercent) >= 0 ? '+' : ''}{asset.pnlPercent}%
                          </span>
                        </div>
                      </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900">{asset.balance}</div>
                    <div className={`text-[10px] font-bold ${parseFloat(asset.pnlPercent) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {parseFloat(asset.pnlPercent) >= 0 ? '+' : ''}{asset.pnl}
                    </div>
                  </div>
                </motion.div>
              ))
            )}

            <div className="flex justify-between p-5 bg-gray-50/50 border border-dashed border-gray-200 rounded-3xl items-center mt-2">
                <div className="flex gap-4 items-center">
                   <div className="bg-white p-2.5 rounded-2xl shadow-xs border border-gray-100"><Wallet className="text-cyan-500 w-6 h-6"/></div>
                    <div>
                      <div className="font-bold text-gray-700">Cash Balance</div>
                      <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Tersedia untuk trading</div>
                    </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900">IDR {balance.toLocaleString('id-ID')}</div>
                  <div className="text-[9px] font-black text-green-500 uppercase">Ready to Use</div>
                </div>
            </div>
        </div>
    </div>
  );
}
