import { useMemo, useState, type ReactNode } from "react";
import {
  BellOff,
  CheckCheck,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  FileText,
  Info,
  Loader2,
  Trash2,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatRelativeTime } from "@/lib/format";
import { Badge } from "@/components/ui/badge";

export type PanelNotificationType = "info" | "success" | "warning";

/** Minimal shape shared by the student and staff notification feeds. */
export type PanelNotification = {
  id: string;
  title?: string;
  message: string;
  type: PanelNotificationType;
  createdAt: string;
  read: boolean;
  href?: string;
  officeId?: string;
};

type FilterTab = "all" | "unread";

const TYPE_TILES: Record<PanelNotificationType, string> = {
  info: "bg-cpc-section-light text-cpc-blue-accent",
  success: "bg-emerald-50 text-emerald-600",
  warning: "bg-amber-50 text-amber-600",
};

const TYPE_ICONS: Record<PanelNotificationType, LucideIcon> = {
  info: Info,
  success: CircleCheck,
  warning: CircleAlert,
};

function fallbackTitle(notification: PanelNotification): string {
  if (notification.href?.includes("complaint")) return "Complaint Update";
  if (
    notification.href?.includes("service-request") ||
    notification.href?.includes("request-status")
  ) {
    return "Service Request Update";
  }
  if (notification.type === "success") return "Completed";
  if (notification.type === "warning") return "Needs attention";
  return "Update";
}

export type NotificationPanelProps = {
  notifications: PanelNotification[];
  unreadCount: number;
  isLoading?: boolean;
  isLoadingMore?: boolean;
  hasMore?: boolean;
  panelId?: string;
  label?: string;
  emptyTitle?: string;
  emptyHint?: string;
  onMarkAllRead: () => void;
  onItemClick: (notification: PanelNotification) => void;
  onLoadMore: () => void;
  onDelete?: (notification: PanelNotification) => void;
  onClose?: () => void;
  typeIcons?: Record<PanelNotificationType, LucideIcon>;
  formatTime?: (value: string) => string;
  itemMeta?: (notification: PanelNotification) => ReactNode;
  /** Extra positioning/rounding classes from the bell that hosts the panel. */
  className?: string;
};

/**
 * Facebook-style bell panel rendered inside a caller-positioned container.
 * Shared by the student portal dropdown / mobile sheet and the admin bell so
 * both feeds keep the same tabs, grouping and paging behavior.
 */
