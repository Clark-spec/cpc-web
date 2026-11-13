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
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  registerToastClearer,
  registerToastDispatcher,
  type ShowToastOptions,
  type ToastAction,
  type ToastTone,
} from "@/lib/feedback";

export type { ToastAction, ToastTone };

type ToastItem = {
  id: string;
  type: ToastTone;
  title?: string;
  message: string;
  action?: ToastAction;
  duration: number;
  paused: boolean;
  leaving: boolean;
};

type ToastContextValue = {
  toast: (message: string, tone?: ToastTone, action?: ToastAction) => void;
  showToast: (options: ShowToastOptions) => void;
  dismissToast: (id: string) => void;
  dismissAll: () => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION: Record<ToastTone, number> = {
  success: 4600,
  info: 5000,
  warning: 6000,
  error: 7200,
};

const EXIT_MS = 200;
const MAX_VISIBLE = 3;

const toneCard: Record<ToastTone, string> = {
  success: "border-[#C4EBD9]",
  error: "border-[#F8CBCB]",
  warning: "border-[#F6DEB4]",
  info: "border-[#CFE0FF]",
};

const toneIconWrap: Record<ToastTone, string> = {
  success: "bg-[#E3F7EE] text-[#1E8A57]",
  error: "bg-[#FDECEC] text-[#C53030]",
  warning: "bg-[#FEF4E2] text-[#B7791F]",
  info: "bg-[#E8F1FF] text-[#2F5FD0]",
};

const toneProgress: Record<ToastTone, string> = {
  success: "bg-[#1E8A57]",
  error: "bg-[#C53030]",
  warning: "bg-[#B7791F]",
  info: "bg-[#2F5FD0]",
};

const toneIcon = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
} as const;

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

type ToastProviderProps = {
  children: ReactNode;
  /** Student feedback sits below the sticky header; admin keeps the footer. */
  position?: "top" | "bottom";
};

