/* eslint-disable react-refresh/only-export-components -- provider + hook intentionally share a module */
import type { ReactNode } from "react";
import { NotificationProvider as PortalNotificationProvider } from "@/components/context/NotificationContext";

import { CLEARANCE_NOTIFICATIONS_KEY as STUDENT_NOTIFICATIONS_KEY } from "@/lib/clearanceStorage";

/**
 * (1) The staff portal writes decisions into `cpc:notifications:{studentId}`,
 * so the bell and the admin queue read and write one shared feed.
 */
export const CLEARANCE_NOTIFICATIONS_KEY = STUDENT_NOTIFICATIONS_KEY;

export function NotificationProvider({ children }: { children: ReactNode }) {
  return (
    <PortalNotificationProvider storageKey={CLEARANCE_NOTIFICATIONS_KEY}>
      {children}
    </PortalNotificationProvider>
  );
}

export { useNotifications } from "@/components/context/NotificationContext";
export type { AppNotification, NotificationType } from "@/components/context/NotificationContext";
