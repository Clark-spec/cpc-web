import { useEffect, useRef, useState } from "react";
import { Footer } from "@/components/common/footer";
import { Navbar } from "@/components/common/navbar";
import { TopBar } from "@/components/features/student/home/top-bar";
import { PageHeroBanner } from "@/components/features/online-enrollment/components/PageHeroBanner";
import { NewRequestForm } from "@/components/features/student/service-requests/NewRequestForm";
import { NotificationsCard } from "@/components/features/student/service-requests/NotificationsCard";
import { RequestDetailsModal } from "@/components/features/student/service-requests/RequestDetailsModal";
import { RequestHistoryTable } from "@/components/features/student/service-requests/RequestHistoryTable";
import { RequestStatusCard } from "@/components/features/student/service-requests/RequestStatusCard";
import { useServiceRequestsPage } from "@/components/features/student/service-requests/useServiceRequests";
import cpcBg from "@/assets/cpc-bg2.png";

function NoticeBanner({
  kind,
  message,
  onDismiss,
}: {
  kind: "success" | "error";
  message: string;
  onDismiss: () => void;
}) {
  return (
    <div
      role={kind === "error" ? "alert" : "status"}
      className={
        kind === "success"
          ? "mb-5 flex items-start justify-between gap-3 rounded-lg border border-[#C4EBD9] bg-[#E9F9F1] px-4 py-3"
          : "mb-5 flex items-start justify-between gap-3 rounded-lg border border-[#F8CBCB] bg-[#FDECEC] px-4 py-3"
      }
    >
      <p
        className={
          kind === "success"
            ? "font-poppins text-[12px] leading-[18px] text-[#1E8A57]"
            : "font-poppins text-[12px] leading-[18px] text-[#C53030]"
        }
      >
        {message}
      </p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss message"
        className={
          kind === "success"
            ? "shrink-0 rounded-md px-1.5 py-0.5 font-poppins text-[11px] font-semibold text-[#1E8A57] hover:bg-[#D6F3E5]"
            : "shrink-0 rounded-md px-1.5 py-0.5 font-poppins text-[11px] font-semibold text-[#C53030] hover:bg-[#FADADA]"
        }
      >
        Dismiss
      </button>
    </div>
  );
}

export default function ServiceRequestsPage() {
  const page = useServiceRequestsPage();
  const [viewRequestId, setViewRequestId] = useState<number | null>(null);
  const noticeRef = useRef<HTMLDivElement>(null);

  // Submission feedback is rendered above the cards, so bring it into view.
  useEffect(() => {
    if (page.notice) {
      noticeRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [page.notice]);

  return (
    <div className="w-full overflow-x-hidden bg-white font-poppins">
      <header className="relative z-30">
        <TopBar />
        <Navbar />
      </header>

      <PageHeroBanner
        breadcrumbItems={[
          { label: "Home", href: "/" },
          { label: "Student Services", href: "/student/home" },
          { label: "Service Requests", href: null },
        ]}
        eyebrow="STUDENT SERVICES"
        title="Service Requests"
        subtitle="Submit a request for school services or documents and easily track its progress."
        backgroundImage={cpcBg}
      />

      <main className="w-full bg-sr-page">
        <div className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-[50px] lg:py-10">
          {page.notice && (
            <div ref={noticeRef}>
              <NoticeBanner
                kind={page.notice.kind}
                message={page.notice.message}
                onDismiss={page.clearNotice}
              />
            </div>
          )}

          <div className="grid gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-6">
            <NewRequestForm
              services={page.services}
              purposes={page.purposes}
              draft={page.draft}
              submitting={page.submitting}
              savingDraft={page.savingDraft}
              progress={page.progress}
              catalogLoading={page.loading}
              catalogError={page.error}
              onSubmit={page.submit}
              onSaveDraft={page.save}
              onDiscardDraft={page.discardDraft}
            />

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
          </div>

          <div className="mt-5 lg:mt-6">
            <RequestHistoryTable
              requests={page.requests}
              loading={page.loading}
              error={page.error}
              onRetry={page.reload}
              onView={(id) => setViewRequestId(id)}
            />
          </div>
        </div>
      </main>

      <Footer />

      {viewRequestId !== null && (
        <RequestDetailsModal requestId={viewRequestId} onClose={() => setViewRequestId(null)} />
      )}
    </div>
  );
}
