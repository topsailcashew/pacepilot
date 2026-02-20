import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { Toast } from '@/types';

const ICONS: Record<Toast['type'], React.ReactNode> = {
  success: <CheckCircle size={16} className="text-green-400 shrink-0" />,
  error: <AlertCircle size={16} className="text-red-400 shrink-0" />,
  info: <Info size={16} className="text-blue-400 shrink-0" />,
};

const BORDER_COLORS: Record<Toast['type'], string> = {
  success: 'border-green-500/30',
  error: 'border-red-500/30',
  info: 'border-blue-500/30',
};

/** Auto-dismissing toast notification */
const ToastItem: React.FC<{ toast: Toast }> = ({ toast }) => {
  const removeToast = useAppStore((s) => s.removeToast);

  useEffect(() => {
    const timer = setTimeout(() => removeToast(toast.id), 4000);
    return () => clearTimeout(timer);
  }, [toast.id, removeToast]);

  return (
    <div
      className={`flex items-start gap-3 bg-prussianblue border ${BORDER_COLORS[toast.type]} rounded-xl p-4 shadow-2xl animate-in slide-in-from-right-4 duration-300 max-w-xs w-full`}
    >
      {ICONS[toast.type]}
      <p className="text-[11px] font-bold text-white/80 flex-1 leading-relaxed">
        {toast.message}
      </p>
      <button
        onClick={() => removeToast(toast.id)}
        aria-label="Dismiss notification"
        className="text-white/20 hover:text-white transition-colors shrink-0"
      >
        <X size={14} />
      </button>
    </div>
  );
};

/**
 * Fixed toast container rendered at the bottom-right of the viewport.
 * Reads toasts from the global Zustand store.
 */
export const ToastContainer: React.FC = () => {
  const toasts = useAppStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-3 items-end">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
};
