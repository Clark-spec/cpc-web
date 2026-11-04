import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Bell, CheckCheck, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/cn";
import { useClearance } from "../context/ClearanceContext";
import { useNotifications } from "../context/NotificationContext";
import { formatRelativeTime } from "../lib/format";
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

const typeColors: Record<AppNotification["type"], string> = {
  info: "text-cpc-blue-accent",
  success: "text-emerald-600",
  warning: "text-amber-600",
};

/** Notification bell in the top bar: unread count + dropdown of updates. */
export function NotificationBell() {
  const { notifications, unreadCount, markAllRead, markRead } = useNotifications();
  const { focusOffice } = useClearance();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const handlePointer = (event: MouseEvent) => {
      if (
        containerRef.current &&
        event.target instanceof Node &&
        !containerRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  function handleNotificationClick(notification: AppNotification) {
    markRead(notification.id);
    if (isOfficeId(notification.officeId)) {
      focusOffice(notification.officeId);
    }
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label={
          unreadCount > 0
            ? `Notifications, ${unreadCount} unread`
            : "Notifications, no unread updates"
        }
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((previous) => !previous)}
        className="relative flex h-[50px] w-[50px] cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        <Bell className="h-[26px] w-[26px] text-white" aria-hidden />
        {unreadCount > 0 && (
          <span
            aria-hidden
            className="absolute top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 font-poppins text-[9px] leading-none font-bold text-white ring-2 ring-cpc-navy-top"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Clearance notifications"
          className="absolute top-full right-0 z-40 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-lg border border-cpc-input-border bg-white shadow-[0_18px_48px_rgba(15,36,104,0.28)]"
        >
          <div className="flex items-center justify-between gap-2 border-b border-cpc-input-border px-3 py-2.5">
            <p className="font-poppins text-sm font-semibold text-cpc-navy-text">
              Notifications
              {unreadCount > 0 && (
                <span className="ml-1.5 text-[11px] font-medium text-cpc-heading-soft">
                  {unreadCount} unread
                </span>
              )}
            </p>
            <button
              type="button"
              onClick={markAllRead}
              disabled={unreadCount === 0}
              className="inline-flex cursor-pointer items-center gap-1 rounded px-1.5 py-1 font-poppins text-[11px] font-medium text-cpc-blue-accent transition-colors hover:bg-cpc-section-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent disabled:cursor-default disabled:text-cpc-heading-soft"
            >
              <CheckCheck className="h-3.5 w-3.5" aria-hidden />
              Mark all as read
            </button>
          </div>

          <ul className="max-h-80 divide-y divide-cpc-input-border/70 overflow-y-auto">
            {notifications.length === 0 && (
              <li className="px-3 py-6 text-center font-poppins text-xs text-cpc-heading-soft">
                No updates yet. Request a signature to get started.
              </li>
            )}

            {notifications.map((notification) => {
              const Icon = typeIcons[notification.type];
              return (
                <li key={notification.id}>
                  <button
                    type="button"
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      "flex w-full cursor-pointer items-start gap-2 px-3 py-2.5 text-left transition-colors hover:bg-cpc-section-light/70 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cpc-blue-accent",
                      notification.read
                        ? "bg-white"
                        : "border-l-2 border-l-cpc-blue-accent bg-cpc-section-light/40",
                    )}
                  >
                    <Icon
                      className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", typeColors[notification.type])}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          "block font-poppins text-xs leading-relaxed",
                          notification.read
                            ? "text-cpc-heading-soft"
                            : "font-medium text-cpc-navy-text",
                        )}
                      >
                        {notification.message}
                      </span>
                      <span className="mt-0.5 block font-poppins text-[10px] text-cpc-heading-soft">
                        {formatRelativeTime(notification.createdAt)}
                        {notification.officeId && (
                          <span className="ml-1 text-cpc-blue-accent">· View office</span>
                        )}
                      </span>
                    </span>
                    {!notification.read && (
                      <span
                        aria-hidden
                        className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-cpc-blue-accent"
                      />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
