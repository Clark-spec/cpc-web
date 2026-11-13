import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { navigate } from "@/lib/router";
import { showApiError, showToast } from "@/lib/feedback";

declare module "axios" {
  export interface AxiosRequestConfig {
    /** Skip the one-shot silent refresh (used by login and admin bridges). */
    skipAuthRefresh?: boolean;
    /**
     * Opt-in: show the shared error toast automatically when this request
     * fails. Pass a title, or `false`/omit for no automatic feedback.
     */
    notifyOnError?: string | false;
  }
}

/**
 * Shared HTTP client for the CPC API.
 *
 * Base URL comes from `VITE_API_BASE_URL` (see `.env.example`). The access
 * token is read from sessionStorage and sent as a Bearer token on every
 * request so the backend can scope records to the authenticated student.
 *
 * Token refresh: on a 401 response the client silently calls the refresh
 * endpoint (which uses the HttpOnly refreshToken cookie), updates the stored
 * access token, and retries the original request exactly once.
 */
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "/api").replace(/\/+$/, "");

export class ApiError extends Error {
  status: number | null;
  fieldErrors: Record<string, string>;
  /** Seconds the caller should wait before retrying (429 responses). */
  retryAfter?: number;

  constructor(
    message: string,
    status: number | null = null,
    fieldErrors: Record<string, string> = {},
    retryAfter?: number,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
    this.retryAfter = retryAfter;
  }
}

/**
 * Requests that bring their own bearer (the admin demo bridge) opt out of the
 * shared 401 refresh flow, which would otherwise overwrite the student session.
 */
export type NoRefreshConfig = { skipAuthRefresh?: boolean };

export function readAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    // Primary storage key used by the auth service.
    const direct =
      sessionStorage.getItem("cpc_access_token") ?? localStorage.getItem("cpc_access_token");
    if (direct) return direct;

    // Fall back to the session user object in case login stores the token there.
    const rawUser = sessionStorage.getItem("cpc_user");
    if (rawUser) {
      const user = JSON.parse(rawUser) as { token?: string; accessToken?: string };
      return user.token ?? user.accessToken ?? null;
    }
  } catch {
    // Ignore malformed storage and continue unauthenticated.
  }
  return null;
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  withCredentials: true,
});

// ── Request interceptor: attach Bearer token ────────────────────────────────
apiClient.interceptors.request.use((config) => {
  const token = readAccessToken();
  // A caller may pass its own bearer (e.g. the admin demo session) that must
  // not be replaced by the student token.
  if (token && !config.headers.has("Authorization")) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  config.headers.set("Accept", "application/json");
  return config;
});

// ── Error normaliser ────────────────────────────────────────────────────────
function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  if (error instanceof AxiosError) {
    const status = error.response?.status ?? null;
    const body = error.response?.data as
      | {
          message?: string;
          error?: string;
          errors?: Record<string, string[] | string> | { path?: string; message?: string }[];
          fields?: Record<string, string>;
          retryAfter?: number;
        }
      | undefined;

    const fieldErrors: Record<string, string> = {};
    if (body?.fields && typeof body.fields === "object") {
      for (const [field, message] of Object.entries(body.fields)) {
        if (typeof message === "string" && message) fieldErrors[field] = message;
      }
    }
    if (Array.isArray(body?.errors)) {
      for (const issue of body.errors) {
        const path = typeof issue?.path === "string" ? issue.path.replace(/^body\./, "") : "";
        if (path && !fieldErrors[path] && typeof issue?.message === "string") {
          fieldErrors[path] = issue.message;
        }
      }
    } else if (body?.errors && typeof body.errors === "object") {
      for (const [field, messages] of Object.entries(body.errors)) {
        const first = Array.isArray(messages) ? messages[0] : messages;
        if (typeof first === "string" && first) fieldErrors[field] = first;
      }
    }

    const retryHeader = Number(error.response?.headers?.["retry-after"]);
    const retryAfter = Number.isFinite(body?.retryAfter)
      ? Number(body?.retryAfter)
      : Number.isFinite(retryHeader) && retryHeader > 0
        ? retryHeader
        : undefined;

    const firstFieldError = Object.values(fieldErrors)[0];
    const message =
      body?.message ??
      body?.error ??
      firstFieldError ??
      (status === 401
        ? "Your session has expired. Please sign in again."
        : status === 403
          ? "You do not have access to this request."
          : status === 404
            ? "The requested record could not be found."
            : status === 413
              ? "That file is too large. Please choose a smaller file."
              : status === 429
                ? "Please wait a moment before trying again."
                : status && status >= 500
                  ? "The service is temporarily unavailable. Please try again."
                  : !error.response
                    ? error.code === "ECONNABORTED"
                      ? "The request took too long. Check your connection and try again."
                      : "You appear to be offline. Check your connection and try again."
                    : error.message) ??
      "Something went wrong. Please try again.";

    return new ApiError(message, status, fieldErrors, retryAfter);
  }

  if (error instanceof Error && error.message) return new ApiError(error.message);
  return new ApiError("Something went wrong. Please try again.");
}

