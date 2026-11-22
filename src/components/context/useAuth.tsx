/* eslint-disable react-refresh/only-export-components -- provider + hook intentionally share a module */
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import { navigate } from "@/lib/router";
import { showInfo, showSuccess } from "@/lib/feedback";
import { ApiError } from "@/lib/apiClient";
import { loginApi, logoutApi, getSessionApi, type AuthUser } from "@/services/auth";

// ─── Types ────────────────────────────────────────────────────────────────────

type UserRole = "student" | "staff" | "admin" | null;

type User = Omit<AuthUser, "role"> & {
  role: UserRole;
};

type AuthContextType = {
  user: User | null;
  updateUser: (patch: Partial<Pick<User, "avatarUrl">>) => void;
  role: UserRole;
  isAuthenticated: boolean;
  login: (credentials: { id: string; password: string; role: UserRole }) => Promise<boolean>;
  logout: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
};

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = "cpc_user";
const ACCESS_TOKEN_KEY = "cpc_access_token";

/** Reads the persisted session once at startup. */
function readStoredUser(): User | null {
  const raw = sessionStorage.getItem(USER_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    sessionStorage.removeItem(USER_STORAGE_KEY);
    return null;
  }
}

/** Normalises the backend role string to the frontend UserRole union. */
function toUserRole(raw: string | undefined | null): UserRole {
  if (!raw) return null;
  const lower = raw.toLowerCase();
  if (lower === "student") return "student";
  if (lower === "admin" || lower === "registrar" || lower === "dean" ||
      lower.startsWith("dean_") ||
      lower === "library" || lower === "accounting" || lower === "sao" ||
      lower === "instructor" || lower === "guidance" || lower === "clinic") return "staff";
  return null;
}

/** Returns the post-login route for the given role. */
function redirectPath(role: UserRole): string {
  if (role === "student") return "/student/home";
  if (role === "staff") return "/admin/dashboard";
  return "/login/student";
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(readStoredUser);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const updateUser = useCallback((patch: Partial<Pick<User, "avatarUrl">>) => {
    setUser((current) => {
      if (!current) return current;
      const updated = { ...current, ...patch };
      sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // On every tab startup, restore the user from the shared HttpOnly cookie.
  useEffect(() => {
    getSessionApi()
      .then((freshUser) => {
        const updated: User = { ...freshUser, role: toUserRole(freshUser.role) };
        setUser(updated);
        sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updated));
      })
      .catch((error: unknown) => {
        // Keep a previously saved user during temporary network/server failures.
        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          setUser(null);
          sessionStorage.removeItem(USER_STORAGE_KEY);
          sessionStorage.removeItem(ACCESS_TOKEN_KEY);
          sessionStorage.removeItem("cpc_refresh_token");
        }
      })
      .finally(() => setIsLoading(false));
    // Only run once after the initial render.
  }, []);

  const login = useCallback(
    async (credentials: { id: string; password: string; role: UserRole }) => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await loginApi({
          identifier: credentials.id,
          password: credentials.password,
        });

        const role = toUserRole(result.user.role);
        const authUser: User = { ...result.user, role };

        // Persist session and tokens.
        sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(authUser));
        sessionStorage.setItem(ACCESS_TOKEN_KEY, result.accessToken);
        sessionStorage.setItem("cpc_refresh_token", result.refreshToken);

        setUser(authUser);
        showSuccess(
          "Welcome back",
          `You are signed in as ${authUser.name || authUser.id}.`,
        );
        navigate(redirectPath(role), { replace: true });
        return true;
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Login failed. Please try again.";
        setError(message);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await logoutApi();
    } catch {
      // Best-effort: clear client state regardless of network errors.
    } finally {
      setUser(null);
      sessionStorage.removeItem(USER_STORAGE_KEY);
      sessionStorage.removeItem(ACCESS_TOKEN_KEY);
      sessionStorage.removeItem("cpc_refresh_token");
      setIsLoading(false);
      navigate("/login/student", { replace: true });
      showInfo("Signed out", "You have been safely signed out of the portal.");
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return (
    <AuthContext.Provider
      value={{
        user,
        updateUser,
        role: user?.role ?? null,
        isAuthenticated: !!user,
        login,
        logout,
        isLoading,
        error,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
