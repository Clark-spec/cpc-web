/* eslint-disable react-refresh/only-export-components -- provider + hook intentionally share a module */
import type { ReactNode } from "react";
import { NotificationProvider as PortalNotificationProvider } from "@/components/context/NotificationContext";
import { studentNotificationsKey } from "@/lib/clearanceStorage";
import { getActiveStudent } from "@/services/clearanceStudent/service";

export function NotificationProvider({ children }: { children: ReactNode }) {
  const activeStudent = getActiveStudent();
  const key = studentNotificationsKey(activeStudent.studentId);

  return (
    <PortalNotificationProvider storageKey={key}>
      {children}
    </PortalNotificationProvider>
  );
}

export { useNotifications } from "@/components/context/NotificationContext";
export type { AppNotification, NotificationType } from "@/components/context/NotificationContext";
