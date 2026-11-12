import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router";
import { Bell, CheckCheck, CircleAlert, CircleCheck, Info, Trash2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatRelativeTime } from "@/lib/format";
import { useNotifications } from "@/components/context/NotificationContext";
import type { AppNotification, NotificationType } from "@/components/context/NotificationContext";

const TYPE_COLORS: Record<NotificationType, string> = {
  info: "text-cpc-blue-accent",
  success: "text-emerald-600",
  warning: "text-amber-600",
};

const DEFAULT_TYPE_ICONS: Record<NotificationType, LucideIcon> = {
  info: Info,
  success: CircleCheck,
  warning: CircleAlert,
};

type BellActions = {
  markRead: () => void;
  close: () => void;
};

export type NotificationBellProps = {
  /** Names the dropdown panel for screen readers, e.g. "Clearance notifications". */
  panelLabel?: string;
  emptyMessage?: string;
  /** Each feature picks the glyphs that match its own vocabulary. */
  typeIcons?: Record<NotificationType, LucideIcon>;
  /** Renders the relative timestamp; the wording differs per feature. */
  formatTime?: (value: string) => string;
  onItemClick?: (notification: AppNotification, actions: BellActions) => void;
  /** Extra inline hint after the timestamp, e.g. the clearance office link. */
  itemMeta?: (notification: AppNotification) => ReactNode;
};

/**
 * Top-bar bell over the shared student notification feed.
 * Features live real-time notifications, unread badges, mark-all-read,
 * and individual delete with a confirmation modal.
 */
export function NotificationBell({
  panelLabel = "Notifications",
  emptyMessage = "No notifications yet.",
  typeIcons = DEFAULT_TYPE_ICONS,
  formatTime = formatRelativeTime,
  onItemClick,
  itemMeta,
}: NotificationBellProps) {
  const { notifications, unreadCount, markAllRead, markRead, deleteNotification } =
    useNotifications();
  const [open, setOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AppNotification | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

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

  const handleItemClick = (notification: AppNotification) => {
    if (onItemClick) {
      onItemClick(notification, {
        markRead: () => void markRead(notification.id),
        close: () => setOpen(false),
      });
    } else {
      if (!notification.read) {
        void markRead(notification.id);
      }
      setOpen(false);
      if (notification.href) {
        navigate(notification.href);
      }
    }
  };

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
          className="absolute top-full right-0 z-40 mt-2 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-cpc-input-border bg-white shadow-[0_18px_48px_rgba(15,36,104,0.28)]"
        >
          <div className="flex items-center justify-between gap-2 border-b border-cpc-input-border px-3.5 py-3">
            <p className="font-poppins text-sm font-semibold text-cpc-navy-text">
              Notifications
              {unreadCount > 0 && (
                <span className="ml-2 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                  {unreadCount} unread
                </span>
              )}
            </p>
            <button
              type="button"
              onClick={() => void markAllRead()}
              disabled={unreadCount === 0}
              className="inline-flex cursor-pointer items-center gap-1 rounded px-2 py-1 font-poppins text-[11px] font-medium text-cpc-blue-accent transition-colors hover:bg-cpc-section-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent disabled:cursor-default disabled:text-cpc-heading-soft"
            >
              <CheckCheck className="h-3.5 w-3.5" aria-hidden />
              Mark all as read
            </button>
          </div>

          <ul className="max-h-88 divide-y divide-cpc-input-border/70 overflow-y-auto">
            {notifications.length === 0 && (
              <li className="px-4 py-8 text-center font-poppins text-xs text-cpc-heading-soft">
                {emptyMessage}
              </li>
            )}

            {notifications.map((notification) => {
              const Icon = typeIcons[notification.type] ?? Info;
              return (
                <li
                  key={notification.id}
                  className={cn(
                    "group relative flex items-start gap-2.5 px-3.5 py-3 transition-colors hover:bg-cpc-section-light/60",
                    !notification.read && "border-l-2 border-l-cpc-blue-accent bg-cpc-section-light/30",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => handleItemClick(notification)}
                    className="flex flex-1 cursor-pointer items-start gap-2.5 text-left focus-visible:outline-none"
                  >
                    <Icon
                      className={cn("mt-0.5 h-4 w-4 shrink-0", TYPE_COLORS[notification.type])}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <span
                        className={cn(
                          "block font-poppins text-xs leading-relaxed",
                          notification.read ? "text-cpc-heading-soft" : "font-semibold text-cpc-navy-text",
                        )}
                      >
                        {notification.message}
                      </span>
                      <span className="mt-1 block font-poppins text-[10px] text-cpc-heading-soft">
                        {formatTime(notification.createdAt)}
                        {itemMeta?.(notification)}
                      </span>
                    </div>
                  </button>

                  <div className="flex shrink-0 items-center gap-1.5 pt-0.5">
                    {!notification.read && (
                      <span
                        aria-hidden
                        className="h-2 w-2 rounded-full bg-cpc-blue-accent"
                        title="Unread"
                      />
                    )}
                    <button
                      type="button"
                      aria-label="Delete notification"
                      title="Delete notification"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(notification);
                      }}
                      className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-cpc-heading-soft opacity-60 transition-all hover:bg-rose-50 hover:text-rose-600 hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-rose-500 group-hover:opacity-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget &&
        createPortal(
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-delete-title"
            aria-describedby="confirm-delete-desc"
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-150"
            onClick={() => setDeleteTarget(null)}
          >
            <div
              className="w-full max-w-md rounded-2xl border border-cpc-input-border bg-white p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-3.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                  <Trash2 className="h-5 w-5" aria-hidden />
                </div>
                <div>
                  <h2
                    id="confirm-delete-title"
                    className="font-poppins text-lg font-bold text-cpc-navy-text"
                  >
                    Delete Notification
                  </h2>
                  <p
                    id="confirm-delete-desc"
                    className="mt-0.5 font-poppins text-xs text-cpc-heading-soft"
                  >
                    Are you sure you want to delete this notification? This action cannot be undone.
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-cpc-input-border/70 bg-cpc-section-light/60 p-3.5">
                <p className="font-poppins text-xs leading-relaxed text-cpc-navy-text">
                  &ldquo;{deleteTarget.message}&rdquo;
                </p>
              </div>

              <div className="mt-6 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="cursor-pointer rounded-xl border border-cpc-input-border bg-white px-4 py-2 font-poppins text-xs font-semibold text-cpc-navy-text transition-colors hover:bg-cpc-section-light focus-visible:outline-2 focus-visible:outline-cpc-blue-accent"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const id = deleteTarget.id;
                    setDeleteTarget(null);
                    await deleteNotification(id);
                  }}
                  className="cursor-pointer rounded-xl bg-rose-600 px-4 py-2 font-poppins text-xs font-semibold text-white shadow-xs transition-colors hover:bg-rose-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
