import type { ReactNode } from "react";
import { Navigate } from "react-router";
import { ToastProvider } from "@/components/ui/toast";
import { AdminLayout } from "@/components/common/layout/AdminLayout";
import { AdminAuthProvider, useAdminAuth } from "@/components/context/AdminAuthContext";
import { AdminDataProvider } from "@/components/context/AdminDataContext";
import { SidebarProvider } from "@/components/context/SidebarContext";
import type { AdminRole } from "@/types/admin";
import AdminLoginPage from "@/pages/auth/admin";

/** Sends unauthenticated staff to the mock login screen. */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAdminAuth();

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
}

/**
 * Route-level role gate for pages that only some staff roles can open. The
 * sidebar already hides those links, so a mismatch only happens on a direct URL.
 */
export function RequireAdminRole({
  roles,
  children,
}: {
  roles: readonly AdminRole[];
  children: ReactNode;
}) {
  const { user } = useAdminAuth();

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  if (!roles.includes(user.role)) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <>{children}</>;
}


/** /admin/login route element (auth provider + toasts for the sign-in feedback). */
export function AdminLoginRoute() {
  return (
    <AdminAuthProvider>
      <ToastProvider>
        <AdminLoginPage />
      </ToastProvider>
    </AdminAuthProvider>
  );
}

/**
 * Protected shell. Providers are ordered so the layout can read the session
 * (auth), show toasts, persist the sidebar state, and share live data.
 */
export function AdminShell() {
  return (
    <AdminAuthProvider>
      <RequireAdmin>
        <ToastProvider>
          <SidebarProvider>
            <AdminDataProvider>
              <AdminLayout />
            </AdminDataProvider>
          </SidebarProvider>
        </ToastProvider>
      </RequireAdmin>
    </AdminAuthProvider>
  );
}
