/**
 * Auth service – thin wrappers around the CPC backend auth API.
 *
 * Browser flow (double-submit CSRF):
 *   1. GET /api/auth/v1/csrf-token  → save csrfToken
 *   2. POST /api/auth/v1/login      → x-csrf-token header, withCredentials
 *   3. After login, refresh the CSRF token (cookies changed)
 *   4. Logout likewise needs a fresh CSRF token
 */
import { apiClient, ApiError, type NoRefreshConfig } from "@/lib/apiClient";
import type { AxiosRequestConfig } from "axios";

// ─── Types ───────────────────────────────────────────────────────────────────

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  studentNumber?: string | null;
  course?: string | null;
  yearLevel?: number | null;
  department?: string | null;
  avatarUrl?: string | null;
  phone?: string | null;
};

type ApiEnvelope<T> = {
  code: number;
  status: string;
  message?: string;
  data?: T;
};

// ─── In-memory CSRF token ─────────────────────────────────────────────────────

let _csrfToken: string | null = null;

/** Returns the cached token or fetches a fresh one. */
export async function getCsrfToken(): Promise<string> {
  if (_csrfToken) return _csrfToken;
  return refreshCsrfToken();
}

/** Always fetches a new CSRF token from the backend and caches it. */
export async function refreshCsrfToken(): Promise<string> {
  const response = await apiClient.get<ApiEnvelope<{ csrfToken: string }>>(
    "/auth/v1/csrf-token",
  );
  const token = response.data?.data?.csrfToken;
  if (!token) throw new ApiError("Failed to retrieve CSRF token");
  _csrfToken = token;
  return token;
}

/** Clears the in-memory CSRF token (call after logout). */
export function clearCsrfToken() {
  _csrfToken = null;
}

// ─── Auth operations ──────────────────────────────────────────────────────────

export type LoginPayload = {
  /** School ID, student number, or email. */
  identifier: string;
  password: string;
};

export type LoginResult = {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
};

/** Authenticates the user against the backend. Handles the CSRF double-submit. */
export async function loginApi(payload: LoginPayload): Promise<LoginResult> {
  const csrf = await getCsrfToken();

  const response = await apiClient.post<ApiEnvelope<LoginResult>>(
    "/auth/v1/login",
    { identifier: payload.identifier, password: payload.password },
    { headers: { "x-csrf-token": csrf }, skipAuthRefresh: true } as AxiosRequestConfig &
      NoRefreshConfig,
  );

  const data = response.data?.data;
  if (!data?.user || !data?.accessToken) {
    throw new ApiError(response.data?.message ?? "Login failed");
  }

  // Refresh CSRF: cookies changed after login, the old token is now invalid.
  await refreshCsrfToken();

  return data;
}

/** Fetches the current session for an already-authenticated user (cookie-based). */
export async function getSessionApi(): Promise<AuthUser> {
  const response = await apiClient.get<ApiEnvelope<{ user: AuthUser }>>(
    "/auth/v1/session",
  );
  const user = response.data?.data?.user;
  if (!user) throw new ApiError("No active session");
  return user;
}

export type LogoutPayload = {
  refreshToken?: string;
};

/** Logs out the current user and clears server-side tokens. */
export async function logoutApi(payload?: LogoutPayload): Promise<void> {
  const csrf = await getCsrfToken();

  await apiClient.post(
    "/auth/v1/logout",
    { refreshToken: payload?.refreshToken ?? "" },
    { headers: { "x-csrf-token": csrf } },
  );

  clearCsrfToken();
}

