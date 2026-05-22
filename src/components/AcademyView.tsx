import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Play, 
  ChevronRight, 
  Clock, 
  Star, 
  GraduationCap, 
  Award, 
  CheckCircle2, 
  Search, 
  BookOpenCheck, 
  ArrowLeft, 
  TrendingUp, 
  ShieldAlert, 
  Check, 
  X, 
  HelpCircle,
  Lightbulb
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Lesson {
  id: number;
  title: string;
  category: 'basic' | 'tech' | 'risk' | 'advanced';
  categoryLabel: string;
  description: string;
  duration: string;
  rating: number;
  image: string;
  difficulty: 'Pemula' | 'Menengah' | 'Lanjut';
  difficultyColor: string;
  article: {
    subtitle: string;
    introduction: string;
    sections: { heading: string; body: string; tip?: string }[];
    summary: string;
  };
}

const lessons: Lesson[] = [
  {
    id: 1,
    title: 'Pengenalan Blockchain & Web3',
    category: 'basic',
    categoryLabel: 'Dasar Kripto',
    description: 'Pahami cara kerja buku besar terdistribusi, konsensus proof-of-work/stake, dan mengapa ini merevolusi sistem transaksi keuangan dunia.',
    duration: '8 menit',
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=600&h=300&fit=crop',
    difficulty: 'Pemula',
    difficultyColor: 'from-emerald-500/20 to-emerald-500/5 text-emerald-400 border-emerald-500/30',
    article: {
      subtitle: 'Memahami Pondasi Keuangan Terdesentralisasi',
      introduction: 'Sebelum terjun ke dunia trading, sangat penting untuk memahami teknologi fundamental di bawahnya. Blockchain bukan sekadar "database biasa", melainkan sistem revolusioner tanpa perantara.',
      sections: [
        {
          heading: '1. Apa Itu Blok dan Rantainya?',
          body: 'Setiap transaksi dikelompokkan ke dalam satu "blok". Blok ini mengandung catatan transaksi, stempel waktu, dan kriptografi pembungkus unik (hash) dari blok sebelumnya. Ketika blok saling terhubung, mereka membentuk rantai (chain) yang mustahil diubah tanpa merusak seluruh jaringan.',
          tip: 'Karena sifatnya yang kriptografis, meretas satu blok saja memerlukan tenaga komputasi dari lebih dari 51% seluruh komputer di dunia!'
        },
        {
          heading: '2. Cara Mencapai Konsensus (Sepakat Tanpa Admin)',
          body: 'Dalam dunia perbankan biasa, bank bertindak sebagai pencatat tunggal. Di blockchain, konsensus dicapai secara gotong royong melalui Proof of Work (seperti Bitcoin, mengandalkan kekuatan listrik/komputer) atau Proof of Stake (seperti Ethereum, mengandalkan koin yang didepositokan/dipertaruhkan).'
        },
        {
          heading: '3. Mengapa Web3 Begitu Penting?',
          body: 'Web1 memberi kita kemampuan membaca (Read), Web2 berfokus pada interaksi media sosial (Read & Write) namun dikontrol korporasi besar. Web3 mengenalkan konsep Kepemilikan (Read, Write & Own) melalui kepemilikan aset kripto dan identitas desentral.'
        }
      ],
      summary: 'Blockchain adalah buku besar digital yang transparan, aman, global, dan tidak dikendalikan oleh entitas tunggal mana pun.'
    }
  },
  {
    id: 2,
    title: 'Membaca Candlestick & Struktur Tren',
    category: 'tech',
    categoryLabel: 'Analisis Teknikal',
    description: 'Pelajari anatomi sebatang candle emas/merah, cara memetakan support & resistance, serta membaca ke mana pergerakan pasar selanjutnya.',
    duration: '12 menit',
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1611974714658-66d2c130094e?w=600&h=300&fit=crop',
    difficulty: 'Menengah',
    difficultyColor: 'from-amber-500/20 to-amber-500/5 text-amber-400 border-amber-500/30',
    article: {
      subtitle: 'Menguraikan Bahasa Grafik Pasar',
      introduction: 'Candlestick diciptakan di Jepang pada abad ke-18 untuk perdagangan beras. Kini metodologi grafis ini menjadi senjata utama setiap trader profesional di dunia kripto yang bergerak super dinamis.',
      sections: [
        {
          heading: '1. Anatomi Candlestick Tunggal',
          body: 'Satu candle merepresentasikan rentang waktu tertentu (misal 1 Jam atau 1 Hari). Warnanya menunjukkan apakah harga naik (hijau/hijau-kebiruan) atau turun (merah). Badan (body) menunjukkan harga buka dan tutup, sedangkan garis tipis vertikal (wick/shadow) di atas/bawah menunjukkan harga tertinggi dan terendah sepanjang periode tersebut.',
          tip: 'Wick yang panjang di atas menandakan tekanan penjual yang kuat, menolak kenaikan harga lebih jauh.'
        },
        {
          heading: '2. Support dan Resistance (Lantai dan Atap)',
          body: 'Support adalah level harga historis di mana para pembeli cenderung masuk ke pasar, menahan harga agar tidak merosot lebih bawah. Resistance adalah level atap harga di mana para penjual siap melepaskan aset, menahan harga agar tidak melonjak melampaui level itu.'
        },
        {
          heading: '3. Volume Sebagai Validasi Utama',
          body: 'Kenaikan harga yang tajam tanpa ada volume perdagangan yang tinggi biasanya adalah jebakan (bull trap). Selalu pastikan kenaikan tren dikonfirmasi oleh volume beli yang signifikan di bagian bawah grafik.'
        }
      ],
      summary: 'Menggabungkan analisis candlestick tunggal dengan garis horizontal support/resistance adalah awal paling akurat untuk mengidentifikasi arah pasar.'
    }
  },
  {
    id: 3,
    title: 'Manajemen Risiko Trading Kripto',
    category: 'risk',
    categoryLabel: 'Psikologi & Risiko',
    description: 'Aturan mutlak mengendalikan emosi, menetapkan rasio Risk-to-Reward minimum, dan cara menghitung ukuran posisi (position sizing) yang aman.',
    duration: '10 menit',
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1622790698141-94e30457ef12?w=600&h=300&fit=crop',
    difficulty: 'Pemula',
    difficultyColor: 'from-emerald-500/20 to-emerald-500/5 text-emerald-400 border-emerald-500/30',
    article: {
      subtitle: 'Bertahan Hidup di Tengah Badai Volatilitas',
      introduction: 'Banyak pemula salah fokus hanya pada keuntungan besar. Trader profesional fokus pada cara melindungi modal dasar agar tidak punah saat pasar bergerak berlawanan.',
      sections: [
        {
          heading: '1. Aturan Emas 1-2%: Berapa Banyak Risiko Per Transaksi?',
          body: 'Jangan pernah membiarkan kerugian pada satu kali posisi menguras lebih dari 1% hingga maksimal 2% dari total modal Anda. Jika modal Anda Rp 10.000.000, maksimal kerugian per trade yang boleh terjadi adalah Rp 100.000 hingga Rp 200.000.',
          tip: 'Terapkan Stop Loss di posisi strategis untuk mencairkan secara otomatis sebelum kerugian meluas.'
        },
        {
          heading: '2. Risk-to-Reward Ratio (RR Rasionil)',
          body: 'Selalu cari posisi trading yang menawarkan setidaknya rasio 1:2. Artinya, jika Anda siap menanggung risiko rugi Rp100.000 (jika menyentuh Stop Loss), target potensi profit Anda wajib setidaknya Rp200.000 (jika kena Take Profit). Dengan rasio ini, akurasi trade Anda hanya perlu 40% saja untuk tetap mencatatkan keuntungan dalam jangka panjang.'
        },
        {
          heading: '3. Kendalikan Emosi Terburuk: FOMO & Revenge Trading',
          body: 'FOMO (Fear of Missing Out) membuat Anda beli koin di puncak harga karena panik melihat warna hijau. Sementara Revenge Trading membuat Anda langsung open posisi lagi setelah rugi besar demi membalas dendam secara impulsif. Keduanya adalah pembunuh instan bagi saldo portofolio Anda.'
        }
      ],
      summary: 'Lindungi modal dasar Anda dengan ketat. Mengelola emosi dan kalkulasi risiko jauh lebih penting daripada tebakan arah koin.'
    }
  },
  {
    id: 4,
    title: 'Mekanisme Likuidasi & Leverage',
    category: 'advanced',
    categoryLabel: 'Analisis Tingkat Lanjut',
    description: 'Kalkulasi cara kerja trading derivatif/futures, konsep margin call, pemeliharaan posisi (margin maintenance), dan jebakan leverage besar.',
    duration: '15 menit',
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1639762681057-408e52192e55?w=600&h=300&fit=crop',
    difficulty: 'Lanjut',
    difficultyColor: 'from-rose-500/20 to-rose-500/5 text-rose-400 border-rose-500/30',
    article: {
      subtitle: 'Pedang Bermata Dua Dunia Futures',
      introduction: 'Derivatif dan leverage memungkinkan trader meminjam dana dari bursa untuk mengamplifikasi profit mereka. Namun salah langkah sedikit saja bisa memicu terjadinya likuidasi total.',
      sections: [
        {
          heading: '1. Memahami Leverage (Daya Ungkit)',
          body: 'Menggunakan leverage 10x berarti modal Rp 1.000.000 Anda bisa melakukan trade senilai Rp 10.000.000. Jika harga koin naik 5%, profit Anda melonjak 50% (Rp 500.000). Namun jika harga koin turun hanya 5%, Anda akan kehilangan 50% dari modal dasar Anda dalam sekejap.',
          tip: 'Untuk pemula, selalu disarankan menggunakan leverage maksimal 3x hingga 5x saja, atau hindari futures sama sekali sampai Anda matang di pasar spot!'
        },
        {
          heading: '2. Apa Itu Harga Likuidasi?',
          body: 'Karena dana yang dipinjam dari bursa harus memiliki jaminan modal dari Anda, jika kerugian posisi Anda menyentuh batas margin jaminan (margin pemeliharaan), bursa akan menutup paksa posisi Anda pada harga likuidasi tersebut untuk melunasi pinjaman mereka. Jaminan Anda hangus menjadi nol.'
        },
        {
          heading: '3. Cross Margin vs Isolated Margin',
          body: 'Dalam Isolated Margin, kerugian maksimal dipagari hanya pada modal yang didedikasikan ke posisi bersangkutan. Dalam Cross Margin, kerugian posisi yang buruk bisa terus memakan sisa saldo dari dompet utama Anda agar posisi tersebut tidak terlikuidasi.'
        }
      ],
      summary: 'Leverage adalah alat yang sangat kuat untuk memperbesar akun kecil, namun sangat menghancurkan jika digunakan tanpa strategi stop loss yang matang.'
    }
  }
];

