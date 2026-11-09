/* eslint-disable react-refresh/only-export-components -- provider + hook intentionally share a module */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { ADMIN_USERS } from "@/lib/navigation";
import type { AdminRole, AdminUser } from "@/types/admin";

const SESSION_KEY = "cpc.admin.session.v1";
const DEMO_MODE_KEY = "cpc.admin.demo-mode.v1";

type AdminAuthContextValue = {
  user: AdminUser | null;
  isAuthenticated: boolean;
  demoMode: boolean;
  login: (role: AdminRole) => void;
  logout: () => void;
  switchRole: (role: AdminRole) => void;
  toggleDemoMode: () => void;
  setDemoMode: (value: boolean) => void;
};

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

/** Mock staff authentication persisted in localStorage. */
export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useLocalStorage<AdminUser | null>(SESSION_KEY, null);
  const [demoMode, setDemoMode] = useLocalStorage<boolean>(DEMO_MODE_KEY, false);
  const navigate = useNavigate();

  const login = useCallback(
    (role: AdminRole) => {
      setUser(ADMIN_USERS[role]);
      navigate("/admin/dashboard", { replace: true });
    },
    [navigate, setUser],
  );

  const logout = useCallback(() => {
    setUser(null);
    navigate("/admin/login", { replace: true });
  }, [navigate, setUser]);

  const switchRole = useCallback(
    (role: AdminRole) => {
      setUser(ADMIN_USERS[role]);
    },
    [setUser],
  );

  const toggleDemoMode = useCallback(() => {
    setDemoMode((current) => !current);
  }, [setDemoMode]);

  const value = useMemo<AdminAuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      demoMode,
      login,
      logout,
      switchRole,
      toggleDemoMode,
      setDemoMode,
    }),
    [demoMode, login, logout, setDemoMode, switchRole, toggleDemoMode, user],
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth(): AdminAuthContextValue {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used inside an <AdminAuthProvider>.");
  }
  return context;
}
