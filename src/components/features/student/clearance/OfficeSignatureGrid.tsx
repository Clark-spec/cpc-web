import { useState } from "react";
import { CalendarOff, Send } from "lucide-react";
import { ConfirmDialog } from "@/components/common/feedback/ConfirmDialog";
import { useActionStatus } from "@/components/ui/action-button";
import { showError } from "@/lib/feedback";
import { OfficeSignatureCard } from "@/components/features/student/clearance/OfficeSignatureCard";
import { CLEARANCE_CLOSED_MESSAGE, useClearance } from "@/components/features/student/clearance/ClearanceContext";

/** Section 4: the five office tiles plus the bulk "Request All" action. */
export function OfficeSignatureGrid() {
  const { offices, requestAll, periodOpen, gradeAcknowledgementStatus } = useClearance();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const requestAllAction = useActionStatus(700);

  const signatoryOffices = offices;
  const notRequested = signatoryOffices.filter((office) => office.status === "not_requested");
  const requestableOffices = notRequested.filter((office) => office.office !== "registrar" || gradeAcknowledgementStatus === "ready");
  const signed = signatoryOffices.filter((office) => office.status === "signed").length;

  async function handleRequestAll() {
    if (requestAllAction.status === "loading" || requestableOffices.length === 0) return;
    requestAllAction.start();
    try {
      await requestAll(requestableOffices.map((office) => office.office));
      requestAllAction.succeed();
      window.setTimeout(() => setConfirmOpen(false), 650);
    } catch (error) {
      requestAllAction.fail();
      showError(
        "Could not send requests",
        error instanceof Error ? error.message : "Today’s request limit may be full. Please try again tomorrow.",
      );
    }
  }

  return (
    <section aria-labelledby="signatures-heading" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2
            id="signatures-heading"
            className="font-poppins text-lg font-bold text-cpc-navy-text"
          >
            Office Signatures
          </h2>
          <p className="mt-0.5 font-poppins text-xs text-cpc-heading-soft">
            Request endorsement from each required department. {signed} of {signatoryOffices.length} offices have signed. Each office accepts up to 1,000 requests per day.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          disabled={requestableOffices.length === 0 || !periodOpen}
          className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/80 bg-white/80 px-4 py-2 font-poppins text-xs font-semibold text-cpc-navy-text shadow-xs backdrop-blur-xs transition-all hover:border-cpc-tile-border hover:bg-white hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent disabled:cursor-not-allowed disabled:border-cpc-tile-border/40 disabled:bg-white/40 disabled:text-cpc-heading-soft/60 disabled:shadow-none"
        >
          {periodOpen ? (
            <Send className="h-3.5 w-3.5 text-cpc-blue-accent" aria-hidden />
          ) : (
            <CalendarOff className="h-3.5 w-3.5 text-amber-600" aria-hidden />
          )}
          <span>{periodOpen ? "Request All Signatures" : CLEARANCE_CLOSED_MESSAGE}</span>
          {periodOpen && requestableOffices.length > 0 && (
            <span className="rounded-full bg-cpc-section-light px-2 py-0.5 text-[10px] font-bold text-cpc-blue-accent shadow-2xs">
              {requestableOffices.length}
            </span>
          )}
        </button>
        <a href="/display/office-signatures" target="_blank" rel="noopener" onClick={(event) => { event.preventDefault(); window.open("/display/office-signatures", "_blank", "noopener"); }} className="inline-flex items-center rounded-xl border border-cpc-blue-accent/30 bg-white/80 px-4 py-2 font-poppins text-xs font-semibold text-cpc-blue-accent hover:bg-white">View live Office Signatures board</a>
      </div>

      <div className="grid items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {signatoryOffices.map((office) => (
          <OfficeSignatureCard key={office.office} office={office} />
        ))}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleRequestAll}
        title="Request all signatures?"
        confirmLabel="Send Requests"
        loadingLabel="Sending…"
        successLabel="Sent"
        confirmStatus={requestAllAction.status}
        id="request-all-title"
        description={
          <>
            <p>
              This sends a signature request to the{" "}
              <span className="font-semibold text-cpc-navy-text">
                {requestableOffices.length} {requestableOffices.length === 1 ? "office" : "offices"}
              </span>{" "}
              that {requestableOffices.length === 1 ? "has" : "have"} not been requested yet.
            </p>
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {requestableOffices.map((office) => (
                <li
                  key={office.office}
                  className="rounded-full border border-cpc-tile-border bg-cpc-section-light px-2.5 py-1 font-poppins text-[11px] font-medium text-cpc-label"
                >
                  {office.label}
                </li>
              ))}
            </ul>
          </>
        }
      />
    </section>
  );
}
