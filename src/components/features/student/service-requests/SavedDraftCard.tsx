import { ArrowRight, FileClock, Loader2 } from "lucide-react";
import type {
  ServiceOption,
  ServiceRequestDraft,
} from "@/services/serviceRequests/student";
import { formatFileSize, formatRelativeTime } from "@/components/features/student/service-requests/format";

type SavedDraftCardProps = {
  draft: ServiceRequestDraft;
  services: ServiceOption[];
  saving: boolean;
  discarding: boolean;
  onDiscard: () => void;
};

/** Banner that proves a draft exists and lets the student jump back into it. */
export function SavedDraftCard({
  draft,
  services,
  saving,
  discarding,
  onDiscard,
}: SavedDraftCardProps) {
  const serviceName =
    services.find((service) => service.id === draft.serviceId)?.name ?? "Service not selected";
  const documentLabel = draft.document
    ? `${draft.document.name} · ${formatFileSize(draft.document.size)}`
    : "Not uploaded";
  const savedLabel = formatRelativeTime(draft.updatedAt);

  function handleContinue() {
    const section = document.getElementById("new-request-form");
    if (!section) return;

    const startY = window.scrollY;
    section.scrollIntoView({ behavior: "smooth", block: "start" });

    const target = !draft.serviceId
      ? "#service-select"
      : !draft.purpose
        ? "#purpose-select"
        : "#notes-input";

    window.setTimeout(() => {
      // Embedded browsers can ignore smooth scrolling; make sure the form is
      // actually in view before moving focus into it.
      if (Math.abs(window.scrollY - startY) < 2) {
        section.scrollIntoView({ block: "start" });
      }
      document.querySelector<HTMLElement>(target)?.focus({ preventScroll: true });
    }, 350);
  }

  return (
    <section
      aria-labelledby="saved-draft-title"
      className="sr-card mb-5 border-l-[3px] border-l-[#F2A23A] p-4 sm:p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#FEF4E2] text-[#B7791F]">
            <FileClock className="h-4.5 w-4.5" aria-hidden />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2
                id="saved-draft-title"
                className="font-poppins text-[14px] font-semibold text-sr-text"
              >
                Saved draft
              </h2>
              <span className="rounded-full border border-[#F6DEB4] bg-[#FEF4E2] px-2 py-0.5 font-poppins text-[10px] font-semibold text-[#B7791F]">
                {savedLabel ? `Saved ${savedLabel}` : "Saved"}
              </span>
            </div>
            <p className="mt-0.5 font-poppins text-[11px] leading-[16px] text-sr-muted">
              Your answers are saved but not submitted. Pick up where you left off any time.
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={onDiscard}
            disabled={saving || discarding}
            className="rounded-md px-2 py-1 font-poppins text-[11px] font-semibold text-sr-muted transition-colors hover:bg-sr-page hover:text-sr-danger disabled:opacity-60"
          >
            {discarding ? "Discarding…" : "Discard"}
          </button>
          <button
            type="button"
            onClick={handleContinue}
            className="cpc-btn cpc-btn-primary cpc-btn-sm"
          >
            Continue draft
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 rounded-lg bg-sr-section px-3 py-2.5 sm:grid-cols-4">
        {[
          { label: "Service", value: serviceName },
          { label: "Copies", value: String(draft.copies) },
          { label: "Purpose", value: draft.purpose || "Not selected" },
          { label: "Student ID", value: documentLabel },
        ].map((item) => (
          <div key={item.label} className="min-w-0">
            <dt className="font-poppins text-[9.5px] font-semibold tracking-[0.08em] text-sr-muted uppercase">
              {item.label}
            </dt>
            <dd
              className="mt-0.5 truncate font-poppins text-[11.5px] font-semibold text-sr-text"
              title={item.value}
            >
              {item.value}
            </dd>
          </div>
        ))}
      </dl>

      {draft.notes.trim() && (
        <p className="mt-2 line-clamp-2 rounded-md border border-sr-border bg-white px-3 py-2 font-poppins text-[11px] leading-[16px] text-sr-muted">
          “{draft.notes.trim()}”
        </p>
      )}

      {saving && (
        <p className="mt-2 flex items-center gap-1.5 font-poppins text-[10.5px] text-sr-muted">
          <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
          Saving your latest changes…
        </p>
      )}
    </section>
  );
}
