import type { ReactNode } from "react";
import { Navigate, Outlet } from "react-router";
import { useAuth } from "@/components/context/useAuth";
import { useAdminAuth } from "@/components/context/AdminAuthContext";

/**
 * Guards every student-portal route and mounts the shared notification provider.
 * Unauthenticated visitors are sent to the student login page.
 */
export function RequireStudent({ children }: { children?: ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { user: staffUser } = useAdminAuth();

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center font-poppins text-sm text-cpc-heading-soft">Restoring your session…</div>;
  }

  // The student login is authoritative when present. A demo staff session may
  // remain in localStorage from an earlier use of the admin portal, so it must
  // not override a newly authenticated student account in this tab.
  if (isAuthenticated && user?.role === "student") {
    return children ? <>{children}</> : <Outlet />;
  }

  // Staff demo sessions are stored separately from student auth. Keep staff
  // accounts (including Guidance) in the staff portal if they open a student URL.
  if (staffUser || user?.role === "staff" || user?.role === "admin") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  if (!isAuthenticated || user?.role !== "student") {
    return <Navigate to="/login/student" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}


