import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router";
import { Bell, CircleAlert, CircleCheck, Info, Trash2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatRelativeTime } from "@/lib/format";
import { useToast } from "@/components/ui/toast";
import { useNotifications } from "@/components/context/NotificationContext";
import type { AppNotification, NotificationType } from "@/components/context/NotificationContext";
import { NotificationPanel } from "@/components/common/feedback/NotificationPanel";

const DEFAULT_TYPE_ICONS: Record<NotificationType, LucideIcon> = {
  info: Info,
  success: CircleCheck,
  warning: CircleAlert,
};

const MOBILE_QUERY = "(max-width: 639px)";
const TOAST_FRESHNESS_MS = 2 * 60_000;

/** The panel becomes a bottom sheet below the `sm` breakpoint. */
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia(MOBILE_QUERY).matches,
  );

  useEffect(() => {
    const query = window.matchMedia(MOBILE_QUERY);
    const update = () => setIsMobile(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return isMobile;
}

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
  emptyMessage = "You're all caught up",
  typeIcons = DEFAULT_TYPE_ICONS,
  formatTime = formatRelativeTime,
  onItemClick,
  itemMeta,
}: NotificationBellProps) {
  const {
    notifications,
    unreadCount,
    isLoading,
    isLoadingMore,
    hasMore,
    markAllRead,
    markRead,
    deleteNotification,
    loadMore,
  } = useNotifications();
  const [open, setOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AppNotification | null>(null);
  const [anchor, setAnchor] = useState<{ top: number; right: number } | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const knownIds = useRef<Set<string> | null>(null);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { toast } = useToast();

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;

    const handlePointer = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (containerRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
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

  // Lock page scroll behind the mobile sheet; the dropdown never blocks it.
  useEffect(() => {
    if (!open || !isMobile) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open, isMobile]);

  // Anchor the desktop dropdown under the bell, even as the sticky header moves.
  useEffect(() => {
    if (!open || isMobile) {
      setAnchor(null);
      return;
    }

    const update = () => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setAnchor({
        top: rect.bottom + 8,
        right: Math.max(12, window.innerWidth - rect.right),
      });
    };

    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, isMobile]);

  // Optional toast for a fresh notification that lands while the panel is shut.
  useEffect(() => {
    if (knownIds.current === null) {
      knownIds.current = new Set(notifications.map((notification) => notification.id));
      return;
    }

    const fresh = notifications.filter((notification) => !knownIds.current?.has(notification.id));
    notifications.forEach((notification) => knownIds.current?.add(notification.id));
    if (open || fresh.length === 0) return;

    const newest = fresh.find((notification) => !notification.read && !notification.local);
    if (!newest) return;
    if (Date.now() - new Date(newest.createdAt).getTime() > TOAST_FRESHNESS_MS) return;
    toast(newest.message, newest.type);
  }, [notifications, open, toast]);

  const handleItemClick = (notification: AppNotification) => {
    if (onItemClick) {
      onItemClick(notification, {
        markRead: () => void markRead(notification.id),
        close,
      });
      return;
    }

    if (!notification.read) {
      void markRead(notification.id);
    }
    setOpen(false);
    if (notification.href) {
      navigate(notification.href);
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
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="student-notification-panel"
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

      {open &&
        createPortal(
          <div className="pointer-events-none fixed inset-0 z-[60]">
            {isMobile && (
              <div
                aria-hidden
                onClick={close}
                className="cpc-fade-in pointer-events-auto absolute inset-0 bg-[#0B1F4B]/45 backdrop-blur-[1px]"
              />
            )}

            <div
              ref={panelRef}
              style={!isMobile && anchor ? { top: anchor.top, right: anchor.right } : undefined}
              className={cn(
                "pointer-events-auto",
                isMobile
                  ? "cpc-sheet-in absolute inset-x-0 bottom-0 max-h-[85dvh]"
                  : "cpc-panel-in fixed max-h-[min(70dvh,30rem)] w-[min(24rem,calc(100vw-2rem))]",
                !isMobile && !anchor && "invisible",
              )}
            >
              <NotificationPanel
                panelId="student-notification-panel"
                label={panelLabel}
                notifications={notifications}
                unreadCount={unreadCount}
                isLoading={isLoading}
                isLoadingMore={isLoadingMore}
                hasMore={hasMore}
                emptyTitle={emptyMessage}
                emptyHint="New updates will show up here."
                onMarkAllRead={() => void markAllRead()}
                onItemClick={handleItemClick}
                onLoadMore={() => void loadMore()}
                onDelete={(notification) => setDeleteTarget(notification)}
                onClose={close}
                typeIcons={typeIcons}
                formatTime={formatTime}
                itemMeta={itemMeta}
                className={isMobile ? "rounded-b-none pb-[env(safe-area-inset-bottom)]" : undefined}
              />
            </div>
          </div>,
          document.body,
        )}

      {/* Delete Confirmation Modal */}
      {deleteTarget &&
        createPortal(
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-delete-title"
            aria-describedby="confirm-delete-desc"
            className="cpc-fade-in fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
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
