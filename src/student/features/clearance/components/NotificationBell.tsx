import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { NotificationBell as SharedNotificationBell } from "@/components/common/notification-bell";
import { useClearance } from "../context/ClearanceContext";
import { formatRelativeTime } from "../utils/format";
import type { AppNotification, OfficeId } from "../types";

const OFFICE_IDS: OfficeId[] = [
  "instructor",
  "dean",
  "library",
  "registrar",
  "accounting",
  "sao",
];

function isOfficeId(value: string | undefined): value is OfficeId {
  return value !== undefined && OFFICE_IDS.includes(value as OfficeId);
}

const typeIcons = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
} as const;

/**
 * Clearance bell. Reading an item also jumps to the office it names and closes
 * the panel; the dropdown markup comes from the shared portal bell.
 */
export function NotificationBell() {
  const { focusOffice } = useClearance();

  return (
    <SharedNotificationBell
      panelLabel="Clearance notifications"
      emptyMessage="No updates yet. Request a signature to get started."
      typeIcons={typeIcons}
      formatTime={formatRelativeTime}
      onItemClick={(notification, actions) => {
        actions.markRead();
        if (isOfficeId(notification.officeId)) {
          focusOffice(notification.officeId);
        }
        actions.close();
      }}
      itemMeta={(notification: AppNotification) =>
        notification.officeId ? (
          <span className="ml-1 text-cpc-blue-accent">· View office</span>
        ) : null
      }
    />
  );
}
