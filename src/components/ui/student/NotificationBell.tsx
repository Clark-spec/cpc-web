import { useEffect, useRef, useState, type ReactNode } from "react";
import { Bell, CheckCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { useNotifications } from "@/context/NotificationContext";
import type { AppNotification, NotificationType } from "@/context/NotificationContext";

const TYPE_COLORS: Record<NotificationType, string> = {
  info: "text-cpc-blue-accent",
  success: "text-emerald-600",
  warning: "text-amber-600",
};

type BellActions = {
  markRead: () => void;
  close: () => void;
};

export type NotificationBellProps = {
  /** Names the dropdown panel for screen readers, e.g. "Clearance notifications". */
  panelLabel: string;
  emptyMessage: string;
  /** Each feature picks the glyphs that match its own vocabulary. */
  typeIcons: Record<NotificationType, LucideIcon>;
  /** Renders the relative timestamp; the wording differs per feature. */
  formatTime: (value: string) => string;
  onItemClick: (notification: AppNotification, actions: BellActions) => void;
  /** Extra inline hint after the timestamp, e.g. the clearance office link. */
  itemMeta?: (notification: AppNotification) => ReactNode;
};

/**
 * Top-bar bell over the shared student notification feed. Only the copy, the
 * glyphs and what a click means differ between features, so those are props
 * and the panel markup lives here once.
 */
export function NotificationBell({
  panelLabel,
  emptyMessage,
  typeIcons,
  formatTime,
  onItemClick,
  itemMeta,
}: NotificationBellProps) {
  const { notifications, unreadCount, markAllRead, markRead } = useNotifications();
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
          aria-label={panelLabel}
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
                {emptyMessage}
              </li>
            )}

            {notifications.map((notification) => {
              const Icon = typeIcons[notification.type];
              return (
                <li key={notification.id}>
                  <button
                    type="button"
                    onClick={() =>
                      onItemClick(notification, {
                        markRead: () => markRead(notification.id),
                        close: () => setOpen(false),
                      })
                    }
                    className={cn(
                      "flex w-full cursor-pointer items-start gap-2 px-3 py-2.5 text-left transition-colors hover:bg-cpc-section-light/70 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cpc-blue-accent",
                      notification.read
                        ? "bg-white"
                        : "border-l-2 border-l-cpc-blue-accent bg-cpc-section-light/40",
                    )}
                  >
                    <Icon
                      className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", TYPE_COLORS[notification.type])}
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
                        {formatTime(notification.createdAt)}
                        {itemMeta?.(notification)}
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
