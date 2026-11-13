import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

export type ActionStatus = "idle" | "loading" | "success" | "error";

type ActionButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  status?: ActionStatus;
  loadingLabel?: string;
  successLabel?: string;
  errorLabel?: string;
};

/**
 * Button with built-in idle → loading → success/error states. Labels are
 * stacked in one grid cell so the button keeps its width while the state
 * changes (no layout jump), and clicks are blocked while a request is in
 * flight or the success state is showing.
 */
export function ActionButton({
  status = "idle",
  loadingLabel = "Submitting…",
  successLabel = "Submitted",
  errorLabel = "Try again",
  className,
  children,
  disabled,
  type = "button",
  ...rest
}: ActionButtonProps) {
  const busy = status === "loading" || status === "success";

  return (
    <button
      type={type}
      data-status={status}
      aria-busy={status === "loading" || undefined}
      disabled={disabled || busy}
      className={cn(
        "cpc-btn cpc-btn-primary cpc-action-btn",
        status === "error" && "cpc-shake",
        className,
      )}
      {...rest}
    >
      <span className="inline-grid place-items-center">
        <span
          aria-hidden
          className="invisible col-start-1 row-start-1 inline-flex items-center justify-center gap-2 whitespace-nowrap"
        >
          {children}
        </span>
        <span
          aria-hidden
          className="invisible col-start-1 row-start-1 inline-flex items-center justify-center gap-2 whitespace-nowrap"
        >
          <Loader2 className="h-4 w-4" aria-hidden />
          {loadingLabel}
        </span>
        <span
          aria-hidden
          className="invisible col-start-1 row-start-1 inline-flex items-center justify-center gap-2 whitespace-nowrap"
        >
          <Check className="h-4 w-4" aria-hidden />
          {successLabel}
        </span>
        <span
          aria-hidden
          className="invisible col-start-1 row-start-1 inline-flex items-center justify-center gap-2 whitespace-nowrap"
        >
          <AlertCircle className="h-4 w-4" aria-hidden />
          {errorLabel}
        </span>

        <span
          aria-live="polite"
          className="col-start-1 row-start-1 inline-flex items-center justify-center gap-2 whitespace-nowrap"
        >
          {status === "loading" && (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              {loadingLabel}
            </>
          )}
          {status === "success" && (
            <>
              <Check className="h-4 w-4" aria-hidden />
              {successLabel}
            </>
          )}
          {status === "error" && (
            <>
              <AlertCircle className="h-4 w-4" aria-hidden />
              {errorLabel}
            </>
          )}
          {status === "idle" && children}
        </span>
      </span>
    </button>
  );
}

/**
 * Small state machine so callers do not repeat the idle → loading → result
 * timers. `succeed()` shows the check for ~1.5s before returning to idle.
 */
export function useActionStatus(resetMs = 1500) {
  const [status, setStatus] = useState<ActionStatus>("idle");
  const timer = useRef<number | null>(null);

  const clear = useCallback(() => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  useEffect(() => clear, [clear]);

  const start = useCallback(() => {
    clear();
    setStatus("loading");
  }, [clear]);

  const succeed = useCallback(() => {
    clear();
    setStatus("success");
    timer.current = window.setTimeout(() => setStatus("idle"), resetMs);
  }, [clear, resetMs]);

  const fail = useCallback(() => {
    clear();
    setStatus("error");
    timer.current = window.setTimeout(() => setStatus("idle"), 1400);
  }, [clear]);

  const reset = useCallback(() => {
    clear();
    setStatus("idle");
  }, [clear]);

  return { status, start, succeed, fail, reset };
}
