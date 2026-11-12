/* eslint-disable react-refresh/only-export-components -- provider + hook intentionally share a module */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { cn } from "@/lib/cn";

export type ToastTone = "success" | "error" | "info" | "warning";

/** Optional button rendered inside the toast (e.g. Undo on a signing action). */
export type ToastAction = {
  label: string;
  onClick: () => void;
  /** Defaults to the standard 4.2s; the clearance Undo flow asks for 8s. */
  durationMs?: number;
};

type ToastItem = {
  id: string;
  message: string;
  tone: ToastTone;
  action?: ToastAction;
};

type ToastContextValue = {
  toast: (message: string, tone?: ToastTone, action?: ToastAction) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const AUTO_DISMISS_MS = 4200;

const toneStyles: Record<ToastTone, string> = {
  success: "border-l-emerald-500 text-emerald-700",
  error: "border-l-rose-500 text-rose-700",
  warning: "border-l-amber-500 text-amber-700",
  info: "border-l-cpc-blue-accent text-cpc-blue-accent",
};

const toneIcons = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertCircle,
  info: Info,
} as const;

/** Small dependency-free toast system with an aria-live region. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef(new Map<string, number>());

  const dismiss = useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (timer !== undefined) {
      window.clearTimeout(timer);
      timers.current.delete(id);
    }
    setToasts((current) => current.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, tone: ToastTone = "success", action?: ToastAction) => {
      const id = crypto.randomUUID();
      setToasts((current) => [...current.slice(-2), { id, message, tone, action }]);
      const duration = action?.durationMs ?? AUTO_DISMISS_MS;
      const timer = window.setTimeout(() => dismiss(id), duration);
      timers.current.set(id, timer);
    },
    [dismiss],
  );

  useEffect(() => {
    const activeTimers = timers.current;
    return () => {
      activeTimers.forEach((timer) => window.clearTimeout(timer));
      activeTimers.clear();
    };
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 print:hidden sm:items-end sm:p-6"
      >
        {toasts.map((item) => {
          const Icon = toneIcons[item.tone];
          const action = item.action;
          return (
            <div
              key={item.id}
              className={cn(
                "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border border-cpc-input-border border-l-4 bg-white p-3 shadow-[0_12px_32px_rgba(27,47,158,0.18)]",
                toneStyles[item.tone],
              )}
            >
              <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <p className="flex-1 font-poppins text-sm leading-snug text-cpc-navy-text">
                {item.message}
              </p>
              {action && (
                <button
                  type="button"
                  onClick={() => {
                    dismiss(item.id);
                    action.onClick();
                  }}
                  className="shrink-0 cursor-pointer rounded-md px-2 py-1 font-poppins text-xs font-semibold text-cpc-blue-accent ring-1 ring-cpc-tile-border transition-colors hover:bg-cpc-section-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
                >
                  {action.label}
                </button>
              )}
              <button
                type="button"
                onClick={() => dismiss(item.id)}
                aria-label="Dismiss notification"
                className="rounded p-0.5 text-cpc-heading-soft transition-colors hover:text-cpc-navy-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
              >
                <X className="h-3.5 w-3.5" aria-hidden />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      toast: (message: string, tone?: ToastTone) => {
        if (typeof console !== "undefined") {
          console.warn(`[Toast fallback: ${tone ?? "info"}] ${message}`);
        }
      },
    };
  }
  return context;
}
