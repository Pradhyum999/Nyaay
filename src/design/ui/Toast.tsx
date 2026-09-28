import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  message: string;
  type?: ToastType;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, duration?: number, action?: ToastItem['action']) => void;
  showSuccess: (message: string, duration?: number, action?: ToastItem['action']) => void;
  showError: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'success', duration = 4000, action?: ToastItem['action']) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, message, type, duration, action }]);
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const showSuccess = useCallback((message: string, duration = 4000, action?: ToastItem['action']) => {
    showToast(message, 'success', duration, action);
  }, [showToast]);

  const showError = useCallback((message: string, duration = 5000) => {
    showToast(message, 'error', duration);
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError }}>
      {children}
      <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-full max-w-sm px-4 pointer-events-none">
        <AnimatePresence>
          {toasts.map(t => {
            const isErr = t.type === 'error';
            const isWarn = t.type === 'warning';
            const isSuccess = t.type === 'success' || !t.type;

            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                className={`pointer-events-auto p-3.5 rounded-2xl border shadow-2xl backdrop-blur-xl flex items-center justify-between gap-3 ${
                  isErr
                    ? 'bg-red-950/90 border-red-500/40 text-red-200'
                    : isWarn
                    ? 'bg-amber-950/90 border-amber-500/40 text-amber-200'
                    : 'bg-neutral-900/90 border-white/[0.14] text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {isErr && <AlertCircle size={18} className="text-red-400 shrink-0" />}
                  {isWarn && <AlertTriangle size={18} className="text-amber-400 shrink-0" />}
                  {isSuccess && <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />}
                  <span className="text-xs font-semibold leading-tight">{t.message}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {t.action && (
                    <button
                      type="button"
                      onClick={() => {
                        t.action?.onClick();
                        removeToast(t.id);
                      }}
                      className="text-xs font-bold text-amber-400 hover:underline px-1.5 py-0.5 rounded bg-amber-400/10"
                    >
                      {t.action.label}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removeToast(t.id)}
                    className="p-1 rounded-full text-neutral-400 hover:text-white"
                  >
                    <X size={14} />
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
  if (!ctx) {
    return {
      showToast: (m: string) => console.log(m),
      showSuccess: (m: string) => console.log(m),
      showError: (m: string) => console.error(m),
    };
  }
  return ctx;
};
