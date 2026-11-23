import { useState } from "react";
import { ArrowRight, CalendarOff, CheckCircle2, Send } from "lucide-react";
import { Link } from "react-router";
import { ConfirmDialog } from "@/components/common/feedback/ConfirmDialog";
import { Modal } from "@/components/ui/modal";
import { useActionStatus } from "@/components/ui/action-button";
import { showError } from "@/lib/feedback";
import { OfficeSignatureCard } from "@/components/features/student/clearance/OfficeSignatureCard";
import { CLEARANCE_CLOSED_MESSAGE, useClearance } from "@/components/features/student/clearance/ClearanceContext";
import { SignatureQueuePreview } from "@/components/features/signatureQueues/SignatureQueuePreview";

function wasCompletionPromptDismissed(key: string) {
  try {
    return window.sessionStorage.getItem(key) === "true";
  } catch {
    return false;
  }
}

/** Section 4: the five office tiles plus the bulk "Request All" action. */
export function OfficeSignatureGrid() {
  const { offices, requestAll, periodOpen, gradeAcknowledgementStatus, isCleared, student, referenceNumber } = useClearance();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [completionPromptClosing, setCompletionPromptClosing] = useState(false);
  const completionPromptKey = `cpc-clearance-complete-prompt:${student.studentId}:${referenceNumber}`;
  const [completionPromptState, setCompletionPromptState] = useState(() => ({
    key: completionPromptKey,
    dismissed: wasCompletionPromptDismissed(completionPromptKey),
  }));
  const completionPromptDismissed = completionPromptState.key === completionPromptKey
    ? completionPromptState.dismissed
    : wasCompletionPromptDismissed(completionPromptKey);
  const requestAllAction = useActionStatus(700);

  const signatoryOffices = offices;
  const notRequested = signatoryOffices.filter((office) => office.status === "not_requested");
  const otherOfficesSigned = signatoryOffices
    .filter((office) => office.office !== "registrar")
    .every((office) => office.status === "signed");
  const requestableOffices = notRequested.filter(
    (office) => office.office !== "registrar" || (otherOfficesSigned && gradeAcknowledgementStatus === "ready"),
  );
  const signed = signatoryOffices.filter((office) => office.status === "signed").length;

  function dismissCompletionPrompt() {
    if (completionPromptClosing || completionPromptDismissed) return;
    try {
      window.sessionStorage.setItem(completionPromptKey, "true");
    } catch {
      // Keep the dismissal in component state if session storage is unavailable.
    }
    setCompletionPromptState({ key: completionPromptKey, dismissed: false });
    setCompletionPromptClosing(true);
    window.setTimeout(() => {
      setCompletionPromptState({ key: completionPromptKey, dismissed: true });
      setCompletionPromptClosing(false);
    }, 280);
  }

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
      <div className="rounded-2xl border border-blue-100 bg-white/90 p-4 shadow-sm sm:p-5">
        <h2 className="font-poppins text-sm font-bold text-cpc-navy-text">Your Clearance steps</h2>
        <p className="mt-1 text-xs leading-relaxed text-cpc-heading-soft">
          Request signatures from all five offices and follow each office’s queue number. Registrar becomes available after Dean, SAO / SSG Adviser, Library, and Accounting have signed and your posted grades are acknowledged.
        </p>
        <p role="status" className={`mt-3 rounded-xl px-3 py-2.5 text-xs font-medium ${isCleared ? "border border-emerald-200 bg-emerald-50 text-emerald-900" : "border border-amber-200 bg-amber-50 text-amber-900"}`}>
          {isCleared
            ? "Clearance is complete. All five signatures are recorded. You can continue to your enrollment form."
            : `Enrollment is blocked until all five office signatures are complete. ${signed} of ${signatoryOffices.length} are signed; ${signatoryOffices.length - signed} remaining.`}
        </p>
        {isCleared && (
          <Link to="/student/enrollment-form" className="mt-3 inline-flex items-center gap-2 rounded-lg bg-cpc-blue-accent px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-cpc-navy">
            Continue to Enrollment <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        )}
      </div>

      <SignatureQueuePreview workflow="office_signatures" />

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
      </div>

      <div className="grid items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {signatoryOffices.map((office) => (
          <OfficeSignatureCard key={office.office} office={office} />
        ))}
        {isCleared && completionPromptDismissed && (
          <article key="next-enrollment" className="clearance-enrollment-card-in group flex h-full min-h-[220px] flex-col justify-between rounded-2xl border border-blue-200 bg-gradient-to-br from-white to-blue-50/80 p-5 shadow-[0_4px_20px_rgba(15,36,104,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(43,75,209,0.12)]">
            <div>
              <header className="flex items-center justify-between gap-2.5">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-cpc-blue-accent"><CheckCircle2 className="h-4 w-4" aria-hidden /></span>
                  <h3 className="font-poppins text-sm font-semibold text-cpc-navy-text">Next: Online Enrollment</h3>
                </div>
                <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">Ready</span>
              </header>
              <p className="mt-3 font-poppins text-[11px] leading-relaxed text-cpc-heading-soft">All five offices have signed your clearance. Continue to your online enrollment form.</p>
            </div>
            <Link to="/student/enrollment-form" className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-cpc-blue-accent px-4 py-2.5 font-poppins text-xs font-semibold text-white shadow-sm transition hover:bg-cpc-navy">
              Enroll Now <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </article>
        )}
      </div>

      <Modal open={isCleared && !completionPromptDismissed} onClose={dismissCompletionPrompt} labelledBy="clearance-complete-title" className={`sm:max-w-md ${completionPromptClosing ? "clearance-completion-modal-shrink" : ""}`}>
        <div className="p-6 sm:p-7">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600"><CheckCircle2 className="h-6 w-6" aria-hidden /></div>
          <h2 id="clearance-complete-title" className="mt-4 font-poppins text-xl font-bold text-cpc-navy-text">Clearance complete</h2>
          <p className="mt-2 font-poppins text-sm leading-relaxed text-cpc-heading-soft">All five office signatures are recorded. You can now proceed to Online Enrollment.</p>
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={dismissCompletionPrompt} className="inline-flex items-center justify-center rounded-xl border border-cpc-tile-border bg-white px-4 py-2.5 font-poppins text-sm font-semibold text-cpc-navy-text transition hover:bg-cpc-section-light">Back</button>
            <Link to="/student/enrollment-form" onClick={dismissCompletionPrompt} className="inline-flex items-center justify-center gap-2 rounded-xl bg-cpc-blue-accent px-4 py-2.5 font-poppins text-sm font-semibold text-white shadow-sm transition hover:bg-cpc-navy">Enroll Now <ArrowRight className="h-4 w-4" aria-hidden /></Link>
          </div>
        </div>
      </Modal>

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
