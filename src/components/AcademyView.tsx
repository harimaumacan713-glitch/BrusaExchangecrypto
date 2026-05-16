import React from 'react';
import { BookOpen, Play, ChevronRight, Clock, Star } from 'lucide-react';
import { motion } from 'motion/react';

const lessons = [
  {
    id: 1,
    title: 'Introduction to Blockchain',
    description: 'Learn the fundamentals of how blockchain technology works and why it is revolucionary.',
    duration: '15 mins',
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=200&fit=crop'
  },
  {
    id: 2,
    title: 'Crypto Trading Basics',
    description: 'A beginner-friendly guide to understanding market indicators, order types, and charts.',
    duration: '25 mins',
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1611974714658-66d2c130094e?w=400&h=200&fit=crop'
  },
  {
    id: 3,
    title: 'DeFi & Smart Contracts',
    description: 'Explore the world of Decentralized Finance and how self-executing contracts are changing the game.',
    duration: '20 mins',
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1622790698141-94e30457ef12?w=400&h=200&fit=crop'
  }
];

export function AcademyView() {
  return (
    <div className="p-6 pb-24 space-y-8 bg-gray-50 min-h-screen">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-black tracking-tight text-gray-900">Aether Academy</h2>
        <p className="text-gray-500 text-sm">Master the craft of crypto trading and technology.</p>
      </div>

      <div className="grid gap-6">
        {lessons.map((lesson, index) => (
          <motion.div 
            key={lesson.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl transition-all group"
          >
            <div className="relative h-40">
              <img src={lesson.image} alt={lesson.title} className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-700" />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-white/90 p-4 rounded-full shadow-2xl">
                  <Play className="w-6 h-6 text-cyan-600 fill-cyan-600" />
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg text-gray-900 leading-tight group-hover:text-cyan-600 transition-colors">{lesson.title}</h3>
                <div className="flex items-center gap-1 text-xs font-black text-amber-500">
                   <Star className="w-3 h-3 fill-amber-500" />
                   {lesson.rating}
                </div>
              </div>
              <p className="text-xs text-gray-500 line-clamp-2 mb-4 leading-relaxed">{lesson.description}</p>
              <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
                <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <Clock className="w-3 h-3" />
                  {lesson.duration}
                </div>
                <button className="flex items-center gap-1 text-xs font-black text-cyan-600 uppercase tracking-widest hover:translate-x-1 transition-transform">
                  Start Learning
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-cyan-600 rounded-[32px] p-8 text-white relative overflow-hidden shadow-2xl shadow-cyan-600/20">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
        <div className="relative z-10 text-center space-y-4">
           <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
           <h3 className="text-xl font-black tracking-tight">Become a Pro Trader</h3>
           <p className="text-cyan-100 text-sm">Join our newsletter to get weekly insights and premium trading signals.</p>
           <button className="w-full bg-white text-cyan-600 font-bold py-4 rounded-2xl shadow-xl hover:bg-cyan-50 transition-colors">
             Join Community
           </button>
        </div>
      </div>
    </div>
  );
}