interface Quiz {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const quizzes: Quiz[] = [
  {
    id: 1,
    question: 'Apa kepanjangan dan arti tersirat dari istilah budaya kripto "HODL"?',
    options: [
      'Hybrid Online Decentralized Legacy - Skema warisan digital',
      'Hold On for Dear Life - Bertahan menyimpan aset di kala badai volatilitas',
      'High-frequency Order Distribution Loop - Protokol perdagangan cepat'
    ],
    correctIndex: 1,
    explanation: 'Term "HODL" berawal dari salah ketik kata "hold" di forum Bitcoin tahun 2013, kini diartikan sebagai prinsip "Hold On for Dear Life" (menyimpan aset erat-erat tanpa peduli koreksi tajam).'
  },
  {
    id: 2,
    question: 'Batas harga bawah historis di mana minat beli cenderung naik menahan pasar disebut sebagai level...',
    options: [
      'Support Level',
      'Resistance Level',
      'Liquidation Level'
    ],
    correctIndex: 0,
    explanation: 'Support diibaratkan seperti bantal atau lantai harga di mana para pembeli masuk membeli dalam jumlah besar sehingga harga tertahan tidak turun lagi.'
  },
  {
    id: 3,
    question: 'Jika menggunakan leverage 20x di pasar Futures, berapa % gerak koreksi harga terbalik yang memicu modal jaminan Anda langsung hangus terlikuidasi?',
    options: [
      '5%',
      '10%',
      '20%'
    ],
    correctIndex: 0,
    explanation: 'Dengan leverage 20x, margin Anda hanya 1/20 (5%). Maka gerak balik harga sebesar 5% (5% * 20 = 100%) langsung memicu kerugian senilai 100% modal jaminan, berujung pada likuidasi total.'
  }
];

const glossaryTerms = [
  { term: 'FOMO', desc: 'Fear of Missing Out. Kepanikan psikologis takut tertinggal peluang profit sehingga membeli aset di harga tertinggi.' },
  { term: 'FUD', desc: 'Fear, Uncertainty, and Doubt. Strategi penyebaran rumor buruk/negatif palsu untuk memicu kepanikan massal agar harga turun.' },
  { term: 'Gas Fee', desc: 'Biaya kompensasi bahan bakar server validator untuk memproses transaksi di jaringan desentralisasi seperti Ethereum.' },
  { term: 'Whale', desc: 'Pemain berdana gajah (institusi/individu) yang memiliki koin dalam jumlah besar, sanggup mengguncang tren harga pasar.' },
  { term: 'Stop Loss', desc: 'Perintah jual otomatis di bawah harga pasar saat ini yang dipasang khusus untuk membatasi risiko kerugian maksimal.' },
  { term: 'SL/TP', desc: 'Stop Loss (Batas Pengaman Kerugian) dan Take Profit (Jalur Merealisasikan Keuntungan Sesuai Target).' },
  { term: 'DCA', desc: 'Dollar Cost Average. Metode investasi dengan menabung kripto secara rutin berkala dengan jumlah uang tetap tanpa spekulasi.' },
  { term: 'Bearish', desc: 'Kondisi pasar yang lesu di mana harga dominan jatuh tertekan aksi jual meluas.' },
  { term: 'Bullish', desc: 'Kondisi pasar yang bergairah optimis di mana harga dominan melompat naik.' }
];

export function AcademyView() {
  const [activeTab, setActiveTab] = useState<'lessons' | 'quizzes' | 'glossary'>('lessons');
  const [filter, setFilter] = useState<'all' | 'basic' | 'tech' | 'risk' | 'advanced'>('all');
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  
  // Interactive Simulator state
  const [xp, setXp] = useState<number>(0);
  const [completedLessons, setCompletedLessons] = useState<number[]>([]);
  
  // Quiz Module state
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  // Glossary search state
  const [searchGlossary, setSearchGlossary] = useState('');

  // Toast confirmation feedback inside views
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Load level from localStorage on mount
  useEffect(() => {
    try {
      const storedXp = localStorage.getItem('aetherex_academy_xp');
      if (storedXp) setXp(parseInt(storedXp));

      const storedCompleted = localStorage.getItem('aetherex_academy_completed_lessons');
      if (storedCompleted) setCompletedLessons(JSON.parse(storedCompleted));
    } catch (e) {
      console.error(e);
    }
  }, []);

  const triggerToast = (text: string) => {
    setToastMsg(text);
    setTimeout(() => {
      setToastMsg(null);
    }, 3000);
  };

  const handleCompleteLesson = (id: number) => {
    if (!completedLessons.includes(id)) {
      const updated = [...completedLessons, id];
      setCompletedLessons(updated);
      const newXp = xp + 150;
      setXp(newXp);
      localStorage.setItem('aetherex_academy_completed_lessons', JSON.stringify(updated));
      localStorage.setItem('aetherex_academy_xp', newXp.toString());
      triggerToast(`+150 XP! Anda berhasil menyelesaikan materi belajar.`);
    } else {
      triggerToast(`Materi dibaca ulang. Hebat untuk memperdalam ilmu!`);
    }
  };

  const handleQuizAnswer = (optionIdx: number) => {
    if (quizSubmitted) return;
    setSelectedAnswer(optionIdx);
  };

  const handleQuizSubmit = () => {
    if (selectedAnswer === null || quizSubmitted) return;
    setQuizSubmitted(true);
    
    const quiz = quizzes[currentQuizIndex];
    if (selectedAnswer === quiz.correctIndex) {
      const newXp = xp + 200;
      setXp(newXp);
      setQuizScore(prev => prev + 1);
      localStorage.setItem('aetherex_academy_xp', newXp.toString());
      triggerToast(`Jawaban Benar! +200 XP diperoleh.`);
    } else {
      triggerToast(`Yah, kurang tepat. Pelajari penjelasannya ya!`);
    }
  };

  const handleNextQuiz = () => {
    setSelectedAnswer(null);
    setQuizSubmitted(false);
    if (currentQuizIndex < quizzes.length - 1) {
      setCurrentQuizIndex(prev => prev + 1);
    } else {
      // Finished all quizzes, reset to start or display victory
      setCurrentQuizIndex(0);
      setQuizScore(0);
      triggerToast("Kuis diulang dari awal untuk melatih refleks Anda!");
    }
  };

  const getRankName = (xpVal: number) => {
    if (xpVal >= 1200) return 'Elite Pro Trader 🏆';
    if (xpVal >= 700) return 'Market Veteran 🛡️';
    if (xpVal >= 300) return 'Trading Scholar 🧠';
    return 'Novice Trader 🌱';
  };

  const getRankProgress = (xpVal: number) => {
    if (xpVal >= 1200) return 100;
    if (xpVal >= 700) return ((xpVal - 700) / 500) * 100;
    if (xpVal >= 300) return ((xpVal - 300) / 400) * 100;
    return (xpVal / 300) * 100;
  };

  const getNextThreshold = (xpVal: number) => {
    if (xpVal >= 1200) return 'Max Rank';
    if (xpVal >= 700) return '1200 XP';
    if (xpVal >= 300) return '700 XP';
    return '300 XP';
  };

  const filteredLessons = lessons.filter(l => filter === 'all' || l.category === filter);

  const filteredGlossary = glossaryTerms.filter(t => 
    t.term.toLowerCase().includes(searchGlossary.toLowerCase()) || 
    t.desc.toLowerCase().includes(searchGlossary.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 pb-28 space-y-6 text-slate-100 min-h-screen">
      {/* Toast Alert */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-full bg-cyan-500 text-slate-950 text-xs font-black shadow-lg shadow-cyan-500/20 uppercase tracking-widest flex items-center gap-2"
          >
            <Award className="w-4 h-4 animate-bounce" />
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Banner - Sleek Bento Board */}
      <div className="relative overflow-hidden bg-slate-900 border border-slate-800 rounded-[32px] p-6 shadow-xl">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-cyan-500/10 to-transparent blur-3xl rounded-full" />
        <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-indigo-500/5 blur-2xl rounded-full" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10 w-full">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3  py-1 bg-slate-800/80 border border-slate-700/60 rounded-full text-xs text-cyan-400 font-bold">
              <GraduationCap className="w-4 h-4" />
              <span>Aether Academy Pro</span>
            </div>
            <h2 className="text-3xl font-black tracking-tighter text-white">Akademi Finansial</h2>
            <p className="text-slate-400 text-xs sm:text-sm max-w-md font-medium leading-relaxed">
              Kuasai teknik blockchain, analisa candlestick real-time, dan proteksi risiko mutlak secara instan di sini.
            </p>
          </div>

          {/* Gamified Progress Holder */}
          <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl w-full md:w-72">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Level Anda</span>
              <span className="text-xs font-black text-cyan-400">{getRankName(xp)}</span>
            </div>
            <div className="flex items-baseline justify-between mb-3 text-slate-200">
              <span className="text-lg font-black font-mono">{xp} <span className="text-[10px] text-slate-500 font-bold uppercase">XP</span></span>
              <span className="text-[9px] text-slate-400 font-semibold font-mono">Ke: {getNextThreshold(xp)}</span>
            </div>
            
            <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden flex self-center shadow-inner">
              <motion.div 
                className="bg-gradient-to-r from-cyan-400 to-indigo-500 h-full rounded-full"
                animate={{ width: `${getRankProgress(xp)}%` }}
                transition={{ duration: 0.8 }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Internal View Selection Tabs */}
      <div className="flex bg-slate-900/60 p-1 rounded-2xl border border-slate-850 gap-1 w-full max-w-sm">
        <button
          onClick={() => { setActiveTab('lessons'); setActiveLesson(null); }}
          className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
            activeTab === 'lessons' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          Materi Kelas
        </button>
        <button
          onClick={() => { setActiveTab('quizzes'); setActiveLesson(null); }}
          className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
            activeTab === 'quizzes' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          Kuis Kilat
        </button>
        <button
          onClick={() => { setActiveTab('glossary'); setActiveLesson(null); }}
          className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
            activeTab === 'glossary' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          Kamus Istilah
        </button>
      </div>

      <AnimatePresence mode="wait">
        {/* VIEW 1: Lessons List or Detail Viewer */}
        {activeTab === 'lessons' && (
          <motion.div
            key="lessons-block"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {!activeLesson ? (
              <>
                {/* Micro filters */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[
                    { key: 'all', label: 'Semua Kategori' },
                    { key: 'basic', label: 'Dasar Kripto' },
                    { key: 'tech', label: 'Teknikal' },
                    { key: 'risk', label: 'Manajemen Risiko' },
                    { key: 'advanced', label: 'Futures Lanjut' }
                  ].map(btn => (
                    <button
                      key={btn.key}
                      onClick={() => setFilter(btn.key as any)}
                      className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border-2 transition-all ${
                        filter === btn.key 
                          ? 'bg-slate-200 border-slate-100 text-slate-950' 
                          : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>

                {/* Grid Structure */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredLessons.map((lesson, idx) => {
                    const isCompleted = completedLessons.includes(lesson.id);
                    return (
                      <motion.div 
                        key={lesson.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.08 }}
                        className="bg-slate-900 border border-slate-800 p-5 rounded-[28px] hover:border-slate-700/80 transition-all shadow-lg flex flex-col justify-between group"
                      >
                        <div className="space-y-4">
                          {/* Top Thumbnail Badge info */}
                          <div className="relative h-44 w-full rounded-2xl overflow-hidden shadow-inner bg-slate-950 border border-slate-800">
                            <img 
                              src={lesson.image} 
                              alt={lesson.title} 
                              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" 
                            />
                            <div className="absolute top-3 left-3 flex gap-1.5">
                              <span className="text-[8px] bg-slate-950/90 border border-white/10 px-2 py-1 rounded-md font-black uppercase tracking-widest text-[#22d3ee]">
                                {lesson.categoryLabel}
                              </span>
                              <span className={`text-[8px] border px-2 py-1 rounded-md font-black uppercase tracking-widest bg-slate-900/90 ${lesson.difficultyColor}`}>
                                {lesson.difficulty}
                              </span>
                            </div>

                            {isCompleted && (
                              <div className="absolute bottom-3 right-3 bg-emerald-500 text-slate-950 px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                                <Check className="w-3 h-3 stroke-[3]" />
                                Selesai
                              </div>
                            )}
                          </div>

                          {/* Detail titles */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <h3 className="font-extrabold text-lg text-white group-hover:text-cyan-400 transition-colors leading-tight">
                                {lesson.title}
                              </h3>
                              <div className="flex items-center gap-1 text-[10px] font-black text-amber-500 bg-amber-500/10 px-2 py-0.5 border border-amber-500/20 rounded-md">
                                <Star className="w-3 h-3 fill-amber-500" />
                                {lesson.rating}
                              </div>
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                              {lesson.description}
                            </p>
                          </div>
                        </div>

                        {/* Card bottom CTA */}
                        <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-800/80">
                          <span className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                            <Clock className="w-3.5 h-3.5" />
                            {lesson.duration} Bacaan
                          </span>

                          <button 
                            onClick={() => setActiveLesson(lesson)}
                            className="bg-slate-950 hover:bg-cyan-500 hover:text-slate-950 border border-slate-800 hover:border-cyan-400 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-1 group-hover:shadow-[0_0_12px_rgba(34,211,238,0.15)]"
                          >
                            Mulai Belajar
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </>
            ) : (
              /* DETAILED VIEW: Reading Mode */
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-slate-900 border border-slate-800 rounded-[32px] p-5 sm:p-8 space-y-6"
              >
                {/* Action Back Button */}
                <button
                  onClick={() => {
                    handleCompleteLesson(activeLesson.id);
                    setActiveLesson(null);
                  }}
                  className="bg-slate-950/80 text-slate-400 hover:text-white px-4 py-2 rounded-xl border border-slate-800 text-xs font-black uppercase tracking-widest flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Selesai & Kembali
                </button>

                {/* Banner Section */}
                <div className="relative h-56 rounded-[24px] overflow-hidden border border-slate-800 bg-slate-950">
                  <img src={activeLesson.image} alt={activeLesson.title} className="w-full h-full object-cover opacity-60" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent" />
                  <div className="absolute bottom-6 left-6 space-y-1.5 pr-6">
                    <span className="text-[10px] bg-cyan-400 text-slate-950 px-3 py-1 rounded-full font-black uppercase tracking-widest">
                      {activeLesson.categoryLabel}
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">{activeLesson.title}</h3>
                    <p className="text-xs text-slate-300 font-bold">{activeLesson.article.subtitle}</p>
                  </div>
                </div>

                {/* Article Core Content */}
                <div className="space-y-6 max-w-3xl pr-2 leading-relaxed text-sm text-slate-300">
                  <p className="text-slate-200 font-medium border-l-2 border-cyan-400 pl-4 py-1 italic bg-cyan-950/10">
                    "{activeLesson.article.introduction}"
                  </p>

                  {/* Rendering Candle Graphical Representation for Technical Analysis */}
                  {activeLesson.category === 'tech' && (
                    <div className="my-6 bg-slate-950 border border-slate-800 p-6 rounded-2xl flex flex-col items-center justify-center gap-4">
                      <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Simulasi Anatomi Candlestick</p>
                      
                      <div className="flex gap-16 items-center">
                        {/* Bullish Candle */}
                        <div className="flex flex-col items-center">
                          <span className="text-[9px] font-mono text-cyan-400 font-extrabold mb-1">Max: Rp 1.500</span>
                          <div className="w-0.5 h-6 bg-cyan-400" />
                          <div className="w-8 h-12 bg-cyan-500 border border-cyan-400 rounded flex items-center justify-center font-mono text-[9px] font-black text-slate-950">
                            Close
                          </div>
                          <div className="w-0.5 h-6 bg-cyan-400" />
                          <span className="text-[9px] font-mono text-cyan-400 font-extrabold mt-1">Min: Rp 1.250</span>
                          <span className="text-[10px] font-black uppercase text-cyan-400 mt-2">BULLISH (NAIK)</span>
                        </div>

                        {/* Bearish Candle */}
                        <div className="flex flex-col items-center">
                          <span className="text-[9px] font-mono text-rose-400 font-extrabold mb-1">Max: Rp 1.500</span>
                          <div className="w-0.5 h-6 bg-rose-400" />
                          <div className="w-8 h-12 bg-rose-500 border border-rose-400 rounded flex items-center justify-center font-mono text-[9px] font-black text-white">
                            Open
                          </div>
                          <div className="w-0.5 h-6 bg-rose-400" />
                          <span className="text-[9px] font-mono text-rose-400 font-extrabold mt-1">Min: Rp 1.210</span>
                          <span className="text-[10px] font-black uppercase text-rose-400 mt-2">BEARISH (TURUN)</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Rendering Blockchain visualizer for basic blockchain category */}
                  {activeLesson.category === 'basic' && (
                    <div className="my-6 bg-slate-950 border border-slate-800 p-6 rounded-2xl flex flex-col items-center gap-4 overflow-x-auto w-full">
                      <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Struktur Rantai Blok Terdesentralisasi</p>
                      
                      <div className="flex items-center gap-4 min-w-[340px] justify-center">
                        {/* Block 1 */}
                        <div className="bg-slate-900 border-2 border-slate-800 p-3 rounded-xl text-center flex-1">
                          <div className="text-[10px] font-mono text-cyan-400 font-black">Block #01</div>
                          <div className="text-[8px] text-slate-500 font-mono mt-0.5">Hash: 000asb7..</div>
                          <div className="text-[8px] text-emerald-400 font-mono mt-1">Prev: 0000000..</div>
                        </div>

                        <div className="h-0.5 w-6 bg-cyan-400 animate-pulse" />

                        {/* Block 2 */}
                        <div className="bg-slate-900 border-3 border-cyan-500 p-3 rounded-xl text-center flex-1">
                          <div className="text-[10px] font-mono text-cyan-400 font-black">Block #02</div>
                          <div className="text-[8px] text-slate-500 font-mono mt-0.5">Hash: 00092fa..</div>
                          <div className="text-[8px] text-cyan-400 font-mono mt-1">Prev: 000asb7..</div>
                        </div>

                        <div className="h-0.5 w-6 bg-cyan-400 animate-pulse" />

                        {/* Block 3 */}
                        <div className="bg-slate-900 border-2 border-slate-800 p-3 rounded-xl text-center flex-1 opacity-60">
                          <div className="text-[10px] font-mono text-slate-500 font-black">Block #03</div>
                          <div className="text-[8px] text-slate-600 font-mono mt-0.5">Hash: Pending..</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeLesson.article.sections.map((section, sIdx) => (
                    <div key={sIdx} className="space-y-2">
                      <h4 className="text-base font-black text-white">{section.heading}</h4>
                      <p className="text-slate-300 leading-relaxed text-xs sm:text-sm">{section.body}</p>
                      
                      {section.tip && (
                        <div className="bg-cyan-500/5 border border-cyan-500/20 p-3.5 rounded-xl flex items-start gap-2 text-xs text-cyan-400 mt-2">
                          <Lightbulb className="w-4.5 h-4.5 shrink-0 text-cyan-400" />
                          <span className="font-semibold leading-relaxed"><strong>Pro Tip:</strong> {section.tip}</span>
                        </div>
                      )}
                    </div>
                  ))}

                  <div className="pt-4 border-t border-slate-800 mt-8 space-y-2">
                    <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Ringkasan Materi</h4>
                    <p className="text-white text-xs sm:text-sm font-semibold">{activeLesson.article.summary}</p>
                  </div>
                </div>

                {/* Confirm Read Button */}
                <div className="pt-6 border-t border-slate-800 flex justify-end">
                  <button
                    onClick={() => {
                      handleCompleteLesson(activeLesson.id);
                      setActiveLesson(null);
                    }}
                    className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black uppercase tracking-wider text-xs px-6 py-3 rounded-xl flex items-center gap-2 shadow-lg shadow-cyan-500/10 cursor-pointer"
                  >
                    <BookOpenCheck className="w-4 h-4" />
                    Saya Mengerti Materi Selengkapnya
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* VIEW 2: Interactive Real Time Quizzes */}
        {activeTab === 'quizzes' && (
          <motion.div
            key="quiz-block"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="max-w-xl mx-auto"
          >
            <div className="bg-slate-900 border border-slate-800 rounded-[32px] p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-cyan-400" />
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Aether Quiz Kilat</span>
                </div>
                <span className="text-xs font-mono font-bold text-slate-500">
                  Pertanyaan {currentQuizIndex + 1} dari {quizzes.length}
                </span>
              </div>

              {/* Quiz question container */}
              <div className="space-y-4">
                <h3 className="text-base sm:text-lg font-extrabold text-white leading-snug">
                  {quizzes[currentQuizIndex].question}
                </h3>

                <div className="space-y-2.5 pt-2">
                  {quizzes[currentQuizIndex].options.map((option, oIdx) => {
                    const isSelected = selectedAnswer === oIdx;
                    const isCorrectOption = oIdx === quizzes[currentQuizIndex].correctIndex;

                    let optionStyle = "bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900";
                    if (isSelected) {
                      if (quizSubmitted) {
                        optionStyle = isCorrectOption 
                          ? "bg-emerald-500/20 border-emerald-500 text-emerald-400" 
                          : "bg-rose-500/20 border-rose-500 text-rose-400";
                      } else {
                        optionStyle = "bg-cyan-500/10 border-cyan-500 text-cyan-400";
                      }
                    } else if (quizSubmitted && isCorrectOption) {
                      optionStyle = "bg-emerald-500/10 border-emerald-500/50 text-emerald-400";
                    }

                    return (
                      <button
                        key={oIdx}
                        disabled={quizSubmitted}
                        onClick={() => handleQuizAnswer(oIdx)}
                        className={`w-full text-left p-4 rounded-xl border-2 text-xs font-semibold leading-relaxed transition-all flex items-start gap-3 outline-none ${optionStyle}`}
                      >
                        <div className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center text-[10px] font-extrabold ${
                          isSelected ? 'bg-cyan-500/20 border-cyan-400 text-cyan-400' : 'border-slate-800 text-slate-500'
                        }`}>
                          {quizSubmitted && isCorrectOption ? (
                            <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />
                          ) : quizSubmitted && isSelected && !isCorrectOption ? (
                            <X className="w-3 h-3 text-rose-400 stroke-[3]" />
                          ) : (
                            String.fromCharCode(65 + oIdx)
                          )}
                        </div>
                        <span className="flex-1">{option}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Live interactive feedback */}
              {quizSubmitted && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-2xl border-2 ${
                    selectedAnswer === quizzes[currentQuizIndex].correctIndex 
                      ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400/90' 
                      : 'bg-rose-950/20 border-rose-500/30 text-rose-400/90'
                  } space-y-1.5`}
                >
                  <p className="text-xs font-black uppercase tracking-widest flex items-center gap-1">
                    {selectedAnswer === quizzes[currentQuizIndex].correctIndex ? (
                      <>
                        <Check className="w-4 h-4" /> 
                        Jawaban Benar! (+200 XP)
                      </>
                    ) : (
                      <>
                        <ShieldAlert className="w-4 h-4" /> 
                        Jawaban Kurang Tepat
                      </>
                    )}
                  </p>
                  <p className="text-[11px] font-bold leading-relaxed">{quizzes[currentQuizIndex].explanation}</p>
                </motion.div>
              )}

              {/* Bottom control buttons */}
              <div className="flex justify-between items-center pt-4 border-t border-slate-800/80">
                <span className="text-[10px] text-slate-500 font-bold tracking-wider">
                  Skor Sesi: {quizScore} / {quizzes.length}
                </span>

                {!quizSubmitted ? (
                  <button
                    disabled={selectedAnswer === null}
                    onClick={handleQuizSubmit}
                    className={`px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
                      selectedAnswer !== null 
                        ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md cursor-pointer' 
                        : 'bg-slate-950 text-slate-600 border border-slate-900 cursor-not-allowed'
                    }`}
                  >
                    Kirim Jawaban
                  </button>
                ) : (
                  <button
                    onClick={handleNextQuiz}
                    className="bg-slate-950 hover:bg-slate-900 text-white px-5 py-2.5 rounded-xl border border-slate-800 font-black text-xs uppercase tracking-widest transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    {currentQuizIndex < quizzes.length - 1 ? 'Pertanyaan Berikut' : 'Ulangi Kuis'}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* VIEW 3: Glossary Terms Search */}
        {activeTab === 'glossary' && (
          <motion.div
            key="glossary-block"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Search Input bar */}
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
              <input
                type="text"
                placeholder="Cari kode istilah kripto (contoh: FOMO, DCA)..."
                value={searchGlossary}
                onChange={(e) => setSearchGlossary(e.target.value)}
                className="w-full bg-slate-900 border-2 border-slate-800 rounded-2xl pl-12 pr-6 py-3.5 text-xs sm:text-sm font-semibold text-white focus:border-cyan-500 focus:bg-slate-800 outline-none transition-all placeholder:text-slate-600 shadow-inner"
              />
            </div>

            {/* Glossary lists layout */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filteredGlossary.length > 0 ? (
                filteredGlossary.map((g, gIdx) => (
                  <motion.div
                    key={g.term}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: gIdx * 0.04 }}
                    className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 p-4.5 rounded-2xl shadow-md space-y-2 group"
                  >
                    <div className="inline-flex px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/20 rounded font-black text-xs tracking-wider text-cyan-400 font-mono group-hover:bg-cyan-500/20 transition-all">
                      {g.term}
                    </div>
                    <p className="text-slate-300 text-xs leading-relaxed font-semibold">
                      {g.desc}
                    </p>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full text-center py-10 text-slate-500 text-xs font-bold uppercase tracking-widest">
                  Istilah belum ditemukan. Coba ketik yang lain!
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Community Call to Action banner at original position */}
      <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900 border border-indigo-500/20 rounded-[32px] p-8 text-white relative overflow-hidden shadow-xl mt-6">
        <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/5 blur-3xl rounded-full" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h3 className="text-xl font-black tracking-tight flex items-center gap-2">
              <Award className="w-6 h-6 text-cyan-400" />
              Gabung Komunitas Premium
            </h3>
            <p className="text-slate-400 text-xs sm:text-sm max-w-xl font-medium leading-relaxed">
              Dapatkan edukasi tambahan harian, market signal terpercaya, serta diskusi eksklusif bersama puluhan ribu trader handal Aether secara instan.
            </p>
          </div>
          
          <button 
            onClick={() => triggerToast("Sukses bergabung! Saluran Telegram Komunitas dibuka.")}
            className="whitespace-nowrap bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black px-6 py-3.5 rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/10 transition-colors cursor-pointer"
          >
            Masuk Saluran Komunitas
          </button>
        </div>
      </div>
    </div>
  );
}
