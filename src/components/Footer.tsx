import React from 'react';

export function Footer() {
  return (
    <footer className="py-20 px-6 border-t border-gray-100 text-center text-gray-400 bg-white md:rounded-b-[48px]">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="flex flex-col items-center gap-6">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Licensed & Regulated by</p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            
            {/* Bappebti */}
            <div className="flex flex-col items-center gap-2 group cursor-pointer">
              <div className="flex items-center gap-2 grayscale group-hover:grayscale-0 opacity-40 group-hover:opacity-100 transition-all duration-500">
                <svg viewBox="0 0 100 100" className="h-6 w-6" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10,50 C10,10 90,10 90,50 C90,90 10,90 10,50Z" stroke="#0e519c" strokeWidth="4"/>
                  <path d="M30,50 C30,20 70,20 70,50 C70,80 30,80 30,50Z" stroke="#7cbd43" strokeWidth="4"/>
                  <path d="M20,50 L80,50" stroke="#0e519c" strokeWidth="4"/>
                  <path d="M50,20 L50,80" stroke="#0e519c" strokeWidth="4"/>
                </svg>
                <span className="font-[900] text-[16px] text-gray-900 tracking-tight leading-none">Bappebti</span>
              </div>
              <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest group-hover:text-cyan-600 transition-colors">Regulated</p>
            </div>
            
            <div className="hidden md:block w-[1px] h-10 bg-gray-100"></div>
            
            {/* CFX */}
            <div className="flex flex-col items-center gap-2 group cursor-pointer text-center">
              <div className="flex items-center grayscale group-hover:grayscale-0 opacity-40 group-hover:opacity-100 transition-all duration-500">
                <span className="font-black text-[24px] text-gray-900 tracking-tighter leading-none">CFX</span>
              </div>
              <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest group-hover:text-purple-600 transition-colors">Exchanger</p>
            </div>
            
            <div className="hidden md:block w-[1px] h-10 bg-gray-100"></div>

            {/* J.P.Morgan */}
            <div className="flex flex-col items-center gap-2 group cursor-pointer text-center">
              <div className="flex items-center grayscale group-hover:grayscale-0 opacity-40 group-hover:opacity-100 transition-all duration-500 h-6">
                <span className="font-serif font-bold text-[18px] text-gray-900 tracking-tight leading-none">J.P.Morgan</span>
              </div>
              <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest group-hover:text-blue-600 transition-colors">Bank Partner</p>
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-12 border-t border-gray-50">
          <p className="text-xs font-bold text-gray-900">Aether Crypto Exchange Global</p>
          <div className="flex justify-center gap-6 text-[10px] font-bold uppercase tracking-widest">
            <a href="#" className="hover:text-cyan-500 transition-colors">About</a>
            <a href="#" className="hover:text-cyan-500 transition-colors">Terms</a>
            <a href="#" className="hover:text-cyan-500 transition-colors">Privacy</a>
            <a href="#" className="hover:text-cyan-500 transition-colors">Contact</a>
          </div>
          <p className="text-[10px] mt-8">&copy; 2026 Aether Crypto Exchange. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
