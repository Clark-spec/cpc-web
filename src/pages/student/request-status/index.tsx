import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/cn";
import cpcBg from "@/assets/cpc-bg2.png";
import { PageHeroBanner } from "@/components/common/display/PageHeroBanner";
import { PortalFooter } from "@/components/common/layout/PortalFooter";
import { PortalHeader } from "@/components/common/layout/PortalHeader";
import { RequestDetailsModal } from "@/components/features/student/service-requests/RequestDetailsModal";
import { RequestStatusList } from "@/components/features/student/request-status/RequestStatusList";
import { StatusSummaryCards } from "@/components/features/student/request-status/StatusSummaryCards";
import { useRequestStatus } from "@/components/features/student/request-status/useRequestStatus";
import type { RequestId } from "@/services/serviceRequests/types";

export default function RequestStatusPage() {
  const status = useRequestStatus();
  const [viewRequestId, setViewRequestId] = useState<RequestId | null>(null);
  const busy = status.loading || status.refreshing;

  return (
    <div className="w-full overflow-x-clip bg-white font-poppins">
      <PortalHeader />

      <PageHeroBanner
        breadcrumbItems={[
          { label: "Home", href: "/student/home" },
          { label: "Student Services", href: null },
          { label: "Service Requests", href: "/student/service-requests" },
          { label: "Request Status", href: null },
        ]}
        eyebrow="STUDENT SERVICES / REQUEST TRACKING"
        title="Request Status"
        subtitle="Track and monitor the progress of your submitted service requests."
        backgroundImage={cpcBg}
      />

      <main className="w-full bg-sr-page">
        <div className="mx-auto w-full max-w-[1280px] px-4 py-6 sm:px-6 sm:py-8 lg:px-[50px] lg:py-10">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-poppins text-[16px] font-semibold text-sr-text">
                Request Overview
              </h2>
              <p className="mt-1 font-poppins text-[11px] leading-[17px] text-sr-muted">
                Counts reflect the service requests linked to your student account.
              </p>
            </div>
            <button
              type="button"
              onClick={status.reload}
              disabled={busy}
              className="cpc-btn cpc-btn-secondary"
            >
              <RefreshCw
                className={cn("h-4 w-4", busy && "animate-spin")}
                aria-hidden
              />
              {status.refreshing ? "Refreshing…" : "Refresh"}
            </button>
          </div>

          <div className="mt-3.5">
            <StatusSummaryCards
              summary={status.summary}
              loading={status.loading}
              error={status.error}
            />
          </div>

          <div className="mt-5">
            <RequestStatusList
              filteredRequests={status.filteredRequests}
              total={status.summary.total}
              statusCounts={status.statusCounts}
              loading={status.loading}
              error={status.error}
              query={status.query}
              statusFilter={status.statusFilter}
              hasFilters={status.hasFilters}
              onQueryChange={status.setQuery}
              onStatusFilterChange={status.setStatusFilter}
              onClearFilters={status.clearFilters}
              onRetry={status.reload}
              onView={(id) => setViewRequestId(id)}
            />
          </div>
        </div>
      </main>

      <PortalFooter />

      {viewRequestId !== null && (
        <RequestDetailsModal requestId={viewRequestId} onClose={() => setViewRequestId(null)} />
      )}
    </div>
  );
}
