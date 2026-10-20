import React, { useEffect } from 'react';

export interface ToastMessage {
  id: string;
  title: string;
  subtitle?: string;
  icon?: string;
  color?: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed top-20 right-4 left-4 sm:left-auto sm:w-96 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={() => onDismiss(toast.id)} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: () => void }> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 4500);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="pointer-events-auto w-full bg-surface-container-lowest border border-outline-variant/60 rounded-xl p-3.5 shadow-pill flex items-start gap-3 fade-in">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-white"
        style={{ backgroundColor: toast.color || '#C25E00' }}
      >
        <span className="material-symbols-outlined text-[18px]">{toast.icon || 'check'}</span>
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-xs font-semibold text-on-surface leading-tight">{toast.title}</h4>
        {toast.subtitle && (
          <p className="text-[11px] text-on-surface-variant font-sans mt-0.5 leading-snug line-clamp-2">
            {toast.subtitle}
          </p>
        )}
      </div>
      <button
        onClick={onDismiss}
        className="text-outline hover:text-on-surface p-1 rounded-full transition-colors"
      >
        <span className="material-symbols-outlined text-[16px]">close</span>
      </button>
    </div>
  );
};
