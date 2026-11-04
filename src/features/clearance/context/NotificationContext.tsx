/* eslint-disable react-refresh/only-export-components -- provider + hook intentionally share a module */
import type { ReactNode } from "react";
import { NotificationProvider as PortalNotificationProvider } from "@/context/NotificationContext";

/** Clearance keeps its own persisted feed inside the shared portal store. */
export const CLEARANCE_NOTIFICATIONS_KEY = "cpc.online-clearance.notifications.v1";

export function NotificationProvider({ children }: { children: ReactNode }) {
  return (
    <PortalNotificationProvider storageKey={CLEARANCE_NOTIFICATIONS_KEY}>
      {children}
    </PortalNotificationProvider>
  );
}

export { useNotifications } from "@/context/NotificationContext";
export type { AppNotification, NotificationType } from "@/context/NotificationContext";
