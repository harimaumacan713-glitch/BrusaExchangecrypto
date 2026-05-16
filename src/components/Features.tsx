import React, { useEffect, useState } from 'react';
import { Newspaper, TrendingUp, DollarSign, Search, X, Calendar, Filter } from 'lucide-react';
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
    fetch('/api/news')
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
    <section className="py-10 px-6">
      <div className="flex flex-col gap-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Newspaper className="w-5 h-5 text-cyan-500" />
            Market Insights
          </h2>
          
          {/* Search Bar */}
          <div className="relative w-full md:w-64 group">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none transition-colors group-focus-within:text-cyan-500">
              <Search className="w-4 h-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search news..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-100 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-cyan-500/5 focus:border-cyan-500 transition-all shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
            <div className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest min-w-fit">
              <Filter className="w-3 h-3" />
              Category:
            </div>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat 
                    ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20' 
                    : 'bg-white border border-gray-100 text-gray-500 hover:border-cyan-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
            <div className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest min-w-fit">
              <Calendar className="w-3 h-3" />
              Timeframe:
            </div>
            {DATE_RANGES.map(range => (
              <button
                key={range.value}
                onClick={() => setSelectedDateRange(range.value)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                  selectedDateRange === range.value 
                    ? 'bg-gray-800 text-white shadow-lg shadow-gray-800/20' 
                    : 'bg-white border border-gray-100 text-gray-500 hover:border-gray-200'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error ? (
        <div className="p-8 bg-white rounded-3xl text-center text-gray-500 text-sm border-2 border-dashed border-gray-100">
          {error}
        </div>
      ) : news.length > 0 ? (
        <div className="flex flex-col gap-4">
          {filteredNews.length > 0 ? (
            filteredNews.map((item, index) => (
              <div 
                key={index} 
                className="flex gap-4 p-4 bg-white rounded-3xl items-center border border-gray-50 hover:border-cyan-100 hover:shadow-xl hover:shadow-cyan-500/5 transition-all duration-300"
              >
                <div className="relative group">
                  {item.image ? (
                    <img src={item.image} alt={item.title} className="w-16 h-16 rounded-2xl object-cover transition-transform group-hover:scale-105" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-16 h-16 bg-blue-50 flex items-center justify-center rounded-2xl">
                      <item.icon className="text-blue-500 w-6 h-6"/>
                    </div>
                  )}
                </div>
                <div className="flex-1 text-sm font-bold text-gray-900 pr-4">
                  <div className="line-clamp-2 leading-tight group-hover:text-cyan-600 transition-colors">{item.title}</div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {item.categories.slice(0, 2).map((cat: string) => (
                      <span key={cat} className="text-[9px] font-black uppercase tracking-wider text-cyan-500 bg-cyan-50 px-2 py-0.5 rounded-md">
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-right flex flex-col justify-center gap-2">
                  <div className="text-[10px] font-black text-gray-300 uppercase tracking-tighter whitespace-nowrap">{item.time}</div>
                  <button className="text-[10px] bg-gray-50 hover:bg-cyan-50 text-gray-500 hover:text-cyan-600 font-black uppercase tracking-widest px-3 py-1.5 rounded-xl transition-all">
                    Read
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div 
              className="p-12 bg-white rounded-[40px] text-center flex flex-col items-center gap-4 border-2 border-dashed border-gray-100"
            >
              <div className="p-4 bg-gray-50 rounded-full text-gray-200">
                <Search className="w-8 h-8" />
              </div>
              <div>
                <p className="font-black text-gray-900">No signals found</p>
                <p className="text-xs font-medium text-gray-400 mt-1 max-w-[200px] mx-auto">
                  We couldn't find any news matching your current filters.
                </p>
              </div>
              <button 
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                  setSelectedDateRange('all');
                }}
                className="mt-2 text-xs font-black text-cyan-600 px-6 py-2.5 bg-cyan-50 rounded-full hover:bg-cyan-100 transition-all uppercase tracking-widest"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-gray-50 rounded-3xl animate-pulse" />
          ))}
        </div>
      )}
    </section>
  );
}

