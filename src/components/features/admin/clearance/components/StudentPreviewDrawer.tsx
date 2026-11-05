import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, CheckCircle2, Clock3, Eye, X, XCircle } from "lucide-react";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/utils/format";
import { useClearanceAdmin } from "../context/ClearanceAdminContext";
import type { OfficeSignature } from "../types";

type StudentPreviewDrawerProps = {
  open: boolean;
  onClose: () => void;
};

const HANDWRITING = '"Dancing Script", "Segoe Script", cursive';

/**
 * (2) Shared-storage contract proof: this renders the exact card grid the
 * student portal builds from `record.offices`, so staff can confirm a freshly
 * stamped signature (image, signer name, date, remarks) is what the student
 * actually sees. `OfficeSignatureCard` is bound to the student context
 * (`useClearance`), so this is a read-only local equivalent with identical
 * markup and classes.
 */
export function StudentPreviewDrawer({ open, onClose }: StudentPreviewDrawerProps) {
  const { selectedRecord } = useClearanceAdmin();
  const closeRef = useRef<HTMLButtonElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  /* Same behaviour as StudentQuickViewDrawer: focus in, Escape, focus back. */
  useEffect(() => {
    if (!open) return;

    previouslyFocused.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const frame = window.requestAnimationFrame(() => closeRef.current?.focus());

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  const signedCount = selectedRecord
    ? selectedRecord.offices.filter((office) => office.status === "signed").length
    : 0;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex justify-end">
      <div
        className="admin-drawer-backdrop absolute inset-0 bg-cpc-navy-deep/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={
          selectedRecord ? `Preview as student for ${selectedRecord.studentName}` : "Preview as student"
        }
        className="relative flex h-full w-full max-w-xl flex-col bg-white shadow-[0_24px_80px_rgba(15,36,104,0.35)]"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-cpc-tile-border/70 bg-cpc-bg px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cpc-navy text-white">
              <Eye className="h-4 w-4" aria-hidden />
            </span>
            <div className="min-w-0">
              <h2 className="font-poppins text-base font-semibold text-cpc-navy-text">
                Preview as student
              </h2>
              <p className="mt-0.5 font-poppins text-[11px] leading-snug break-words text-cpc-heading-soft">
                {selectedRecord
                  ? `Preview as student — this is exactly what ${selectedRecord.studentName} sees.`
                  : "Read-only preview of the selected student's Online Clearance page."}
              </p>
            </div>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close student preview"
            className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-cpc-heading-soft transition-colors hover:bg-white hover:text-cpc-navy-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="admin-scrollbar min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {!selectedRecord ? (
            <p className="rounded-xl border border-dashed border-cpc-tile-border/70 px-4 py-8 text-center font-poppins text-xs text-cpc-heading-soft">
              Select a request in the queue first — the preview follows the selected student.
            </p>
          ) : (
            <>
              <div className="rounded-xl border border-cpc-tile-border/70 bg-cpc-section-light/40 px-4 py-3">
                <p className="font-poppins text-xs text-cpc-heading-soft">
                  <span className="font-semibold text-cpc-navy-text">{selectedRecord.studentName}</span>{" "}
                  · {selectedRecord.studentId} · {selectedRecord.program} ·{" "}
                  {selectedRecord.yearLevel} · {selectedRecord.section}
                </p>
                <p className="mt-0.5 font-poppins text-[11px] text-cpc-heading-soft">
                  {selectedRecord.term} Semester · AY {selectedRecord.academicYear} · read-only
                </p>
              </div>

              <section aria-labelledby="preview-signatures-heading" className="mt-4">
                <h3
                  id="preview-signatures-heading"
                  className="font-poppins text-base font-bold text-cpc-navy-text"
                >
                  Signatures
                </h3>
                <p className="mt-1 font-poppins text-xs text-cpc-heading-soft">
                  Request each office to sign. {signedCount} of {selectedRecord.offices.length}{" "}
                  offices have signed.
                </p>

                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  {selectedRecord.offices.map((office) => (
                    <PreviewOfficeCard key={office.office} office={office} />
                  ))}
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

/** Read-only twin of the student `OfficeSignatureCard` (same markup/classes). */
function PreviewOfficeCard({ office }: { office: OfficeSignature }) {
  const signed = office.status === "signed";
  const requested = office.status === "requested";
  const rejected = office.status === "rejected";

  const badge = signed ? (
    <Badge tone="success">
      <CheckCircle2 className="h-3 w-3" aria-hidden />
      Signed
    </Badge>
  ) : requested ? (
    <Badge tone="warning">
      <Clock3 className="h-3 w-3" aria-hidden />
      Awaiting Signature
    </Badge>
  ) : rejected ? (
    <Badge tone="danger">
      <AlertTriangle className="h-3 w-3" aria-hidden />
      Needs Action
    </Badge>
  ) : (
    <Badge tone="neutral">
      <XCircle className="h-3 w-3" aria-hidden />
      Not Requested
    </Badge>
  );

  return (
    <article
      tabIndex={-1}
      className={cn(
        "flex min-h-[200px] flex-col rounded-xl border bg-white p-4 shadow-sm outline-none transition-colors motion-reduce:animate-none",
        signed ? "border-emerald-200" : "border-cpc-input-border",
      )}
    >
      <header className="flex items-start justify-between gap-2">
        <h4 className="font-poppins text-sm leading-snug font-semibold text-cpc-navy-text sm:text-[15px]">
          {office.label}
        </h4>
        {badge}
      </header>

      {signed ? (
        <>
          <p className="mt-2 font-poppins text-xs text-cpc-blue-accent">
            Digitally signed · {formatDateTime(office.respondedAt ?? new Date().toISOString())}
          </p>
          {office.signerName && (
            <p className="mt-1 font-poppins text-xs text-cpc-heading-soft">
              Signed by <span className="font-semibold text-cpc-navy-text">{office.signerName}</span>
            </p>
          )}

          <div className="mt-3 flex flex-1 items-center justify-center rounded-lg bg-cpc-section-light/50 p-2">
            {office.signatureImage ? (
              <img
                src={office.signatureImage}
                alt={`${office.signerName ?? office.label} signature`}
                className="max-h-20 w-auto max-w-full object-contain"
              />
            ) : (
              <span
                aria-hidden
                className="text-2xl leading-none text-cpc-navy-text"
                style={{ fontFamily: HANDWRITING }}
              >
                {office.signerName ?? office.label}
              </span>
            )}
          </div>

          {office.remarks && (
            <p className="mt-2 rounded-md bg-cpc-section-light/70 px-2 py-1.5 font-poppins text-[11px] leading-relaxed text-cpc-heading-soft">
              Office remarks: &ldquo;{office.remarks}&rdquo;
            </p>
          )}
        </>
      ) : requested ? (
        <div className="mt-3 flex flex-1 flex-col justify-between gap-3">
          <div>
            <p className="font-poppins text-xs text-cpc-heading-soft">
              Requested on {formatDateTime(office.requestedAt ?? new Date().toISOString())}
            </p>
            {office.studentNote && (
              <p className="mt-1.5 rounded-md bg-cpc-section-light/70 px-2 py-1.5 font-poppins text-[11px] leading-relaxed text-cpc-heading-soft">
                Your note: &ldquo;{office.studentNote}&rdquo;
              </p>
            )}
          </div>
          <p className="rounded-lg border border-cpc-tile-border bg-cpc-section-light/50 px-3 py-2 text-center font-poppins text-xs font-semibold text-cpc-heading-soft">
            Awaiting signature (read-only preview)
          </p>
        </div>
      ) : rejected ? (
        <div className="mt-3 flex flex-1 flex-col justify-between gap-3">
          <div role="note" className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-2">
            <p className="flex items-center gap-1.5 font-poppins text-[11px] font-semibold text-rose-700">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden />
              What needs action?
            </p>
            <p className="mt-1 font-poppins text-xs leading-relaxed text-rose-700">
              {office.remarks ?? "The office needs more information before signing."}
            </p>
          </div>
          <p className="text-center font-poppins text-[11px] text-cpc-heading-soft">
            The student can press &ldquo;Request Again&rdquo; on this card.
          </p>
        </div>
      ) : (
        <div className="mt-3 flex flex-1 flex-col justify-between gap-3">
          <p className="font-poppins text-xs leading-relaxed text-cpc-heading-soft">
            No request sent yet. Ask this office to review and sign your clearance.
          </p>
          <p className="text-center font-poppins text-[11px] text-cpc-heading-soft">
            The student&rsquo;s &ldquo;Request Signature&rdquo; button appears on this card.
          </p>
        </div>
      )}
    </article>
  );
}
