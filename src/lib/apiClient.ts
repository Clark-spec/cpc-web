import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { navigate } from "@/lib/router";

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

  constructor(message: string, status: number | null = null, fieldErrors: Record<string, string> = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

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
  if (token) {
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
      | { message?: string; error?: string; errors?: Record<string, string[] | string> }
      | undefined;

    const fieldErrors: Record<string, string> = {};
    if (body?.errors && typeof body.errors === "object") {
      for (const [field, messages] of Object.entries(body.errors)) {
        const first = Array.isArray(messages) ? messages[0] : messages;
        if (typeof first === "string" && first) fieldErrors[field] = first;
      }
    }

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
            : status && status >= 500
              ? "The service is temporarily unavailable. Please try again."
              : error.message) ??
      "Something went wrong. Please try again.";

    return new ApiError(message, status, fieldErrors);
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

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean };

apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!(error instanceof AxiosError)) return Promise.reject(toApiError(error));

    const config = error.config as RetryConfig | undefined;
    const status = error.response?.status;

    // Only attempt refresh on 401 and only once per request.
    if (status !== 401 || !config || config._retry) {
      return Promise.reject(toApiError(error));
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
      // Refresh failed — clear session and kick back to login.
      flushRefreshQueue(null);
      sessionStorage.removeItem("cpc_access_token");
      sessionStorage.removeItem("cpc_refresh_token");
      sessionStorage.removeItem("cpc_user");
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
