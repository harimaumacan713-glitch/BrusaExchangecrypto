import React, { useState, useEffect } from 'react';
import { Loader2, User, DollarSign, ArrowRightLeft, CreditCard, Shield, Orbit, Coins, Bitcoin, CheckCircle2, AlertCircle } from 'lucide-react';
import { useTrading } from '../context/TradingContext';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from '../context/ToastContext';
import { db, auth } from '../lib/firebase';
import { doc, runTransaction, collection, serverTimestamp, getDocs, query, where } from 'firebase/firestore';

// Price configuration interface
interface PriceData {
  USD: number;
  IDR: number;
}

export function TransferView() {
  const { eWalletBalance, positions, transferAsset, userAssetIps } = useTrading();
  const { showToast } = useToast();
  
  // Toggles: 'idr' (e-wallet) vs 'crypto' (direct IP)
  const [activeTab, setActiveTab] = useState<'idr' | 'crypto'>('crypto');
  
  // IDR State parameters
  const [recipientUid, setRecipientUid] = useState('');
  const [amount, setAmount] = useState('');
  
  // Crypto State parameters
  const [selectedAsset, setSelectedAsset] = useState<string>('BTC');
  const [recipientIp, setRecipientIp] = useState('');
  const [cryptoAmount, setCryptoAmount] = useState('');
  
  // Prices cache & loading
  const [marketPrices, setMarketPrices] = useState<Record<string, PriceData>>({});
  const [pricesLoading, setPricesLoading] = useState(true);
  
  // Execution status states
  const [submitting, setSubmitting] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{ type: 'idr' | 'crypto'; msg: string } | null>(null);
  const [errorInfo, setErrorInfo] = useState<string | null>(null);

  // Sync token prices automatically
  useEffect(() => {
    fetch('https://min-api.cryptocompare.com/data/pricemulti?fsyms=BTC,ETH,SOL,USDT,XRP&tsyms=USD,IDR')
      .then(res => res.json())
      .then(data => {
        if (data && !data.Response) {
          setMarketPrices(data);
        }
        setPricesLoading(false);
      })
      .catch(e => {
        console.error("Error fetching transfer module token prices:", e);
        showToast("Gagal mengambil harga pasar terupdate. Beberapa kalkulasi estimasi akan menggunakan data lokal.", "info");
        setPricesLoading(false);
      });
  }, []);

  // Compute available balance of selected crypto symbol
  const availableCrypto = React.useMemo(() => {
    const pos = positions?.find(p => p.symbol === selectedAsset);
    return pos ? pos.amount : 0;
  }, [positions, selectedAsset]);

  // Compute estimated IDR value of crypto amount entered
  const estimatedIdrValue = React.useMemo(() => {
    if (!cryptoAmount || isNaN(parseFloat(cryptoAmount))) return 0;
    const rate = marketPrices[selectedAsset]?.IDR || 0;
    return parseFloat(cryptoAmount) * rate;
  }, [cryptoAmount, selectedAsset, marketPrices]);

  // Handle Crypto Asset Transfer
  const handleCryptoTransfer = async () => {
    if (!cryptoAmount) {
      showToast("Harap tentukan jumlah kripto yang ingin ditransfer.", "error", "TransferView-cryptoAmount-input");
      return;
    }
    if (!recipientIp) {
      showToast("Alamat Key Address Penerima wajib diisi.", "error", "TransferView-recipientIp-input");
      return;
    }
    if (submitting) return;

    const amt = parseFloat(cryptoAmount);
    if (isNaN(amt) || amt <= 0) {
      const msg = "Jumlah transfer tidak valid.";
      setErrorInfo(msg);
      showToast(msg, "error", "TransferView-cryptoAmount-invalid");
      return;
    }
    if (amt > availableCrypto) {
      const msg = `Saldo posisi ${selectedAsset} tidak mencukupi untuk melakukan transfer.`;
      setErrorInfo(msg);
      showToast(msg, "error", "TransferView-cryptoAmount-insufficient");
      return;
    }

    setSubmitting(true);
    setErrorInfo(null);
    setSuccessInfo(null);

    try {
      const liveUsdPrice = marketPrices[selectedAsset]?.USD || 1;
      const success = await transferAsset(selectedAsset, recipientIp, amt, liveUsdPrice);
      
      if (success) {
        setSuccessInfo({
          type: 'crypto',
          msg: `Berhasil mengirim ${amt} ${selectedAsset} ke Key Address ${recipientIp}!`
        });
        showToast(`Sukses mentransfer ${amt} ${selectedAsset} ke Key Address ${recipientIp}!`, "success");
        setCryptoAmount('');
        setRecipientIp('');
      } else {
        const msg = "Transfer gagal. Periksa kembali alamat Key Address tujuan Anda.";
        setErrorInfo(msg);
        showToast(msg, "error", "TransferView-crypto-failure");
      }
    } catch (e: any) {
      const msg = e?.message || "Terjadi kesalahan internal ketika memproses transfer.";
      setErrorInfo(msg);
      showToast(msg, "error", "TransferView-crypto-exception");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8 space-y-8 bg-slate-950 flex-1 flex flex-col items-center">
      <div className="w-full max-w-lg space-y-6">
        
        {/* Title */}
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-black tracking-tighter text-white">Transfer</h2>
          <p className="text-slate-400 text-sm font-bold uppercase tracking-widest text-[10px]">
            Send assets securely using account numbers or direct Key Addresses.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-slate-905 p-1 rounded-2xl border border-slate-900/60 shadow-lg">
          <button
            onClick={() => {
              setActiveTab('crypto');
              setErrorInfo(null);
              setSuccessInfo(null);
            }}
            className={`flex-1 py-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
              activeTab === 'crypto'
                ? 'bg-gradient-to-r from-cyan-500/80 to-indigo-500/80 text-white font-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Orbit className="w-4 h-4 text-cyan-400" />
            Direct Key Address
          </button>
          <button
            onClick={() => {
              setActiveTab('idr');
              setErrorInfo(null);
              setSuccessInfo(null);
            }}
            className={`flex-1 py-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
              activeTab === 'idr'
                ? 'bg-gradient-to-r from-indigo-500/80 to-purple-500/80 text-white font-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CreditCard className="w-4 h-4 text-indigo-400" />
            Fiat IDR Wallet
          </button>
        </div>

        {/* Status Alerts */}
        <AnimatePresence mode="wait">
          {successInfo && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl text-emerald-400 flex items-start gap-4"
            >
              <CheckCircle2 className="w-6 h-6 shrink-0 mt-0.5 animate-bounce" />
              <div>
                <p className="font-extrabold text-sm uppercase tracking-wider">Transfer Sukses!</p>
                <p className="text-xs text-emerald-500/80 font-bold mt-1 leading-relaxed">{successInfo.msg}</p>
              </div>
            </motion.div>
          )}

          {errorInfo && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-5 bg-rose-500/10 border border-rose-500/20 rounded-3xl text-rose-450 flex items-start gap-4"
            >
              <AlertCircle className="w-6 h-6 shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold text-sm uppercase tracking-wider">Gagal Mengirim</p>
                <p className="text-xs text-rose-400/80 font-bold mt-1 leading-relaxed">{errorInfo}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dynamic Panels */}
        <AnimatePresence mode="wait">
          {activeTab === 'crypto' ? (
            /* Peer-to-peer Crypto IP Asset Transfer Workspace */
            <motion.div
              key="crypto_panel"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Asset pills selector */}
              <div className="space-y-2">
                <label className="text-[10px] pl-1 font-black uppercase tracking-widest text-slate-500">Pilih Aset Kripto</label>
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {['BTC', 'ETH', 'SOL', 'USDT', 'XRP'].map(symbol => {
                    const pos = positions?.find(p => p.symbol === symbol);
                    const bal = pos ? pos.amount : 0;
                    const isActive = selectedAsset === symbol;

                    return (
                      <button
                        key={symbol}
                        onClick={() => {
                          setSelectedAsset(symbol);
                          setCryptoAmount('');
                          setErrorInfo(null);
                        }}
                        className={`px-4 py-3 rounded-2xl border text-left shrink-0 transition-all ${
                          isActive 
                            ? 'bg-slate-900 border-cyan-500 text-white shadow-lg' 
                            : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="text-xs font-black tracking-tight">{symbol}</div>
                        <div className="text-[9px] font-mono font-bold text-slate-500 mt-1">
                          {bal > 0 ? bal.toFixed(4) : '0.00'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Recipient IP Input */}
              <div className="space-y-2">
                <label className="text-[10px] pl-1 font-black uppercase tracking-widest text-slate-500">Key Address Aset Penerima</label>
                <div className="relative">
                  <Orbit className="absolute left-6 top-6 text-slate-500 w-5 h-5" />
                  <input
                    type="text"
                    value={recipientIp}
                    onChange={(e) => setRecipientIp(e.target.value)}
                    placeholder={`Contoh Key: ak_live_${selectedAsset.toLowerCase()}_...`}
                    className="w-full bg-slate-900 border-2 border-slate-800 rounded-[28px] pl-16 pr-6 py-5 text-sm font-bold font-mono text-white focus:border-cyan-500 focus:bg-slate-800 outline-none transition-all placeholder:text-slate-600 shadow-inner"
                  />
                </div>
              </div>

              {/* Amount input */}
              <div className="space-y-2">
                <div className="flex justify-between items-center pl-1 pr-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Jumlah Kirim ({selectedAsset})</label>
                  <button
                    onClick={() => setCryptoAmount(availableCrypto.toString())}
                    className="text-[9px] font-black uppercase tracking-widest text-cyan-400 hover:text-cyan-300"
                  >
                    Kirim Semua (Max)
                  </button>
                </div>
                <div className="relative">
                  <Coins className="absolute left-6 top-6 text-slate-500 w-5 h-5" />
                  <input
                    type="number"
                    step="any"
                    value={cryptoAmount}
                    onChange={(e) => setCryptoAmount(e.target.value)}
                    placeholder={`Maksimum: ${availableCrypto.toFixed(5)} ${selectedAsset}`}
                    className="w-full bg-slate-900 border-2 border-slate-800 rounded-[28px] pl-16 pr-6 py-5 text-sm font-bold text-white focus:border-cyan-500 focus:bg-slate-800 outline-none transition-all placeholder:text-slate-600 shadow-inner"
                  />
                </div>
                {/* Real-time estimated valuations */}
                {estimatedIdrValue > 0 && (
                  <p className="text-[10px] font-semibold text-emerald-400 pl-1">
                    Estimasi Nilai: Rp {Math.round(estimatedIdrValue).toLocaleString('id-ID')} IDR
                  </p>
                )}
              </div>

              {/* Action trigger button */}
              <button
                onClick={handleCryptoTransfer}
                disabled={submitting || !cryptoAmount || !recipientIp || availableCrypto <= 0}
                className="w-full mt-4 py-5 bg-gradient-to-r from-cyan-500 to-indigo-500 text-white font-black uppercase tracking-widest text-sm rounded-[28px] shadow-xl shadow-cyan-500/10 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 disabled:hover:scale-100 transition-all border border-transparent flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <Loader2 className="animate-spin w-5 h-5" />
                ) : (
                  <>
                    <ArrowRightLeft className="w-4 h-4" />
                    Kirim {selectedAsset} ke Key Address
                  </>
                )}
              </button>
            </motion.div>
          ) : (
            /* IDR Wallet standard account-based transfer */
            <motion.div
              key="fiat_panel"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-[24px]">
                <div className="text-[9px] font-black uppercase tracking-widest text-slate-500">Saldo E-Wallet IDR Anda</div>
                <div className="text-xl font-mono font-black text-white mt-1">Rp {eWalletBalance.toLocaleString()}</div>
              </div>

              {/* Recipient Account Number */}
              <div className="space-y-2">
                <label className="text-[10px] pl-1 font-black uppercase tracking-widest text-slate-500">Nomor Rekening Penerima</label>
                <div className="relative">
                  <User className="absolute left-6 top-6 text-slate-500 w-5 h-5" />
                  <input 
                    type="text"
                    value={recipientUid}
                    onChange={(e) => setRecipientUid(e.target.value)}
                    placeholder="Masukkan 10-digit nomor rekening"
                    className="w-full bg-slate-900 border-2 border-slate-800 rounded-[28px] pl-16 pr-6 py-5 text-sm font-bold text-white focus:border-indigo-505 focus:bg-slate-800 outline-none transition-all placeholder:text-slate-600 shadow-inner"
                  />
                </div>
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <label className="text-[10px] pl-1 font-black uppercase tracking-widest text-slate-500">Jumlah Transfer (IDR)</label>
                <div className="relative">
                  <DollarSign className="absolute left-6 top-6 text-slate-500 w-5 h-5" />
                  <input 
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Contoh: 100000"
                    className="w-full bg-slate-900 border-2 border-slate-800 rounded-[28px] pl-16 pr-6 py-5 text-sm font-bold text-white focus:border-indigo-505 focus:bg-slate-800 outline-none transition-all placeholder:text-slate-600 shadow-inner"
                  />
                </div>
              </div>

              <button 
                onClick={async () => {
                  if (!recipientUid) {
                    showToast("Nomor rekening atau email penerima wajib diisi.", "error", "TransferView-fiat-recipient-input");
                    return;
                  }
                  if (!amount) {
                    showToast("Masukkan jumlah transfer IDR.", "error", "TransferView-fiat-amount-input");
                    return;
                  }
                  if (submitting) return;

                  const fiatAmt = parseFloat(amount);
                  if (isNaN(fiatAmt) || fiatAmt <= 0) {
                    const msg = "Jumlah transfer tidak valid.";
                    setErrorInfo(msg);
                    showToast(msg, "error", "TransferView-fiat-amount-invalid");
                    return;
                  }
                  if (fiatAmt > eWalletBalance) {
                    const msg = "Saldo e-Wallet IDR tidak mencukupi.";
                    setErrorInfo(msg);
                    showToast(msg, "error", "TransferView-fiat-amount-insufficient");
                    return;
                  }

                  setSubmitting(true);
                  setErrorInfo(null);
                  setSuccessInfo(null);

                  try {
                    let finalRecipientUid = recipientUid.trim();

                    if (finalRecipientUid.includes('@')) {
                        const q = query(collection(db, 'users'), where('email', '==', finalRecipientUid.trim()));
                        const snaps = await getDocs(q);
                        if (!snaps.empty) {
                            finalRecipientUid = snaps.docs[0].id;
                        } else {
                            throw new Error('Email penerima tidak ditemukan di database.');
                        }
                    } else if (/^[0-9]+$/.test(finalRecipientUid)) {
                        const q = query(collection(db, 'users'), where('accountNumber', '==', finalRecipientUid));
                        const snaps = await getDocs(q);
                        if (!snaps.empty) {
                            finalRecipientUid = snaps.docs[0].id;
                        } else {
                            throw new Error('Nomor rekening penerima tidak ditemukan di database.');
                        }
                    }

                    const senderWalletRef = doc(db, 'wallets', auth.currentUser!.uid);
                    const recipientWalletRef = doc(db, 'wallets', finalRecipientUid);

                    await runTransaction(db, async (transaction) => {
                      const senderWallet = await transaction.get(senderWalletRef);
                      const recipientWallet = await transaction.get(recipientWalletRef);
                      
                      if (!senderWallet.exists()) throw new Error('E-Wallet pengirim tidak ditemukan.');

                      const senderData = senderWallet.data();
                      let recipientBalance = 0;
                      
                      if (recipientWallet.exists()) {
                         recipientBalance = recipientWallet.data()?.balance || 0;
                      }

                      if ((senderData.balance || 0) < fiatAmt) {
                        throw new Error('E-Wallet balance tidak mencukupi.');
                      }

                      transaction.update(senderWalletRef, { balance: Number(senderData.balance || 0) - fiatAmt });
                      transaction.set(recipientWalletRef, { 
                          balance: Number(recipientBalance) + fiatAmt,
                          currency: 'IDR'
                      }, { merge: true });
                      
                      const transactionRef = doc(collection(db, 'transactions'));
                      transaction.set(transactionRef, {
                          userId: auth.currentUser!.uid,
                          toId: finalRecipientUid,
                          fromName: auth.currentUser!.email || 'Anonymous',
                          amount: fiatAmt,
                          type: 'transfer',
                          createdAt: serverTimestamp()
                      });

                      const transferMasukRef = doc(collection(db, 'transfer_masuk'));
                      transaction.set(transferMasukRef, {
                          penerimaUid: finalRecipientUid,
                          pengirimUid: auth.currentUser!.uid,
                          pengirimEmail: auth.currentUser!.email || 'Anonymous',
                          jumlah: fiatAmt,
                          timestamp: serverTimestamp()
                      });

                      const extTransferRef = doc(collection(db, 'external_transfers'));
                      transaction.set(extTransferRef, {
                          senderUid: auth.currentUser!.uid,
                          senderEmail: auth.currentUser!.email || 'Anonymous',
                          senderName: auth.currentUser!.displayName || 'Trader',
                          receiverUid: finalRecipientUid,
                          jumlah: fiatAmt,
                          type: 'transfer',
                          timestamp: serverTimestamp()
                      });
                    });

                    setSuccessInfo({
                      type: 'idr',
                      msg: `Berhasil mengirim Rp ${fiatAmt.toLocaleString('id-ID')} ke rekening ${recipientUid}!`
                    });
                    showToast(`Selesai mentransfer Rp ${fiatAmt.toLocaleString('id-ID')} ke rekening ${recipientUid}!`, "success");
                    setAmount('');
                    setRecipientUid('');
                  } catch (e: any) {
                    const msg = e.message || "Transfer gagal. Pastikan nomor rekening benar.";
                    setErrorInfo(msg);
                    showToast(msg, "error", "TransferView-fiat-failure");
                  } finally {
                    setSubmitting(false);
                  }
                }}
                disabled={submitting || !amount || !recipientUid}
                className="w-full mt-4 py-5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-black uppercase tracking-widest text-sm rounded-[28px] shadow-xl shadow-indigo-500/10 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 disabled:hover:scale-100 transition-all border border-transparent"
              >
                {submitting ? <Loader2 className="animate-spin mx-auto w-5 h-5" /> : 'Konfirmasi Transfer IDR'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
