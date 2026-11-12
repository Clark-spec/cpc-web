import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/cn";
import cpcBg from "@/assets/cpc-bg2.png";
import { PageHeroBanner } from "@/components/common/display/PageHeroBanner";
import { PortalFooter } from "@/components/common/layout/PortalFooter";
import { PortalHeader } from "@/components/common/layout/PortalHeader";
import { ComplaintDetailsModal } from "@/components/features/student/complaint-status/ComplaintDetailsModal";
import { ComplaintStatusList } from "@/components/features/student/complaint-status/ComplaintStatusList";
import { ComplaintStatusSummary } from "@/components/features/student/complaint-status/ComplaintStatusSummary";
import { useComplaintStatus } from "@/components/features/student/complaint-status/useComplaintStatus";

export default function ComplaintStatusPage() {
  const status = useComplaintStatus();
  const [viewComplaintId, setViewComplaintId] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedComplaint = searchParams.get("complaint");
  const busy = status.loading || status.refreshing;

  // Read through the live list so an admin update refreshes an open modal.
  const viewComplaint = viewComplaintId
    ? status.complaints.find((complaint) => complaint.id === viewComplaintId) ?? null
    : null;

  // A notification deep link opens its complaint, then drops the query so a
  // refresh or back navigation does not reopen the modal.
  useEffect(() => {
    if (!requestedComplaint || status.loading) return;

    const match = status.complaints.find(
      (complaint) =>
        complaint.id === requestedComplaint ||
        complaint.referenceNumber === requestedComplaint,
    );
    if (match) setViewComplaintId(match.id);

    const next = new URLSearchParams(searchParams);
    next.delete("complaint");
    setSearchParams(next, { replace: true });
  }, [requestedComplaint, searchParams, setSearchParams, status.complaints, status.loading]);

  return (
    <div className="w-full overflow-x-clip bg-white font-poppins">
      <PortalHeader />

      <PageHeroBanner
        breadcrumbItems={[
          { label: "Home", href: "/student/home" },
          { label: "Student Support", href: null },
          { label: "Online Complaint", href: "/student-support/online-complaint" },
          { label: "Complaint Status", href: null },
        ]}
        eyebrow="STUDENT SUPPORT / COMPLAINT TRACKING"
        title="Complaint Status"
        subtitle="Track the progress of the complaints you filed and read responses from the Student Support Office."
        backgroundImage={cpcBg}
      />

      <main className="w-full bg-sr-page">
        <div className="mx-auto w-full max-w-[1280px] px-4 py-6 sm:px-6 sm:py-8 lg:px-[50px] lg:py-10">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-poppins text-[16px] font-semibold text-sr-text">
                Complaint Overview
              </h2>
              <p className="mt-1 font-poppins text-[11px] leading-[17px] text-sr-muted">
                Counts reflect the complaints linked to your student account.
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
            <ComplaintStatusSummary
              summary={status.summary}
              loading={status.loading}
              error={status.error}
            />
          </div>

          <div className="mt-5">
            <ComplaintStatusList
              filteredComplaints={status.filteredComplaints}
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
              onView={(complaint) => setViewComplaintId(complaint.id)}
              highlightId={status.highlightId}
            />
          </div>
        </div>
      </main>

      <PortalFooter />

      {viewComplaint && (
        <ComplaintDetailsModal
          complaint={viewComplaint}
          onClose={() => setViewComplaintId(null)}
        />
      )}
    </div>
  );
}
