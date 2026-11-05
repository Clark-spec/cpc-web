import { cn } from "@/lib/cn";
import type { ServiceRequestNotification } from "@/services/student/serviceRequests";
import { formatRelativeTime } from "../utils/format";

type NotificationsCardProps = {
  notifications: ServiceRequestNotification[];
  unread: number;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onMarkAllRead: () => void;
};

const DOT_COLORS: Record<string, string> = {
  request_submitted: "bg-sr-success",
  request_under_review: "bg-sr-processing",
  request_processing: "bg-sr-processing",
  request_ready: "bg-[#6B46C1]",
  request_released: "bg-sr-success",
  request_rejected: "bg-sr-danger",
};

function BellIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M6 9a6 6 0 0 1 12 0c0 4.5 1.5 6 1.5 6h-15S6 13.5 6 9Z" />
      <path d="M10 18.5a2 2 0 0 0 4 0" />
    </svg>
  );
}

export function NotificationsCard({
  notifications,
  unread,
  loading,
  error,
  onRetry,
  onMarkAllRead,
}: NotificationsCardProps) {
  return (
    <section className="sr-card p-5 sm:p-6" aria-labelledby="notifications-title">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="notifications-title" className="font-poppins text-[15px] font-semibold text-sr-text">
            Notifications
          </h2>
          <p className="mt-1 font-poppins text-[11px] leading-[17px] text-sr-muted">
            Updates on your requests
          </p>
        </div>

        {unread > 0 && (
          <button
            type="button"
            onClick={onMarkAllRead}
            className="rounded-md px-2 py-1 font-poppins text-[11px] font-semibold text-sr-primary transition-colors hover:bg-sr-section"
          >
            Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className="mt-4 space-y-3" aria-hidden>
          <div className="h-11 animate-pulse rounded bg-sr-section" />
          <div className="h-11 animate-pulse rounded bg-sr-section" />
        </div>
      ) : error ? (
        <div className="mt-4 rounded-lg border border-[#F8CBCB] bg-[#FDECEC] px-3 py-3">
          <p className="font-poppins text-[11px] leading-[16px] text-[#C53030]">{error}</p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-2 rounded-md border border-[#F8CBCB] bg-white px-2.5 py-1 font-poppins text-[11px] font-semibold text-[#C53030]"
          >
            Try again
          </button>
        </div>
      ) : notifications.length === 0 ? (
        <div className="mt-4 flex flex-col items-center rounded-lg border border-dashed border-sr-border bg-[#F8FAFF] px-4 py-7 text-center">
          <BellIcon className="h-6 w-6 text-sr-muted" />
          <p className="mt-2 font-poppins text-[12px] font-semibold text-sr-text">No notifications yet</p>
          <p className="mt-1 max-w-[200px] font-poppins text-[11px] leading-[16px] text-sr-muted">
            You will be notified when your request status changes.
          </p>
        </div>
      ) : (
        <ul className="-mx-1 mt-3 max-h-[300px] overflow-y-auto">
          {notifications.map((item, index) => (
            <li
              key={item.id}
              className={cn(
                "flex gap-2.5 rounded-md px-2 py-2.5",
                index > 0 && "border-t border-sr-border",
                !item.isRead && "bg-[#F8FAFF]",
              )}
            >
              <span
                className={cn(
                  "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                  DOT_COLORS[item.type] ?? "bg-sr-processing",
                )}
                aria-hidden
              />
              <div className="min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <p
                    className={cn(
                      "font-poppins text-[12px] leading-[16px] text-sr-text",
                      item.isRead ? "font-medium" : "font-semibold",
                    )}
                  >
                    {item.title}
                  </p>
                  <span className="shrink-0 font-poppins text-[10px] text-sr-muted">
                    {formatRelativeTime(item.createdAt)}
                  </span>
                </div>
                <p className="mt-0.5 font-poppins text-[11px] leading-[16px] text-sr-muted">
                  {item.message}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
