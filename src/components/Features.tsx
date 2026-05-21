import React, { useEffect, useState } from 'react';
import { Newspaper, TrendingUp, DollarSign, Search, X, Calendar, Filter, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const CATEGORIES = ['All', 'Regulation', 'Technology', 'Macroeconomics'];
const DATE_RANGES = [
  { label: 'All Time', value: 'all' },
  { label: 'Today', value: 'today' },
  { label: 'Last 7 Days', value: 'week' }
];

export function Features() {
  const [news, setNews] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDateRange, setSelectedDateRange] = useState('all');

  useEffect(() => {
    fetch(window.location.origin + '/api/news')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load news');
        return res.json();
      })
      .then(data => {
        if (data.results && Array.isArray(data.results) && data.results.length > 0) {
            setNews(data.results.map((item: any) => ({
                title: item.title,
                time: item.time,
                timestamp: item.timestamp,
                image: item.image,
                categories: item.categories || [],
                icon: Newspaper
            })));
        } else {
            setError('No news available at the moment.');
        }
      })
      .catch(err => {
        setError('Failed to load news. Please try again later.');
        console.error('Error fetching news:', err);
      });
  }, []);

  const filteredNews = news.filter(item => {
    // Search query filter
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Category filter
    const matchesCategory = selectedCategory === 'All' || 
      item.categories.some((cat: string) => cat.toLowerCase().includes(selectedCategory.toLowerCase()));
    
    // Date range filter
    let matchesDate = true;
    if (selectedDateRange !== 'all') {
      const now = Date.now();
      const newsDate = item.timestamp;
      if (selectedDateRange === 'today') {
        matchesDate = (now - newsDate) <= 86400000;
      } else if (selectedDateRange === 'week') {
        matchesDate = (now - newsDate) <= 86400000 * 7;
      }
    }

    return matchesSearch && matchesCategory && matchesDate;
  });

  return (
    <section className="py-10 px-1 sm:px-4">
      <div className="flex flex-col gap-6 mb-8">
        
        {/* Header and Search block */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-bold uppercase tracking-widest mb-1">
              <Sparkles className="w-4 h-4 animate-pulse" /> Live Analysis Ticker
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
              <Newspaper className="w-5 h-5 text-cyan-400" />
              Market News & Insights
            </h2>
          </div>
          
          {/* Neon Search Bar */}
          <div className="relative w-full md:w-72 group">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-500 group-focus-within:text-cyan-400 transition-colors">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Cari berita atau sinyal pasar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-slate-200 text-sm outline-none focus:ring-4 focus:ring-cyan-500/5 focus:border-cyan-500 transition-all shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-3 flex items-center text-slate-500 hover:text-rose-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Filters Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-900/60 p-4 rounded-3xl border border-slate-850">
          
          {/* Category Filter */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-[10px] font-mono font-black text-slate-500 uppercase tracking-widest">
              <Filter className="w-3.5 h-3.5" /> Filter Kategori
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    selectedCategory === cat 
                      ? 'bg-gradient-to-br from-cyan-500 to-indigo-600 text-slate-950 font-black shadow-lg shadow-cyan-500/10' 
                      : 'bg-slate-950 border border-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Timeframe Filter */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-[10px] font-mono font-black text-slate-500 uppercase tracking-widest">
              <Calendar className="w-3.5 h-3.5" /> Rentang Waktu
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {DATE_RANGES.map(range => (
                <button
                  key={range.value}
                  onClick={() => setSelectedDateRange(range.value)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    selectedDateRange === range.value 
                      ? 'bg-slate-100 text-slate-950 font-black shadow-lg shadow-white/15' 
                      : 'bg-slate-950 border border-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>

      {error ? (
        <div className="p-8 bg-slate-900/60 text-slate-400 rounded-[32px] text-center text-sm border-2 border-dashed border-slate-800">
          {error}
        </div>
      ) : news.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredNews.length > 0 ? (
            filteredNews.map((item, index) => (
              <div 
                key={index} 
                className="flex flex-col sm:flex-row gap-4 p-4 bg-slate-950 border border-slate-900/80 rounded-3xl sm:items-center hover:border-cyan-500/40 hover:shadow-xl hover:shadow-cyan-500/5 transition-all duration-300 relative overflow-hidden group"
              >
                {/* Visual indicators */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="flex items-center gap-4 flex-1">
                  <div className="relative shrink-0">
                    {item.image ? (
                      <img src={item.image} alt={item.title} className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover transition-transform group-hover:scale-105" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-14 h-14 sm:w-16 sm:h-16 bg-slate-900 flex items-center justify-center rounded-2xl border border-slate-800 shadow-inner">
                        <item.icon className="text-cyan-400 w-5 h-5 sm:w-6 sm:h-6"/>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 text-sm font-bold text-slate-200 pr-2">
                    <div className="line-clamp-2 leading-tight group-hover:text-cyan-400 transition-colors text-xs sm:text-sm">{item.title}</div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {item.categories.slice(0, 2).map((cat: string) => (
                        <span key={cat} className="text-[8px] font-black uppercase tracking-wider text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded">
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 pt-3 sm:pt-0 border-t border-slate-900/50 sm:border-0">
                  <div className="text-[10px] font-mono text-slate-500 uppercase tracking-tighter whitespace-nowrap">{item.time}</div>
                  <button className="text-[10px] bg-slate-900 hover:bg-cyan-500/10 text-slate-400 hover:text-cyan-400 border border-slate-850 font-black uppercase tracking-widest px-4 py-2 sm:px-3 sm:py-1.5 rounded-xl transition-all">
                    Read
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div 
              className="col-span-full p-12 bg-slate-900/50 rounded-[40px] text-center flex flex-col items-center gap-4 border-2 border-dashed border-slate-800"
            >
              <div className="p-4 bg-slate-950 rounded-full text-slate-600 border border-slate-900">
                <Search className="w-8 h-8" />
              </div>
              <div>
                <p className="font-extrabold text-white text-base">Tidak ada sinyal/berita ditemukan</p>
                <p className="text-xs font-semibold text-slate-500 mt-1 max-w-[240px] mx-auto leading-relaxed">
                  Kami tidak menemukan berita atau sinyal real-time yang cocok dengan filter kamu saat ini.
                </p>
              </div>
              <button 
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                  setSelectedDateRange('all');
                }}
                className="mt-2 text-xs font-black text-cyan-400 px-6 py-2.5 bg-cyan-500/10 rounded-xl border border-cyan-500/20 hover:bg-cyan-500/20 transition-all uppercase tracking-widest"
              >
                Reset Semua Filter
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-slate-900 rounded-3xl animate-pulse border border-slate-850" />
          ))}
        </div>
      )}
    </section>
  );
}
