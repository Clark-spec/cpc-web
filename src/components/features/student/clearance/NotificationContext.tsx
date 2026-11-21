/* eslint-disable react-refresh/only-export-components -- provider + hook intentionally share a module */
import type { ReactNode } from "react";
import { NotificationProvider as PortalNotificationProvider } from "@/components/context/NotificationContext";

export function NotificationProvider({ children }: { children: ReactNode }) {
  return (
    <PortalNotificationProvider>{children}</PortalNotificationProvider>
  );
}

export { useNotifications } from "@/components/context/NotificationContext";
export type { AppNotification, NotificationType } from "@/components/context/NotificationContext";
