import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Phone, Video, MoreVertical, Paperclip, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  timestamp: string;
}

export function ChatView({ isGroup = false }: { isGroup?: boolean }) {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: isGroup ? "Welcome to the Community Chat Room! Use /signals for latest alerts." : "Hello! I'm Aether Support. How can I assist you with your trade today?", sender: 'bot', timestamp: '14:20' },
  ]);
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg: Message = {
      id: Date.now(),
      text: inputText,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');

    // Mock bot response
    setTimeout(() => {
      const botMsg: Message = {
        id: Date.now() + 1,
        text: isGroup ? "New signal alert: BTC/USDT Long entry at 64,200." : "I've logged your request regarding the withdrawal. Our team will get back to you in 15 mins.",
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMsg]);
    }, 1000);
  };

  return (
    <div className="flex flex-col bg-white h-screen">
      {/* Header */}
      <div className="p-6 flex justify-between items-center bg-white border-b border-gray-50 shadow-sm z-10">
        <div className="flex gap-4 items-center">
            <div className={`p-3 rounded-2xl ${isGroup ? 'bg-purple-100' : 'bg-cyan-100'}`}>
                {isGroup ? <MessageSquare className="w-5 h-5 text-purple-600" /> : <Bot className="w-5 h-5 text-cyan-600" />}
            </div>
            <div>
                <h3 className="font-black text-gray-900 tracking-tight">{isGroup ? 'Global Traders' : 'Elite Support'}</h3>
                <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{isGroup ? '4,281 Online' : 'Agent Online'}</span>
                </div>
            </div>
        </div>
        <div className="flex gap-3 text-gray-400">
            <Phone className="w-5 h-5 hover:text-gray-900 cursor-pointer transition-colors" />
            <Video className="w-5 h-5 hover:text-gray-900 cursor-pointer transition-colors" />
            <MoreVertical className="w-5 h-5 hover:text-gray-900 cursor-pointer transition-colors" />
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-none bg-[#FDFDFD]">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex gap-3 max-w-[85%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${msg.sender === 'user' ? 'bg-gray-200' : 'bg-cyan-600'}`}>
                   {msg.sender === 'user' ? <User className="w-4 h-4 text-gray-600" /> : <Bot className="w-4 h-4 text-white" />}
                </div>
                <div className="space-y-1">
                    <div className={`px-5 py-3 rounded-3xl text-sm font-medium leading-relaxed ${
                        msg.sender === 'user' 
                          ? 'bg-gradient-to-br from-gray-800 to-black text-white rounded-tr-none' 
                          : 'bg-white border border-gray-100 text-gray-800 shadow-sm rounded-tl-none'
                    }`}>
                        {msg.text}
                    </div>
                    <div className={`text-[10px] font-bold text-gray-400 uppercase tracking-widest ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                        {msg.timestamp}
                    </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Input */}
      <div className="p-6 bg-white border-t border-gray-50 pb-32">
        <form onSubmit={handleSend} className="relative flex items-center gap-3">
          <div className="relative flex-1 group">
             <div className="absolute left-4 inset-y-0 flex items-center text-gray-300">
                <Paperclip className="w-5 h-5" />
             </div>
             <input 
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type your message..."
                className="w-full pl-12 pr-6 py-4 bg-gray-50 border-2 border-transparent rounded-[24px] text-sm font-medium outline-none focus:border-cyan-500 focus:bg-white transition-all"
             />
          </div>
          <button 
            type="submit"
            className="p-4 bg-cyan-600 text-white rounded-[20px] shadow-xl shadow-cyan-600/20 hover:scale-105 active:scale-95 transition-all"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
