import { useState } from "react";
import { NewRequestForm } from "@/components/features/student/service-requests/NewRequestForm";
import { RequestHistoryTable } from "@/components/features/student/service-requests/RequestHistoryTable";
import { RequestStatusColumn } from "@/components/features/student/service-requests/RequestStatusColumn";
import { SavedDraftCard } from "@/components/features/student/service-requests/SavedDraftCard";
import type { ServiceRequestsPage } from "@/components/features/student/service-requests/useServiceRequests";
import type { RequestId } from "@/services/serviceRequests/types";

type ServiceRequestsMainProps = {
  page: ServiceRequestsPage;
  onViewRequest: (requestId: RequestId) => void;
};

/** Request form, status column, and the full request history. */
export function ServiceRequestsMain({ page, onViewRequest }: ServiceRequestsMainProps) {
  // Remounting the form is the simplest way to clear every field after a
  // discard made from the draft card, which lives outside the form.
  const [formKey, setFormKey] = useState(0);

  async function handleDraftDiscard() {
    const discarded = await page.discardDraft();
    if (discarded) setFormKey((key) => key + 1);
  }

  return (
    <main className="w-full bg-sr-page">
      <div className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-[50px] lg:py-10">
        {page.draft && !page.loading && (
          <SavedDraftCard
            draft={page.draft}
            services={page.services}
            saving={page.savingDraft}
            discarding={page.discardingDraft}
            onDiscard={handleDraftDiscard}
          />
        )}

        <div className="grid gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-6">
          <NewRequestForm
            key={formKey}
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

          <RequestStatusColumn page={page} />
        </div>

        <div id="request-history" className="mt-5 scroll-mt-24 lg:mt-6">
          <RequestHistoryTable
            requests={page.requests}
            loading={page.loading}
            error={page.error}
            onRetry={page.reload}
            onView={onViewRequest}
            highlightId={page.highlightId}
          />
        </div>
      </div>
    </main>
  );
}
