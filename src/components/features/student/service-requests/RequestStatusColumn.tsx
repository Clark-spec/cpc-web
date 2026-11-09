import { NotificationsCard } from "@/components/features/student/service-requests/NotificationsCard";
import { RequestStatusCard } from "@/components/features/student/service-requests/RequestStatusCard";
import type { ServiceRequestsPage } from "@/components/features/student/service-requests/useServiceRequests";

/** Right-hand column: the latest request and the notification feed. */
export function RequestStatusColumn({ page }: { page: ServiceRequestsPage }) {
  return (
    <div className="flex min-w-0 flex-col gap-5 lg:gap-6">
      <RequestStatusCard
        request={page.latestRequest}
        loading={page.loading}
        error={page.error}
        onRetry={page.reload}
      />
      <NotificationsCard
        notifications={page.notifications}
        unread={page.unread}
        loading={page.loading}
        error={page.error}
        onRetry={page.reload}
        onMarkAllRead={page.markAllRead}
      />
    </div>
  );
}
