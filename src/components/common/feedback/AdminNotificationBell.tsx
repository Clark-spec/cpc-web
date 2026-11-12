import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router";
import {
  AlertTriangle,
  Bell,
  BellOff,
  CheckCheck,
  CheckCircle2,
  Info,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { formatRelativeTime } from "@/lib/format";
import { useAdminData } from "@/components/context/AdminDataContext";
import { useClickOutside } from "@/hooks/useClickOutside";
import type { AdminNotification } from "@/types/admin";

const ICONS = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
} as const;

const ICON_TONES = {
  info: "bg-cpc-section-light text-cpc-blue-accent",
  success: "bg-emerald-50 text-emerald-600",
  warning: "bg-amber-50 text-amber-600",
} as const;

export function AdminNotificationBell() {
  const {
    notifications,
    unreadNotifications,
    markAllNotificationsRead,
    markNotificationRead,
    deleteNotification,
  } = useAdminData();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminNotification | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useClickOutside(wrapperRef, () => setOpen(false), open);

  const openNotification = async (notification: AdminNotification) => {
    if (!notification.read) {
      await markNotificationRead(notification.id);
    }
    setOpen(false);
    navigate(notification.href ?? "/admin/dashboard");
  };

  const markAll = async () => {
    setBusy(true);
    try {
      await markAllNotificationsRead();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      ref={wrapperRef}
      className="relative"
      onKeyDown={(event) => {
        if (event.key === "Escape") setOpen(false);
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-controls="admin-notification-panel"
        aria-label={`Notifications, ${unreadNotifications} unread`}
        className="relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-cpc-tile-border/70 bg-white text-cpc-heading-soft transition-colors hover:bg-cpc-section-light hover:text-cpc-navy-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
      >
        <Bell className="h-[18px] w-[18px]" aria-hidden />
        {unreadNotifications > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 font-poppins text-[9px] leading-none font-bold text-white ring-2 ring-white">
            {unreadNotifications > 9 ? "9+" : unreadNotifications}
          </span>
        )}
      </button>

      {open && (
        <div
          id="admin-notification-panel"
          className="admin-fade-in absolute right-0 top-full z-50 mt-2 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-cpc-tile-border bg-white shadow-[0_18px_50px_rgba(15,36,104,0.22)]"
        >
          <div className="flex items-center justify-between gap-2 border-b border-cpc-tile-border/70 px-3 py-2.5">
            <div>
              <p className="font-poppins text-sm font-semibold text-cpc-navy-text">
                Notifications
              </p>
              <p className="font-poppins text-[10px] text-cpc-heading-soft">
                {unreadNotifications > 0
                  ? `${unreadNotifications} unread`
                  : "You're all caught up"}
              </p>
            </div>
            <button
              type="button"
              onClick={markAll}
              disabled={busy || unreadNotifications === 0}
              className="inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 font-poppins text-[10px] font-semibold text-cpc-blue-accent transition-colors hover:bg-cpc-section-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CheckCheck className="h-3.5 w-3.5" aria-hidden />
              Mark all as read
            </button>
          </div>

          {notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-1.5 px-4 py-8 text-center">
              <BellOff className="h-6 w-6 text-cpc-muted-blue" aria-hidden />
              <p className="font-poppins text-xs font-semibold text-cpc-navy-text">
                No notifications yet
              </p>
              <p className="font-poppins text-[11px] text-cpc-heading-soft">
                Staff actions and student requests will show up here.
              </p>
            </div>
          ) : (
            <ul className="admin-scrollbar max-h-80 divide-y divide-cpc-tile-border/60 overflow-y-auto">
              {notifications.map((notification) => {
                const Icon = ICONS[notification.type];
                return (
                  <li key={notification.id} className="group relative">
                    <button
                      type="button"
                      onClick={() => void openNotification(notification)}
                      className={cn(
                        "flex w-full cursor-pointer items-start gap-2.5 px-3 py-2.5 pr-10 text-left transition-colors hover:bg-cpc-section-light/60 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-cpc-blue-accent",
                        !notification.read && "bg-cpc-section-light/30",
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                          ICON_TONES[notification.type],
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-poppins text-xs leading-snug text-cpc-navy-text">
                          {notification.message}
                        </span>
                        <span className="mt-0.5 block font-poppins text-[10px] text-cpc-heading-soft">
                          {formatRelativeTime(notification.createdAt)}
                        </span>
                      </span>
                      {!notification.read && (
                        <span
                          aria-label="Unread"
                          className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-rose-500"
                        />
                      )}
                    </button>

                    {/* Delete button */}
                    <button
                      type="button"
                      aria-label="Delete notification"
                      title="Delete notification"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(notification);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-cpc-heading-soft opacity-0 transition-all hover:bg-rose-50 hover:text-rose-600 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-rose-500 group-hover:opacity-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget &&
        createPortal(
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="admin-confirm-delete-title"
            aria-describedby="admin-confirm-delete-desc"
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
            onClick={() => setDeleteTarget(null)}
          >
            <div
              className="w-full max-w-md rounded-2xl border border-cpc-tile-border bg-white p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-3.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                  <Trash2 className="h-5 w-5" aria-hidden />
                </div>
                <div>
                  <h2
                    id="admin-confirm-delete-title"
                    className="font-poppins text-lg font-bold text-cpc-navy-text"
                  >
                    Delete Notification
                  </h2>
                  <p
                    id="admin-confirm-delete-desc"
                    className="mt-0.5 font-poppins text-xs text-cpc-heading-soft"
                  >
                    Are you sure you want to delete this notification? This action cannot be undone.
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-cpc-tile-border/70 bg-cpc-section-light/60 p-3.5">
                <p className="font-poppins text-xs leading-relaxed text-cpc-navy-text">
                  &ldquo;{deleteTarget.message}&rdquo;
                </p>
              </div>

              <div className="mt-6 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="cursor-pointer rounded-xl border border-cpc-tile-border bg-white px-4 py-2 font-poppins text-xs font-semibold text-cpc-navy-text transition-colors hover:bg-cpc-section-light focus-visible:outline-2 focus-visible:outline-cpc-blue-accent"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    deleteNotification(deleteTarget.id);
                    setDeleteTarget(null);
                    setOpen(false);
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
