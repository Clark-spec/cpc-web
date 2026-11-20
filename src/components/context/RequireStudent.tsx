import type { ReactNode } from "react";
import { Navigate, Outlet } from "react-router";
import { useAuth } from "@/components/context/useAuth";

/**
 * Guards every student-portal route and mounts the shared notification provider.
 * Unauthenticated visitors are sent to the student login page.
 */
export function RequireStudent({ children }: { children?: ReactNode }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login/student" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}