/** Shared toast surface: one per app shell, driven by `showToast` helpers. */
export function ToastProvider({ children, position = "bottom" }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [headerOffset, setHeaderOffset] = useState(12);

  const timers = useRef(new Map<string, number>());
  const remaining = useRef(new Map<string, number>());
  const startedAt = useRef(new Map<string, number>());
  const paused = useRef(new Set<string>());
  const swipeStartY = useRef<number | null>(null);

  const isTop = position === "top";

  const measureHeader = useCallback(() => {
    if (!isTop) return;
    const header = document.querySelector("header");
    setHeaderOffset(
      header ? Math.max(8, Math.round(header.getBoundingClientRect().bottom) + 8) : 12,
    );
  }, [isTop]);

  const clearTimer = useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (timer !== undefined) {
      window.clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const remove = useCallback(
    (id: string) => {
      clearTimer(id);
      remaining.current.delete(id);
      startedAt.current.delete(id);
      paused.current.delete(id);
      setToasts((current) => current.filter((item) => item.id !== id));
    },
    [clearTimer],
  );

  const beginClose = useCallback(
    (id: string) => {
      clearTimer(id);
      setToasts((current) =>
        current.map((item) => (item.id === id ? { ...item, leaving: true } : item)),
      );
      const wait = prefersReducedMotion() ? 0 : EXIT_MS;
      window.setTimeout(() => remove(id), wait);
    },
    [clearTimer, remove],
  );

  const schedule = useCallback(
    (id: string) => {
      const ms = remaining.current.get(id);
      if (!ms || ms <= 0) return;
      startedAt.current.set(id, Date.now());
      const timer = window.setTimeout(() => beginClose(id), ms);
      timers.current.set(id, timer);
    },
    [beginClose],
  );

  const pause = useCallback((id: string) => {
    if (paused.current.has(id)) return;
    paused.current.add(id);
    const timer = timers.current.get(id);
    if (timer !== undefined) {
      window.clearTimeout(timer);
      timers.current.delete(id);
    }
    const left = remaining.current.get(id);
    const started = startedAt.current.get(id);
    if (left !== undefined && started !== undefined) {
      remaining.current.set(id, Math.max(400, left - (Date.now() - started)));
    }
    setToasts((current) =>
      current.map((item) => (item.id === id ? { ...item, paused: true } : item)),
    );
  }, []);

  const resume = useCallback(
    (id: string) => {
      if (!paused.current.has(id)) return;
      paused.current.delete(id);
      setToasts((current) =>
        current.map((item) => (item.id === id ? { ...item, paused: false } : item)),
      );
      schedule(id);
    },
    [schedule],
  );

  const showToast = useCallback(
    (options: ShowToastOptions) => {
      const type: ToastTone = options.type ?? "success";
      const duration =
        options.duration ?? options.action?.durationMs ?? DEFAULT_DURATION[type];
      const id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;

      const item: ToastItem = {
        id,
        type,
        title: options.title,
        message: options.message ?? "",
        action: options.action,
        duration,
        paused: false,
        leaving: false,
      };

      remaining.current.set(id, duration);
      startedAt.current.set(id, Date.now());
      measureHeader();
      setToasts((current) => [...current.slice(-(MAX_VISIBLE - 1)), item]);
      if (duration > 0) schedule(id);
    },
    [measureHeader, schedule],
  );

  const dismissToast = useCallback((id: string) => beginClose(id), [beginClose]);

  const dismissAll = useCallback(() => {
    setToasts((current) => {
      current.forEach((item) => clearTimer(item.id));
      return [];
    });
  }, [clearTimer]);

  const legacyToast = useCallback(
    (message: string, tone: ToastTone = "success", action?: ToastAction) => {
      showToast({ type: tone, message, action });
    },
    [showToast],
  );

  useEffect(() => registerToastDispatcher(showToast), [showToast]);
  useEffect(() => registerToastClearer(dismissAll), [dismissAll]);

  useEffect(() => {
    if (!isTop) return;
    measureHeader();
    const header = document.querySelector("header");
    const resizeObserver = new ResizeObserver(measureHeader);
    if (header) resizeObserver.observe(header);
    const mutationObserver = new MutationObserver(measureHeader);
    mutationObserver.observe(document.body, { childList: true });
    window.addEventListener("resize", measureHeader);
    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener("resize", measureHeader);
    };
  }, [isTop, measureHeader]);

  useEffect(() => {
    const activeTimers = timers.current;
    return () => {
      activeTimers.forEach((timer) => window.clearTimeout(timer));
      activeTimers.clear();
    };
  }, []);

  useEffect(() => {
    if (toasts.length === 0) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      const newest = toasts[toasts.length - 1];
      if (newest) beginClose(newest.id);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toasts, beginClose]);

  const value = useMemo(
    () => ({ toast: legacyToast, showToast, dismissToast, dismissAll }),
    [legacyToast, showToast, dismissToast, dismissAll],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        style={
          isTop
            ? { top: `calc(env(safe-area-inset-top, 0px) + ${headerOffset}px)` }
            : undefined
        }
        className={cn(
          "pointer-events-none fixed inset-x-0 z-[70] flex flex-col gap-2 px-3 print:hidden sm:px-4",
          isTop ? "items-center" : "bottom-0 items-center sm:items-end sm:p-6",
        )}
      >
        {toasts.map((item) => {
          const Icon = toneIcon[item.type];
          const action = item.action;
          return (
            <div
              key={item.id}
              role={item.type === "error" ? "alert" : "status"}
              onPointerEnter={() => pause(item.id)}
              onPointerLeave={() => resume(item.id)}
              onTouchStart={(event) => {
                swipeStartY.current = event.touches[0]?.clientY ?? null;
                pause(item.id);
              }}
              onTouchMove={(event) => {
                const start = swipeStartY.current;
                const current = event.touches[0]?.clientY;
                if (start !== null && current !== undefined && start - current > 28) {
                  swipeStartY.current = null;
                  beginClose(item.id);
                }
              }}
              onTouchEnd={() => {
                swipeStartY.current = null;
                resume(item.id);
              }}
              style={{ animationDuration: `${prefersReducedMotion() ? 0 : 260}ms` }}
              className={cn(
                "cpc-toast pointer-events-auto relative w-full max-w-[26rem] overflow-hidden rounded-xl border bg-white shadow-[0_16px_40px_rgba(15,36,104,0.16)]",
                toneCard[item.type],
                item.leaving && "cpc-toast-leaving",
              )}
            >
              <div className="flex items-start gap-3 p-3.5">
                <span
                  className={cn(
                    "mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full",
                    toneIconWrap[item.type],
                  )}
                  aria-hidden
                >
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  {item.title && (
                    <p className="font-poppins text-sm leading-snug font-semibold text-cpc-navy-text">
                      {item.title}
                    </p>
                  )}
                  {item.message && (
                    <p
                      className={cn(
                        "font-poppins text-[13px] leading-snug break-words",
                        item.title ? "mt-0.5 text-cpc-muted-blue" : "text-cpc-navy-text",
                      )}
                    >
                      {item.message}
                    </p>
                  )}
                  {action && (
                    <button
                      type="button"
                      onClick={() => {
                        beginClose(item.id);
                        action.onClick();
                      }}
                      className="mt-1.5 cursor-pointer rounded-md font-poppins text-xs font-semibold text-cpc-blue-accent underline-offset-2 transition-colors hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
                    >
                      {action.label}
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => beginClose(item.id)}
                  aria-label="Dismiss notification"
                  className="-mt-1 -mr-1 grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-md text-cpc-heading-soft transition-colors hover:bg-cpc-section-light hover:text-cpc-navy-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
                >
                  <X className="h-3.5 w-3.5" aria-hidden />
                </button>
              </div>
              {item.duration > 0 && (
                <span
                  aria-hidden
                  className={cn(
                    "cpc-toast-progress absolute inset-x-0 bottom-0 h-0.5 origin-left",
                    toneProgress[item.type],
                  )}
                  style={{
                    animationDuration: `${item.duration}ms`,
                    animationPlayState: item.paused ? "paused" : "running",
                  }}
                />
              )}
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
    const fallback = (options: ShowToastOptions) => {
      if (typeof console !== "undefined") {
        console.warn(`[Toast fallback: ${options.type ?? "info"}] ${options.message ?? ""}`);
      }
    };
    return {
      toast: (message: string, tone?: ToastTone) => fallback({ type: tone, message }),
      showToast: fallback,
      dismissToast: () => undefined,
      dismissAll: () => undefined,
    };
  }
  return context;
}
