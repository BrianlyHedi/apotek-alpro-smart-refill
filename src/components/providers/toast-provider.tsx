"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from "lucide-react";

// --- Types ---
type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (type: ToastType, message: string) => void;
  removeToast: (id: string) => void;
}

// --- Context ---
const ToastContext = createContext<ToastContextValue | null>(null);

// --- Hook ---
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast harus digunakan di dalam ToastProvider");
  }
  return context;
}

// --- Provider ---
const TOAST_DURATION_MS = 4500;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (type: ToastType, message: string) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setToasts((prev) => [...prev, { id, type, message }]);

      // Auto-remove after duration
      setTimeout(() => removeToast(id), TOAST_DURATION_MS);
    },
    [removeToast]
  );

  const getToastIcon = (type: ToastType) => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-white shrink-0" />;
      case "error":
        return <XCircle className="h-5 w-5 text-white shrink-0" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-white shrink-0" />;
      case "info":
        return <Info className="h-5 w-5 text-white shrink-0" />;
    }
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      {/* Toast container — fixed z-[99999] agar SELALU di atas modal dialog / backdrop blur */}
      <div className="fixed right-4 top-4 z-[99999] flex flex-col gap-2 max-w-md pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto animate-in slide-in-from-top-2 fade-in flex items-center gap-3 rounded-xl px-4 py-3 shadow-2xl border border-white/20 backdrop-blur-md ${getToastStyles(
              toast.type
            )}`}
            role="alert"
          >
            {getToastIcon(toast.type)}
            <span className="text-xs font-semibold leading-snug flex-1">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-2 rounded-md p-1 opacity-80 hover:opacity-100 hover:bg-black/10 transition-colors"
              aria-label="Tutup notifikasi"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function getToastStyles(type: ToastType): string {
  const styles: Record<ToastType, string> = {
    success: "bg-emerald-600 text-white shadow-emerald-900/30",
    error: "bg-red-600 text-white shadow-red-900/30",
    warning: "bg-amber-600 text-white shadow-amber-900/30",
    info: "bg-blue-600 text-white shadow-blue-900/30",
  };
  return styles[type];
}