export function NotificationPanel({
  notifications,
  unreadCount,
  isLoading = false,
  isLoadingMore = false,
  hasMore = false,
  panelId,
  label = "Notifications",
  emptyTitle = "You're all caught up",
  emptyHint = "New updates will show up here.",
  onMarkAllRead,
  onItemClick,
  onLoadMore,
  onDelete,
  onClose,
  typeIcons = TYPE_ICONS,
  formatTime = formatRelativeTime,
  itemMeta,
  className,
}: NotificationPanelProps) {
  const [tab, setTab] = useState<FilterTab>("all");

  const visible = useMemo(
    () => (tab === "unread" ? notifications.filter((notification) => !notification.read) : notifications),
    [notifications, tab],
  );
  const newItems = useMemo(() => visible.filter((notification) => !notification.read), [visible]);
  const earlierItems = useMemo(() => visible.filter((notification) => notification.read), [visible]);

  const showSkeleton = isLoading && notifications.length === 0;
  const empty = !showSkeleton && visible.length === 0;

  const tabClass = (value: FilterTab) =>
    cn(
      "inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1 font-poppins text-[11px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent",
      tab === value
        ? "border-cpc-blue-accent bg-cpc-blue-accent text-white"
        : "border-cpc-input-border bg-white text-cpc-navy-text hover:bg-cpc-section-light",
    );

  const renderItem = (notification: PanelNotification) => {
    // Service-request updates keep the shared info/success styling but use the
    // document glyph so the feed reads at a glance.
    const isServiceRequest =
      notification.href?.includes("request-status") ||
      notification.href?.includes("service-request");
    const Icon = isServiceRequest ? FileText : (typeIcons[notification.type] ?? Info);
    const title = notification.title?.trim() || fallbackTitle(notification);
    return (
      <li
        key={notification.id}
        className={cn(
          "group relative",
          !notification.read && "border-l-2 border-l-cpc-blue-accent bg-cpc-section-light/30",
        )}
      >
        <button
          type="button"
          onClick={() => onItemClick(notification)}
          className="flex w-full cursor-pointer items-start gap-3 px-4 py-3 pr-10 text-left transition-colors hover:bg-cpc-section-light/60 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-cpc-blue-accent"
        >
          <span
            className={cn(
              "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
              TYPE_TILES[notification.type],
            )}
            aria-hidden
          >
            <Icon className="h-[18px] w-[18px]" />
          </span>
          <span className="min-w-0 flex-1">
            <span
              className={cn(
                "block font-poppins text-[11px] font-semibold",
                notification.read ? "text-cpc-navy-text" : "text-cpc-blue-accent",
              )}
            >
              {title}
            </span>
            <span
              className={cn(
                "mt-0.5 block font-poppins text-xs leading-relaxed",
                notification.read ? "text-cpc-heading-soft" : "text-cpc-navy-text",
              )}
            >
              {notification.message}
            </span>
            <span className="mt-1 flex items-center gap-1 font-poppins text-[10px] text-cpc-heading-soft">
              {formatTime(notification.createdAt)}
              {itemMeta?.(notification)}
            </span>
          </span>
          {notification.href && (
            <ChevronRight
              className="mt-2 h-4 w-4 shrink-0 text-cpc-muted-blue/70 transition-transform group-hover:translate-x-0.5 group-hover:text-cpc-blue-accent"
              aria-hidden
            />
          )}
          {!notification.read && (
            <span
              aria-label="Unread"
              className="mt-3 h-2 w-2 shrink-0 rounded-full bg-rose-500"
            />
          )}
        </button>

        {onDelete && (
          <button
            type="button"
            aria-label="Delete notification"
            title="Delete notification"
            onClick={(event) => {
              event.stopPropagation();
              onDelete(notification);
            }}
            className="absolute right-2 bottom-2 flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-cpc-heading-soft opacity-60 transition-all hover:bg-rose-50 hover:text-rose-600 hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-rose-500 group-hover:opacity-100"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden />
          </button>
        )}
      </li>
    );
  };

  return (
    <div
      id={panelId}
      role="dialog"
      aria-label={label}
      className={cn(
        "flex max-h-[inherit] min-h-0 flex-col overflow-hidden rounded-2xl border border-cpc-input-border bg-white shadow-[0_18px_48px_rgba(15,36,104,0.28)]",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2 px-4 pt-3.5 pb-2">
        <div className="min-w-0">
          <p className="font-poppins text-sm font-semibold text-cpc-navy-text">
            Notifications
            {unreadCount > 0 && (
              <Badge tone="danger" size="sm" dot={false} className="ml-2 align-middle">
                {unreadCount} unread
              </Badge>
            )}
          </p>
          <p className="font-poppins text-[10px] text-cpc-heading-soft">
            {unreadCount > 0 ? "Tap an update to open it." : "You're all caught up."}
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close notifications"
            className="-mt-1 -mr-1 flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-cpc-heading-soft transition-colors hover:bg-cpc-section-light hover:text-cpc-navy-text focus-visible:outline-2 focus-visible:outline-cpc-blue-accent"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 border-y border-cpc-input-border/70 px-3 py-2">
        <div role="tablist" aria-label="Filter notifications" className="flex items-center gap-1.5">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "all"}
            onClick={() => setTab("all")}
            className={tabClass("all")}
          >
            All
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "unread"}
            onClick={() => setTab("unread")}
            className={tabClass("unread")}
          >
            Unread
            {unreadCount > 0 && (
              <span
                className={cn(
                  "rounded-full px-1.5 text-[9px] font-bold",
                  tab === "unread" ? "bg-white/25 text-white" : "bg-rose-100 text-rose-700",
                )}
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>
        </div>

        <button
          type="button"
          onClick={onMarkAllRead}
          disabled={unreadCount === 0}
          className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-md px-2 py-1 font-poppins text-[10px] font-semibold text-cpc-blue-accent transition-colors hover:bg-cpc-section-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent disabled:cursor-default disabled:text-cpc-heading-soft"
        >
          <CheckCheck className="h-3.5 w-3.5" aria-hidden />
          Mark all as read
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {showSkeleton && (
          <div className="space-y-3 px-4 py-3" aria-hidden>
            {[0, 1, 2, 3].map((row) => (
              <div key={row} className="flex items-start gap-3">
                <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-cpc-section-light" />
                <div className="flex-1 space-y-2 pt-0.5">
                  <div className="h-2.5 w-1/3 animate-pulse rounded bg-cpc-section-light" />
                  <div className="h-2.5 w-full animate-pulse rounded bg-cpc-section-light" />
                  <div className="h-2 w-1/4 animate-pulse rounded bg-cpc-section-light" />
                </div>
              </div>
            ))}
          </div>
        )}

        {empty && (
          <div className="flex flex-col items-center gap-1.5 px-4 py-10 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-cpc-section-light text-cpc-blue-accent">
              <BellOff className="h-5 w-5" aria-hidden />
            </span>
            <p className="font-poppins text-xs font-semibold text-cpc-navy-text">
              {tab === "unread" ? "You're all caught up" : emptyTitle}
            </p>
            <p className="max-w-[16rem] font-poppins text-[11px] leading-relaxed text-cpc-heading-soft">
              {tab === "unread" ? "No unread notifications right now." : emptyHint}
            </p>
          </div>
        )}

        {!showSkeleton && !empty && (
          <div>
            {newItems.length > 0 && (
              <>
                <p className="sticky top-0 z-10 bg-white/95 px-4 py-1.5 font-poppins text-[10px] font-bold tracking-[0.08em] text-cpc-heading-soft uppercase backdrop-blur">
                  New
                </p>
                <ul className="divide-y divide-cpc-input-border/60">
                  {newItems.map(renderItem)}
                </ul>
              </>
            )}

            {earlierItems.length > 0 && (
              <>
                <p className="sticky top-0 z-10 bg-white/95 px-4 py-1.5 font-poppins text-[10px] font-bold tracking-[0.08em] text-cpc-heading-soft uppercase backdrop-blur">
                  Earlier
                </p>
                <ul className="divide-y divide-cpc-input-border/60">
                  {earlierItems.map(renderItem)}
                </ul>
              </>
            )}
          </div>
        )}
      </div>

      {hasMore && (
        <div className="shrink-0 border-t border-cpc-input-border/70 px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg py-2 font-poppins text-[11px] font-semibold text-cpc-blue-accent transition-colors hover:bg-cpc-section-light focus-visible:outline-2 focus-visible:outline-cpc-blue-accent disabled:cursor-wait disabled:opacity-70"
          >
            {isLoadingMore && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
            {isLoadingMore ? "Loading…" : "See earlier notifications"}
          </button>
        </div>
      )}
    </div>
  );
}
