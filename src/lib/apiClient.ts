import axios, { AxiosError } from "axios";

/**
 * Shared HTTP client for the CPC API.
 *
 * Base URL comes from `VITE_API_BASE_URL` (see `.env.example`). The access
 * token is read from the same session the login flow will store it in, and is
 * sent as a Bearer token on every request so the backend can scope records to
 * the authenticated student.
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

apiClient.interceptors.request.use((config) => {
  const token = readAccessToken();
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  config.headers.set("Accept", "application/json");
  return config;
});

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

apiClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(toApiError(error)),
);

/** Unwraps `{ data: ... }` envelopes (Laravel resources) without assuming more. */
export function unwrap<T>(body: unknown): T {
  if (body && typeof body === "object" && "data" in body) {
    return (body as { data: T }).data;
  }
  return body as T;
}
