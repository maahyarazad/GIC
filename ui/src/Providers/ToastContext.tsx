import React, { createContext, useContext, useState, useCallback } from "react";

type ToastType = "success" | "error" | "info" | "warning";

export default interface ToastOptions {
  type?: ToastType;
  message: string;
  duration?: number; // ms
}

interface ToastItem extends ToastOptions {
  id: number;
}

interface ToastContextType {
  show: (options: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const show = useCallback((options: ToastOptions) => {
    
    const id = Date.now();
    const newToast: ToastItem = {
      id,
      type: options.type || "info",
      message: options.message,
      duration: options.duration || 5000,
      
    };

    setToasts(prev => [...prev, newToast]);

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, newToast.duration);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}

      <div className="app-toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`app-toast app-toast-${toast.type}`}>
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
};
