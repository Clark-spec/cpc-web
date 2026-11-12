import { useState } from "react";
import { AlertCircle, Info, Loader2, XCircle } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/cn";
import { useClearanceAdmin } from "@/components/features/admin/clearance/ClearanceAdminContext";
import { OFFICE_LABELS } from "@/components/features/admin/clearance/officeChecks";
import type { ClearanceRequestRow } from "@/components/features/admin/clearance/types";

const REASONS = [
  "Unreturned library books",
  "Outstanding balance",
  "Missing event attendance",
  "Incomplete requirements",
  "Other",
] as const;

const MIN_REMARKS = 10;
const MAX_REMARKS = 200;

/** Remarks the student sees: the reason plus what they must do next. */
function buildRemarks(remarks: string, action: string): string {
  const base = remarks.trim();
  const nextStep = action.trim();
  if (!nextStep) return base;
  return `${base}${base ? " " : ""}Action needed: ${nextStep}`;
}

type RejectModalProps = {
  row: ClearanceRequestRow | null;
  open: boolean;
  onClose: () => void;
};

/**
 * Reject flow: remarks (min 10 / max 200) plus an optional "what the student
 * must do" line are written to the shared record, so they appear on the
 * student's rejected office card.
 */
export function RejectModal({ row, open, onClose }: RejectModalProps) {
  if (!row) return null;

  return (
    <Modal open={open} onClose={onClose} labelledBy="reject-title" className="sm:max-w-lg">
      <RejectBody key={row.id} row={row} onClose={onClose} />
    </Modal>
  );
}

function RejectBody({ row, onClose }: { row: ClearanceRequestRow; onClose: () => void }) {
  const { busy, reject } = useClearanceAdmin();
  const [remarks, setRemarks] = useState("");
  const [action, setAction] = useState("");

  const finalRemarks = buildRemarks(remarks, action);
  const trimmedBase = remarks.trim();

  const tooShort = trimmedBase.length < MIN_REMARKS;
  const tooLong = finalRemarks.length > MAX_REMARKS;
  const canConfirm = !tooShort && !tooLong && !busy;

  const confirm = async () => {
    if (!canConfirm) return;
    const rejected = await reject(row, finalRemarks);
    if (rejected) onClose();
  };

  return (
    <div className="p-5 sm:p-6">
      <div className="pr-8">
        <h2 id="reject-title" className="font-poppins text-lg font-semibold text-cpc-navy-text">
          Reject {row.studentName}'s request
        </h2>
        <p className="mt-1 font-poppins text-xs leading-relaxed text-cpc-heading-soft">
          {OFFICE_LABELS[row.office]} · {row.section}. The student sees your remarks on their
          clearance card and can request again after fixing them.
        </p>
      </div>

      <div>
        <span id="reject-reason-label" className="font-poppins text-[11px] font-semibold text-cpc-navy-text">
          Common reasons
        </span>
        <div role="group" aria-labelledby="reject-reason-label" className="mt-1.5 flex flex-wrap gap-1.5">
          {REASONS.map((reason) => {
            const active = trimmedBase === reason;
            return (
              <button
                key={reason}
                type="button"
                aria-pressed={active}
                onClick={() => setRemarks(reason)}
                className={cn(
                  "cursor-pointer rounded-full border px-2.5 py-1 font-poppins text-[11px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent motion-reduce:animate-none",
                  active
                    ? "border-rose-200 bg-rose-50 text-rose-700"
                    : "border-cpc-tile-border bg-white text-cpc-heading-soft hover:bg-cpc-section-light/60 hover:text-cpc-navy-text",
                )}
              >
                {reason}
              </button>
            );
          })}
        </div>
      </div>

      <label className="mt-3 block">
        <span className="font-poppins text-[11px] font-semibold text-cpc-navy-text">
          Remarks shown to the student <span aria-hidden>*</span>
        </span>
        <textarea
          value={remarks}
          onChange={(event) => setRemarks(event.target.value.slice(0, MAX_REMARKS))}
          rows={3}
          maxLength={MAX_REMARKS}
          required
          aria-describedby="reject-counter"
          placeholder="e.g. Two library books are still unreturned."
          className="mt-1 w-full resize-y rounded-lg border border-cpc-tile-border bg-white px-3 py-2 font-poppins text-sm text-cpc-navy-text outline-none focus-visible:border-cpc-blue-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
        />
      </label>

      <label className="mt-3 block">
        <span className="font-poppins text-[11px] font-semibold text-cpc-navy-text">
          What the student must do{" "}
          <span className="font-normal text-cpc-heading-soft">(optional, appended to remarks)</span>
        </span>
        <input
          type="text"
          value={action}
          onChange={(event) => setAction(event.target.value.slice(0, 120))}
          maxLength={120}
          placeholder="Return the books at the circulation counter, then request again."
          className="mt-1 w-full rounded-lg border border-cpc-tile-border bg-white px-3 py-2 font-poppins text-sm text-cpc-navy-text outline-none focus-visible:border-cpc-blue-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
        />
      </label>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <p
          id="reject-counter"
          className={cn(
            "font-poppins text-[11px] font-semibold",
            tooLong || tooShort ? "text-rose-700" : "text-cpc-heading-soft",
          )}
        >
          {finalRemarks.length}/{MAX_REMARKS} characters
          {tooShort && finalRemarks.length > 0 ? ` — at least ${MIN_REMARKS} required` : ""}
        </p>
        <span className="font-poppins text-[10px] text-cpc-heading-soft">
          Includes the “Action needed” line
        </span>
      </div>

      {tooLong && (
        <p role="alert" className="mt-2 flex items-start gap-1.5 font-poppins text-[11px] text-rose-700">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          Remarks and the action line must stay within {MAX_REMARKS} characters together.
        </p>
      )}

      <p className="mt-2 flex items-start gap-1.5 rounded-xl bg-cpc-section-light/40 px-3 py-2 font-poppins text-[10px] leading-relaxed text-cpc-heading-soft">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
        The student keeps a “Request again” button on this office, and a “returned” event is added
        to the audit trail.
      </p>

      <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          className="cpc-btn cpc-btn-secondary"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => void confirm()}
          disabled={!canConfirm}
          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 py-2.5 font-poppins text-sm font-semibold text-white transition-colors hover:bg-rose-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 motion-reduce:animate-none disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <XCircle className="h-4 w-4" aria-hidden />
          )}
          {busy ? "Sending..." : "Reject request"}
        </button>
      </div>
    </div>
  );
}
