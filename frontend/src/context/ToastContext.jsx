import React, { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

let idCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message, type = 'info') => {
      const id = idCounter++;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => removeToast(id), 5000);
    },
    [removeToast]
  );

  const icons = {
    success: <CheckCircle2 className="h-5 w-5 text-emerald-600" />,
    error: <XCircle className="h-5 w-5 text-red-600" />,
    info: <Info className="h-5 w-5 text-primary" />,
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full">
        {toasts.map((t) => (
          <div key={t.id} className="card flex items-start gap-3 p-4 animate-in fade-in slide-in-from-bottom-2">
            {icons[t.type]}
            <p className="text-sm text-ink flex-1">{t.message}</p>
            <button onClick={() => removeToast(t.id)} className="text-slate-400 hover:text-slate-600 focus-ring rounded">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
