import { useState } from "react";
import { Loader2, ShieldAlert, Undo2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/cn";
import { useClearanceAdmin } from "@/components/features/admin/clearance/ClearanceAdminContext";
import { OFFICE_LABELS } from "@/components/features/admin/clearance/officeChecks";
import type { ClearanceRequestRow } from "@/components/features/admin/clearance/types";

const MIN_REASON = 10;
const MAX_REASON = 300;

type RevokeModalProps = {
  row: ClearanceRequestRow | null;
  open: boolean;
  onClose: () => void;
};

/**
 * Admin-only revoke: the stored signature is dropped, the request goes back to
 * that office's queue ("requested"), the audit trail logs it and the student is
 * notified. Office staff never see this dialog's action enabled.
 */
export function RevokeModal({ row, open, onClose }: RevokeModalProps) {
  if (!row) return null;

  return (
    <Modal open={open} onClose={onClose} labelledBy="revoke-title" className="sm:max-w-lg">
      <RevokeBody key={row.id} row={row} onClose={onClose} />
    </Modal>
  );
}

function RevokeBody({ row, onClose }: { row: ClearanceRequestRow; onClose: () => void }) {
  const { busy, isSuperAdmin, revoke } = useClearanceAdmin();
  const [reason, setReason] = useState("");

  const trimmed = reason.trim();
  const tooShort = trimmed.length < MIN_REASON;
  const canConfirm = isSuperAdmin && !tooShort && trimmed.length <= MAX_REASON && !busy;

  const confirm = async () => {
    if (!canConfirm) return;
    const revoked = await revoke(row, trimmed);
    if (revoked) onClose();
  };

  return (
    <div className="p-5 sm:p-6">
      <div className="pr-8">
        <h2 id="revoke-title" className="font-poppins text-lg font-semibold text-cpc-navy-text">
          Revoke the {OFFICE_LABELS[row.office]} signature
        </h2>
      </div>

      <p className="mt-3 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 font-poppins text-[11px] leading-relaxed text-rose-700">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <span>
          The saved signature of {row.signerName ?? OFFICE_LABELS[row.office]} is removed and{" "}
          {row.studentName}'s request returns to the {OFFICE_LABELS[row.office]} queue. The student
          is notified, and the reason is written to the audit trail.
        </span>
      </p>

      {!isSuperAdmin && (
        <p role="alert" className="mt-3 font-poppins text-[11px] font-semibold text-rose-700">
          Only an administrator can revoke a completed signature.
        </p>
      )}

      <label className="mt-4 block">
        <span className="font-poppins text-[11px] font-semibold text-cpc-navy-text">
          Reason for revoking <span aria-hidden>*</span>
        </span>
        <textarea
          value={reason}
          onChange={(event) => setReason(event.target.value.slice(0, MAX_REASON))}
          rows={3}
          maxLength={MAX_REASON}
          required
          aria-describedby="revoke-counter"
          disabled={!isSuperAdmin}
          placeholder="e.g. Signed against an outstanding balance that was not settled."
          className="mt-1 w-full resize-y rounded-lg border border-cpc-tile-border bg-white px-3 py-2 font-poppins text-sm text-cpc-navy-text outline-none focus-visible:border-cpc-blue-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent disabled:cursor-not-allowed disabled:bg-cpc-section-light/40"
        />
      </label>

      <p
        id="revoke-counter"
        className={cn(
          "mt-1 font-poppins text-[11px] font-semibold",
          tooShort ? "text-rose-700" : "text-cpc-heading-soft",
        )}
      >
        {trimmed.length}/{MAX_REASON} characters
        {tooShort ? ` — at least ${MIN_REASON} required` : ""}
      </p>

      <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-cpc-tile-border bg-white px-4 py-2.5 font-poppins text-sm font-semibold text-cpc-navy-text transition-colors hover:bg-cpc-section-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent motion-reduce:animate-none disabled:cursor-not-allowed disabled:opacity-60"
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
            <Undo2 className="h-4 w-4" aria-hidden />
          )}
          {busy ? "Revoking..." : "Revoke signature"}
        </button>
      </div>
    </div>
  );
}
