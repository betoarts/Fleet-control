import React, { useState, useEffect, useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  duration?: number;
}

interface ToastNotificationProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

const toastStyles: Record<ToastType, { bg: string; border: string; icon: string; iconColor: string }> = {
  success: {
    bg: 'bg-green-500/20',
    border: 'border-green-500/40',
    icon: 'fa-check-circle',
    iconColor: 'text-green-400'
  },
  error: {
    bg: 'bg-red-500/20',
    border: 'border-red-500/40',
    icon: 'fa-times-circle',
    iconColor: 'text-red-400'
  },
  warning: {
    bg: 'bg-yellow-500/20',
    border: 'border-yellow-500/40',
    icon: 'fa-exclamation-triangle',
    iconColor: 'text-yellow-400'
  },
  info: {
    bg: 'bg-blue-500/20',
    border: 'border-blue-500/40',
    icon: 'fa-info-circle',
    iconColor: 'text-blue-400'
  }
};

const ToastItem: React.FC<{ toast: Toast; onDismiss: (id: string) => void }> = ({ toast, onDismiss }) => {
  const [isExiting, setIsExiting] = useState(false);
  const style = toastStyles[toast.type];
  const duration = toast.duration ?? 5000;

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsExiting(true);
        setTimeout(() => onDismiss(toast.id), 300);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [toast.id, duration, onDismiss]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => onDismiss(toast.id), 300);
  };

  return (
    <div
      className={`
        ${style.bg} ${style.border}
        backdrop-blur-xl border rounded-xl p-4 shadow-2xl
        transform transition-all duration-300 ease-out
        ${isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
        animate-slideIn
      `}
    >
      <div className="flex items-start gap-3">
        <div className={`${style.iconColor} text-xl mt-0.5`}>
          <i className={`fas ${style.icon}`}></i>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-white text-sm uppercase tracking-wide">{toast.title}</p>
          <p className="text-gray-300 text-sm mt-1">{toast.message}</p>
        </div>
        <button
          onClick={handleDismiss}
          className="text-gray-400 hover:text-white transition-colors p-1"
        >
          <i className="fas fa-times text-sm"></i>
        </button>
      </div>
    </div>
  );
};

export const ToastContainer: React.FC<ToastNotificationProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  );
};

// Toast hook for easy usage
export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback((title: string, message: string, duration?: number) => {
    return addToast({ type: 'success', title, message, duration });
  }, [addToast]);

  const error = useCallback((title: string, message: string, duration?: number) => {
    return addToast({ type: 'error', title, message, duration });
  }, [addToast]);

  const warning = useCallback((title: string, message: string, duration?: number) => {
    return addToast({ type: 'warning', title, message, duration });
  }, [addToast]);

  const info = useCallback((title: string, message: string, duration?: number) => {
    return addToast({ type: 'info', title, message, duration });
  }, [addToast]);

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
    ToastContainer: () => <ToastContainer toasts={toasts} onDismiss={removeToast} />
  };
}

// CSS for animations (add to index.css)
// @keyframes slideIn {
//   from { transform: translateX(100%); opacity: 0; }
//   to { transform: translateX(0); opacity: 1; }
// }
// .animate-slideIn { animation: slideIn 0.3s ease-out; }
