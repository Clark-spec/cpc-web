/**
 * Shared student feedback entry points.
 *
 * UI components register the actual dispatchers (one provider in the app
 * shell, one success-modal host). Service and page code can then call
 * `showToast` / `showSuccess` / `showApiError` without importing the React
 * tree, which keeps a single toast surface for the whole portal.
 */
export type ToastTone = "success" | "error" | "info" | "warning";

export type ToastAction = {
  label: string;
  onClick: () => void;
  /** Optional per-action lifetime; ignored when the toast sets its own. */
  durationMs?: number;
};

export type ShowToastOptions = {
  type?: ToastTone;
  title?: string;
  message?: string;
  /** Milliseconds. `0` keeps the toast until the student dismisses it. */
  duration?: number;
  action?: ToastAction;
};

export type SuccessModalOptions = {
  title: string;
  message?: string;
  /** Human-facing reference, e.g. SR-2026-000123. */
  reference?: string;
  /** Secondary line under the reference (status, date, office…). */
  meta?: string;
  primaryAction?: { label: string; onClick: () => void };
  secondaryLabel?: string;
  /** Adds a short sparkle burst for major confirmations. */
  celebrate?: boolean;
};

type ToastDispatcher = (options: ShowToastOptions) => void;
type SuccessModalDispatcher = (options: SuccessModalOptions) => void;
type ToastClearer = () => void;

const toastStack: ToastDispatcher[] = [];
let successModalDispatcher: SuccessModalDispatcher | null = null;
let toastClearer: ToastClearer | null = null;

/** Called by the mounted ToastProvider. Returns an unregister function. */
export function registerToastDispatcher(dispatcher: ToastDispatcher) {
  toastStack.push(dispatcher);
  return () => {
    const index = toastStack.lastIndexOf(dispatcher);
    if (index >= 0) toastStack.splice(index, 1);
  };
}

/** Called by the mounted success-modal host. Returns an unregister function. */
export function registerSuccessModalDispatcher(dispatcher: SuccessModalDispatcher) {
  successModalDispatcher = dispatcher;
  return () => {
    if (successModalDispatcher === dispatcher) successModalDispatcher = null;
  };
}

/** Called by the mounted ToastProvider. Returns an unregister function. */
export function registerToastClearer(clearer: ToastClearer) {
  toastClearer = clearer;
  return () => {
    if (toastClearer === clearer) toastClearer = null;
  };
}

/** Dismiss every visible toast (e.g. a stale error before a success modal). */
export function clearToasts() {
  toastClearer?.();
}

export function showToast(options: ShowToastOptions) {
  const dispatcher = toastStack[toastStack.length - 1];
  if (!dispatcher) {
    if (import.meta.env.DEV) {
      console.warn(`[toast:${options.type ?? "info"}] ${options.title ?? ""} ${options.message ?? ""}`);
    }
    return;
  }
  dispatcher(options);
}

export function showSuccess(title: string, message?: string, extra?: Partial<ShowToastOptions>) {
  showToast({ type: "success", title, message, ...extra });
}

export function showError(title: string, message?: string, extra?: Partial<ShowToastOptions>) {
  showToast({ type: "error", title, message, duration: 7000, ...extra });
}

export function showWarning(title: string, message?: string, extra?: Partial<ShowToastOptions>) {
  showToast({ type: "warning", title, message, duration: 6000, ...extra });
}

export function showInfo(title: string, message?: string, extra?: Partial<ShowToastOptions>) {
  showToast({ type: "info", title, message, ...extra });
}

export function showSuccessModal(options: SuccessModalOptions) {
  // A stale "could not submit" toast must not sit next to the success modal.
  clearToasts();
  successModalDispatcher?.(options);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ErrorLike = { status?: number | null; message?: string; retryAfter?: number; fieldErrors?: Record<string, string> };

function asErrorLike(error: unknown): ErrorLike {
  if (error && typeof error === "object") return error as ErrorLike;
  return {};
}

export type DescribedError = {
  title: string;
  message: string;
  retryAfter?: number;
  fieldErrors?: Record<string, string>;
  sessionExpired?: boolean;
};

/** Maps a normalized API error to friendly, student-facing copy. */
export function describeApiError(error: unknown): DescribedError {
  const { status, message, retryAfter, fieldErrors } = asErrorLike(error);
  const firstField = fieldErrors ? Object.values(fieldErrors)[0] : undefined;

  if (status === 401) {
    return {
      title: "Session expired",
      message: "Please sign in again to continue.",
      sessionExpired: true,
    };
  }
  if (status === 403) {
    return { title: "Access denied", message: message || "You do not have access to this action." };
  }
  if (status === 404) {
    return { title: "Not found", message: message || "We could not find that record." };
  }
  if (status === 409) {
    return { title: "Already updated", message: message || "This record changed while you were working. Please refresh." };
  }
  if (status === 413) {
    return { title: "File too large", message: message || "Please choose a smaller file and try again." };
  }
  if (status === 429) {
    return {
      title: "Please wait",
      message: message || "You have reached a limit. Please try again later.",
      retryAfter,
    };
  }
  if (status && status >= 500) {
    return {
      title: "Service unavailable",
      message: "We could not reach the server just now. Your details are still here — please try again.",
    };
  }
  if (!status) {
    return {
      title: "Connection problem",
      message: message || "Check your internet connection and try again.",
    };
  }
  return {
    title: "Could not complete",
    message: message || firstField || "Please check your details and try again.",
    fieldErrors,
  };
}

/** Shows the mapped error toast and returns the mapping for inline handling. */
export function showApiError(error: unknown, title?: string): DescribedError {
  const described = describeApiError(error);
  showToast({
    type: "error",
    title: title ?? described.title,
    message: described.message,
    duration: described.sessionExpired ? 0 : 7000,
  });
  return described;
}
