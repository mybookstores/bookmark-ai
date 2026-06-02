import React, { createContext, useContext, useState, useCallback } from 'react';
import { Check, X, AlertCircle, Loader2 } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'loading';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => string;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType>({
  toast: () => '',
  dismissToast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, type: ToastType = 'info') => {
      const id = `${Date.now()}-${Math.random()}`;
      setToasts((prev) => [...prev.filter((t) => !(t.type === 'loading' && type === 'loading')), { id, message, type }]);

      if (type !== 'loading') {
        setTimeout(() => {
          dismissToast(id);
        }, 2600);
      }

      return id;
    },
    [dismissToast]
  );

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <Check className="w-4.5 h-4.5 text-green-500" />;
      case 'error':
        return <X className="w-4.5 h-4.5 text-red-500" />;
      case 'loading':
        return <Loader2 className="w-4.5 h-4.5 text-primary-500 animate-spin" />;
      default:
        return <AlertCircle className="w-4.5 h-4.5 text-primary-500" />;
    }
  };

  const getBgColor = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'bg-green-50/95 dark:bg-green-900/35 border-green-200 dark:border-green-800';
      case 'error':
        return 'bg-red-50/95 dark:bg-red-900/35 border-red-200 dark:border-red-800';
      case 'loading':
        return 'bg-slate-50/95 dark:bg-slate-800/95 border-slate-200 dark:border-slate-700';
      default:
        return 'bg-primary-50/95 dark:bg-primary-900/35 border-primary-200 dark:border-primary-800';
    }
  };

  return (
    <ToastContext.Provider value={{ toast, dismissToast }}>
      {children}
      <div className="pointer-events-none fixed left-3 right-3 top-3 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-3 px-3.5 py-3 rounded-xl border shadow-lg glass animate-slide-in ${getBgColor(t.type)}`}
          >
            {getIcon(t.type)}
            <span className="flex-1 text-sm text-slate-700 dark:text-slate-300 leading-snug">{t.message}</span>
            {t.type !== 'loading' && (
              <button
                onClick={() => dismissToast(t.id)}
                className="p-1 hover:bg-slate-200/70 dark:hover:bg-slate-700 rounded"
              >
                <X className="w-3.5 h-3.5 text-slate-400" />
              </button>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
