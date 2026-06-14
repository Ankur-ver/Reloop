import { useState, useEffect, createContext, useContext, useCallback } from "react";
import { CheckCircle, XCircle, AlertCircle, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = "success") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const remove = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2" style={{ maxWidth: 340 }}>
        {toasts.map((t) => {
          const Icon = t.type === "success" ? CheckCircle : t.type === "error" ? XCircle : AlertCircle;
          const color = t.type === "success" ? "#22C55E" : t.type === "error" ? "#EF4444" : "#3B82F6";
          return (
            <div
              key={t.id}
              className="flex items-start gap-3 px-4 py-3 rounded-xl shadow-2xl"
              style={{
                background: "var(--color-bg-elevated, #1a2236)",
                border: `1px solid ${color}40`,
                color: "var(--color-text-primary, #fff)",
                animation: "slideInRight 0.25s ease",
              }}
            >
              <Icon size={18} style={{ color, flexShrink: 0, marginTop: 1 }} />
              <span className="text-sm flex-1">{t.message}</span>
              <button onClick={() => remove(t.id)} style={{ color: "var(--color-text-muted, #666)" }}>
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(120%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </ToastContext.Provider>
  );
}
