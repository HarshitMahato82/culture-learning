import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info', duration?: number) => {
    const defaultDuration = type === 'error' ? 5000 : 3500;
    const finalDuration = duration || defaultDuration;

    setToasts((prev) => {
      // Duplicate handling: if exact same message and type exists, refresh it without adding a duplicate
      const existingIndex = prev.findIndex((t) => t.message === message && t.type === type);
      const newId = existingIndex >= 0 ? prev[existingIndex].id : Date.now().toString() + Math.random().toString(36).substring(2, 5);
      const newToast: ToastItem = { id: newId, type, message, duration: finalDuration };

      if (existingIndex >= 0) {
        const copy = [...prev];
        copy[existingIndex] = newToast;
        return copy;
      }
      return [...prev.slice(-3), newToast];
    });
  }, []);

  const showSuccess = useCallback((message: string, duration?: number) => {
    showToast(message, 'success', duration);
  }, [showToast]);

  const showError = useCallback((message: string, duration?: number) => {
    showToast(message, 'error', duration);
  }, [showToast]);

  const showInfo = useCallback((message: string, duration?: number) => {
    showToast(message, 'info', duration);
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError, showInfo, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Toast Container Component
const ToastContainer: React.FC<{ toasts: ToastItem[]; onRemove: (id: string) => void }> = ({ toasts, onRemove }) => {
  return (
    <div
      role="region"
      aria-label="Notifications"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-[100] flex flex-col gap-2 pointer-events-none max-w-md sm:max-w-sm w-auto mx-auto sm:mx-0"
    >
      <AnimatePresence mode="sync">
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onRemove={onRemove} />
        ))}
      </AnimatePresence>
    </div>
  );
};

const ToastCard: React.FC<{ toast: ToastItem; onRemove: (id: string) => void }> = ({ toast, onRemove }) => {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, toast.duration || 3500);
    return () => clearTimeout(timer);
  }, [toast, onRemove]);

  const getStyle = () => {
    switch (toast.type) {
      case 'success':
        return {
          bg: 'bg-slate-900/95 border-emerald-500/40 text-slate-100 shadow-emerald-500/10',
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
        };
      case 'error':
        return {
          bg: 'bg-slate-900/95 border-rose-500/40 text-slate-100 shadow-rose-500/10',
          icon: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />,
        };
      case 'info':
      default:
        return {
          bg: 'bg-slate-900/95 border-indigo-500/40 text-slate-100 shadow-indigo-500/10',
          icon: <Info className="w-5 h-5 text-indigo-400 shrink-0" />,
        };
    }
  };

  const style = getStyle();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 15, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      role="status"
      aria-live="polite"
      className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border backdrop-blur-xl shadow-2xl glass-card text-xs sm:text-sm font-semibold leading-snug ${style.bg}`}
    >
      <div className="flex items-center gap-3">
        {style.icon}
        <span className="text-slate-100">{toast.message}</span>
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        aria-label="Close notification"
        className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0 ml-1"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
};
