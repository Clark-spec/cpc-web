import { ApiError } from "@/lib/apiClient";
import { loginApi } from "@/services/auth";
import type { AdminRole } from "@/types/admin";

/*
 * The admin portal signs in with local demo roles. Complaint endpoints are
 * protected by the real backend, so this bridge exchanges the selected demo
 * role for a backend session (the seeded staff account, password "123456").
 */

const SESSION_KEY = "cpc.admin.session.v1";
const TOKEN_ROLE_KEY = "cpc.admin.token-role.v1";
/**
 * The admin demo session keeps its bearer token under its own key. Writing it
 * to `cpc_access_token` would replace the student's session in the same tab,
 * and the student portal would then authenticate as the admin account.
 */
const ADMIN_TOKEN_KEY = "cpc.admin.access-token.v1";
const DEMO_PASSWORD = "123456";

const ROLE_EMAILS: Record<AdminRole, string> = {
  admin: "admin@cpc.edu.ph",
  registrar: "registrar@cpc.edu.ph",
  dean_cs: "dean@cpc.edu.ph",
  dean_edu: "dean.edu@cpc.edu.ph",
  dean_hm: "dean.hm@cpc.edu.ph",
  library: "library@cpc.edu.ph",
  accounting: "accounting@cpc.edu.ph",
  sao: "sao@cpc.edu.ph",
  instructor: "instructor@cpc.edu.ph",
};

/** Backend role claim each demo role signs in with. */
const ROLE_CLAIMS: Record<AdminRole, string> = {
  admin: "ADMIN",
  registrar: "REGISTRAR",
  dean_cs: "DEAN",
  dean_edu: "DEAN",
  dean_hm: "DEAN",
  library: "LIBRARY",
  accounting: "ACCOUNTING",
  sao: "SAO",
  instructor: "INSTRUCTOR",
};

/**
 * True when the cached token still belongs to this demo role. A student who
 * signed in after the admin would otherwise leave their token in the shared
 * storage key and the admin API would reject it with 403.
 */
function tokenMatchesRole(token: string, role: AdminRole): boolean {
  const segment = token.split(".")[1];
  if (!segment) return false;
  try {
    const payload = JSON.parse(atob(segment.replace(/-/g, "+").replace(/_/g, "/"))) as {
      role?: string;
      exp?: number;
    };
    if (payload.exp && payload.exp * 1000 <= Date.now()) return false;
    return payload.role === ROLE_CLAIMS[role];
  } catch {
    return false;
  }
}

let inflight: { role: AdminRole; promise: Promise<string> } | null = null;

export function readAdminRole(): AdminRole | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const user = JSON.parse(raw) as { role?: AdminRole };
    return user?.role && user.role in ROLE_EMAILS ? user.role : null;
  } catch {
    return null;
  }
}

export function clearAdminBackendSession() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(ADMIN_TOKEN_KEY);
  window.sessionStorage.removeItem(TOKEN_ROLE_KEY);
}

export async function ensureAdminSession(role = readAdminRole()): Promise<string> {
  if (!role) throw new ApiError("Admin session not found. Please sign in again.", 401);

  if (typeof window !== "undefined") {
    const cached = window.sessionStorage.getItem(ADMIN_TOKEN_KEY);
    const cachedRole = window.sessionStorage.getItem(TOKEN_ROLE_KEY);
    if (cached && cachedRole === role && tokenMatchesRole(cached, role)) return cached;
  }

  if (inflight?.role === role) return inflight.promise;

  const promise = (async () => {
    const result = await loginApi({
      identifier: ROLE_EMAILS[role],
      password: DEMO_PASSWORD,
    });
    window.sessionStorage.setItem(ADMIN_TOKEN_KEY, result.accessToken);
    window.sessionStorage.setItem(TOKEN_ROLE_KEY, role);
    return result.accessToken;
  })();

  inflight = { role, promise };
  try {
    return await promise;
  } finally {
    if (inflight?.promise === promise) inflight = null;
  }
}
