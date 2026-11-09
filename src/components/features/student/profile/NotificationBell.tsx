import { CircleAlert, CircleCheck, Info } from "lucide-react";
import { NotificationBell as SharedNotificationBell } from "@/components/common/feedback/NotificationBell";
import { formatRelativeTime } from "@/components/features/student/profile/format";

const TYPE_ICONS = {
  info: Info,
  success: CircleCheck,
  warning: CircleAlert,
} as const;

/** Profile bell: reading an item marks it read and leaves the panel open. */
export function NotificationBell() {
  return (
    <SharedNotificationBell
      panelLabel="Profile notifications"
      emptyMessage="No updates yet. Profile changes will appear here."
      typeIcons={TYPE_ICONS}
      formatTime={formatRelativeTime}
      onItemClick={(_notification, actions) => actions.markRead()}
    />
  );
}
