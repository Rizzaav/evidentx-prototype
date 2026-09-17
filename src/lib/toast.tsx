import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toast: {
    success: (message: string, duration?: number) => void;
    error: (message: string, duration?: number) => void;
    info: (message: string, duration?: number) => void;
  };
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (type: ToastType, message: string, duration = 3200) => {
      const id = 't_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      setToasts((prev) => [...prev.slice(-4), { id, type, message, duration }]);

      if (duration > 0) {
        setTimeout(() => {
          dismiss(id);
        }, duration);
      }
    },
    [dismiss]
  );

  const toast = {
    success: useCallback((msg: string, dur?: number) => addToast('success', msg, dur), [addToast]),
    error: useCallback((msg: string, dur?: number) => addToast('error', msg, dur), [addToast]),
    info: useCallback((msg: string, dur?: number) => addToast('info', msg, dur), [addToast]),
  };

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      {/* Toast Notification Container */}
      <div
        aria-live="polite"
        className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-2xl shadow-lift border transition-all duration-200 animate-slide-up ${
              t.type === 'success'
                ? 'bg-white dark:bg-[#161b22] text-ink-900 dark:text-[#f0f6fc] border-accent-200 dark:border-accent-800/60'
                : t.type === 'error'
                ? 'bg-white dark:bg-[#161b22] text-ink-900 dark:text-[#f0f6fc] border-rose-200 dark:border-rose-800/60'
                : 'bg-white dark:bg-[#161b22] text-ink-900 dark:text-[#f0f6fc] border-ink-200 dark:border-[#30363d]'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {t.type === 'success' ? (
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-xl bg-accent-50 dark:bg-accent-950/70 text-accent-600 dark:text-accent-400">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              ) : t.type === 'error' ? (
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400">
                  <AlertCircle className="h-4 w-4" />
                </div>
              ) : (
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-950/70 text-brand-600 dark:text-brand-400">
                  <Info className="h-4 w-4" />
                </div>
              )}
              <span className="text-xs font-semibold leading-snug break-words">{t.message}</span>
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className="p-1 rounded-lg text-ink-400 hover:text-ink-600 dark:hover:text-ink-200 transition flex-shrink-0"
              aria-label="Dismiss toast"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
