import React, { useEffect, useState } from 'react';
import { Newspaper, TrendingUp, DollarSign, Search, X } from 'lucide-react';

export function Features() {
  const [news, setNews] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetch('/api/news')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load news');
        return res.json();
      })
      .then(data => {
        if (data.results && Array.isArray(data.results) && data.results.length > 0) {
            setNews(data.results.slice(0, 5).map((item: any) => ({
                title: item.title,
                time: item.time,
                image: item.image,
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

  const filteredNews = news.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <section className="py-10 px-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h2 className="text-xl font-bold">Market News</h2>
        
        {/* Search Bar */}
        <div className="relative w-full md:w-64">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search news..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
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

      {error ? (
        <div className="p-4 bg-gray-50 rounded-2xl text-center text-gray-500 text-sm border border-gray-200">
          {error}
        </div>
      ) : news.length > 0 ? (
        <div className="flex flex-col gap-4">
          {filteredNews.length > 0 ? (
            filteredNews.map((item, index) => (
              <div key={index} className="flex gap-4 p-4 bg-white rounded-2xl items-center shadow-sm border border-gray-50 hover:border-cyan-100 hover:shadow-[0_0_15px_rgba(6,182,212,0.1)] transition-all duration-300">
                {item.image ? (
                  <img src={item.image} alt={item.title} className="w-12 h-12 rounded-xl object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="bg-blue-100 p-2 rounded-full"><item.icon className="text-blue-500 w-5 h-5"/></div>
                )}
                <div className="flex-1 text-sm font-medium">
                  <div className="line-clamp-2">{item.title}</div>
                  <button className="text-xs text-[#06b6d4] font-semibold mt-1">Read More</button>
                </div>
                <div className="text-xs text-gray-400 self-start mt-1 whitespace-nowrap">{item.time}</div>
              </div>
            ))
          ) : (
            <div className="p-8 bg-gray-50 rounded-2xl text-center flex flex-col items-center gap-3 border border-dashed border-gray-200">
              <div className="p-3 bg-white rounded-full shadow-sm text-gray-300">
                <Search className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">No results found</p>
                <p className="text-xs text-gray-500">Try adjusting your keywords for "{searchQuery}"</p>
              </div>
              <button 
                onClick={() => setSearchQuery('')}
                className="text-xs font-bold text-cyan-600 hover:underline"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="p-4 bg-gray-50 rounded-2xl text-center text-gray-500 text-sm border border-gray-200">
            Loading news...
        </div>
      )}
    </section>
  );
}
