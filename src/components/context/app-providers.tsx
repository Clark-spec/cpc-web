import { useEffect, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { AuthProvider } from "@/components/context/useAuth";
import { ToastProvider } from "@/components/ui/toast";
import { setNavigate } from "@/lib/router";

/**
 * Wires the React Router `useNavigate` hook into the imperative
 * `navigate()` helper used by the auth service layer (which lives outside
 * the React tree and cannot call hooks directly).
 */
function NavigateSetter() {
  const nav = useNavigate();
  useEffect(() => {
    setNavigate((path, options) => nav(path, options));
  }, [nav]);
  return null;
}

/** The provider composition for the app. `AuthProvider` itself stays defined in
 *  `@/components/context/useAuth`; this only wraps it around the route table so the tree can
 *  grow more providers without touching the routes. */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <AuthProvider>
        <NavigateSetter />
        {children}
      </AuthProvider>
    </ToastProvider>
  );
}
