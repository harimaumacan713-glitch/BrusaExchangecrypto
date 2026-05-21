import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { logErrorToServer } from '../lib/errorLogger';

export type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type: ToastType, contextSource?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType, contextSource?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto remove after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);

    // Auto-log to server if it is an error
    if (type === 'error') {
      logErrorToServer({
        message,
        source: contextSource || 'user-interface-toast',
      });
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Toast container */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => {
            const isError = toast.type === 'error';
            const isSuccess = toast.type === 'success';

            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                className="pointer-events-auto"
              >
                <div
                  className={`flex items-start gap-3.5 p-4 rounded-2xl border backdrop-blur-md shadow-2xl transition-all ${
                    isError
                      ? 'bg-rose-950/90 border-rose-500/35 text-rose-200'
                      : isSuccess
                      ? 'bg-emerald-950/90 border-emerald-500/35 text-emerald-250'
                      : 'bg-slate-900/95 border-slate-800/90 text-cyan-200'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {isError ? (
                      <AlertCircle className="w-5 h-5 text-rose-400" />
                    ) : isSuccess ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 animate-pulse" />
                    ) : (
                      <Info className="w-5 h-5 text-cyan-400" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <p className={`text-xs font-bold leading-relaxed ${
                      isError ? 'text-rose-250' : isSuccess ? 'text-emerald-250' : 'text-slate-200'
                    }`}>
                      {toast.message}
                    </p>
                  </div>

                  <button
                    onClick={() => removeToast(toast.id)}
                    className="shrink-0 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};
