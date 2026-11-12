import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router";
import { Bell, Trash2 } from "lucide-react";
import { useAdminData } from "@/components/context/AdminDataContext";
import { NotificationPanel } from "@/components/common/feedback/NotificationPanel";
import { useClickOutside } from "@/hooks/useClickOutside";
import type { AdminNotification } from "@/types/admin";

export function AdminNotificationBell() {
  const {
    notifications,
    unreadNotifications,
    loading,
    markAllNotificationsRead,
    markNotificationRead,
    deleteNotification,
  } = useAdminData();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminNotification | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useClickOutside(wrapperRef, () => setOpen(false), open && !deleteTarget);

  const openNotification = async (notification: AdminNotification) => {
    if (!notification.read) {
      await markNotificationRead(notification.id);
    }
    setOpen(false);
    navigate(notification.href ?? "/admin/dashboard");
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
        aria-haspopup="dialog"
        aria-controls="admin-notification-panel"
        aria-label={
          unreadNotifications > 0
            ? `Notifications, ${unreadNotifications} unread`
            : "Notifications, no unread updates"
        }
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
        <div className="absolute top-full right-0 z-50 mt-2 max-h-[min(70dvh,30rem)] w-[min(24rem,calc(100vw-2rem))]">
          <NotificationPanel
            panelId="admin-notification-panel"
            className="cpc-panel-in"
            label="Staff notifications"
            emptyTitle="No notifications yet"
            emptyHint="Student complaints and staff updates will show up here."
            notifications={notifications}
            unreadCount={unreadNotifications}
            isLoading={loading}
            onMarkAllRead={() => void markAllNotificationsRead()}
            onItemClick={(notification) => void openNotification(notification)}
            onLoadMore={() => {}}
            onDelete={(notification) => setDeleteTarget(notification)}
            onClose={() => setOpen(false)}
          />
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