// ── 401 silent refresh ──────────────────────────────────────────────────────
let _isRefreshing = false;
let _refreshQueue: ((token: string | null) => void)[] = [];

function flushRefreshQueue(token: string | null) {
  _refreshQueue.forEach((cb) => cb(token));
  _refreshQueue = [];
}

type RetryConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
  skipAuthRefresh?: boolean;
  notifyOnError?: string | false;
};

/** Rejects with a normalized error, optionally raising the shared toast. */
function settle(error: unknown, config?: RetryConfig) {
  const apiError = toApiError(error);
  if (config?.notifyOnError && apiError.status !== 401) {
    showApiError(apiError, config.notifyOnError);
  }
  return Promise.reject(apiError);
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!(error instanceof AxiosError)) return settle(error);

    const config = error.config as RetryConfig | undefined;
    const status = error.response?.status;

    // Only attempt refresh on 401 and only once per request.
    if (status !== 401 || !config || config._retry || config.skipAuthRefresh) {
      return settle(error, config);
    }

    config._retry = true;

    // Queue up concurrent 401 failures and wait for the first refresh to complete.
    if (_isRefreshing) {
      return new Promise((resolve, reject) => {
        _refreshQueue.push((token) => {
          if (!token) return reject(toApiError(error));
          config.headers = config.headers ?? {};
          config.headers["Authorization"] = `Bearer ${token}`;
          resolve(apiClient(config));
        });
      });
    }

    _isRefreshing = true;

    try {
      // Use a plain axios call to avoid re-triggering our interceptor.
      const refreshResponse = await axios.post(
        `${API_BASE_URL}/auth/v1/refresh-token`,
        {},
        { withCredentials: true },
      );

      const newToken: string | undefined = refreshResponse.data?.data?.accessToken;
      if (!newToken) throw new Error("No access token in refresh response");

      sessionStorage.setItem("cpc_access_token", newToken);
      flushRefreshQueue(newToken);

      config.headers = config.headers ?? {};
      config.headers["Authorization"] = `Bearer ${newToken}`;
      return apiClient(config);
    } catch {
      // Refresh failed — clear session, explain once, then return to login.
      flushRefreshQueue(null);
      sessionStorage.removeItem("cpc_access_token");
      sessionStorage.removeItem("cpc_refresh_token");
      sessionStorage.removeItem("cpc_user");
      showToast({
        type: "error",
        title: "Session expired",
        message: "You were signed out to keep your account safe. Log in again to continue.",
        duration: 0,
        action: { label: "Log in again", onClick: () => navigate("/login/student") },
      });
      navigate("/login/student", { replace: true });
      return Promise.reject(
        new ApiError("Your session has expired. Please sign in again.", 401),
      );
    } finally {
      _isRefreshing = false;
    }
  },
);

/** Unwraps `{ data: ... }` envelopes without assuming more. */
export function unwrap<T>(body: unknown): T {
  if (body && typeof body === "object" && "data" in body) {
    return (body as { data: T }).data;
  }
  return body as T;
}
