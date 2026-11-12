import type { ReactNode } from "react";
import { Navigate, Outlet } from "react-router";
import { useAuth } from "@/components/context/useAuth";
import { ToastProvider } from "@/components/ui/toast";
import { NotificationProvider } from "@/components/context/NotificationContext";

/**
 * Guards every student-portal route and mounts the shared notification provider.
 * Unauthenticated visitors are sent to the student login page.
 */
export function RequireStudent({ children }: { children?: ReactNode }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login/student" replace />;
  }

  const content = children ? <>{children}</> : <Outlet />;

  return (
    <ToastProvider>
      <NotificationProvider>{content}</NotificationProvider>
    </ToastProvider>
  );
}


