import { useEffect, useMemo, useRef, useState } from "react";
import { Download, Loader2, ShieldCheck, X, XCircle } from "lucide-react";
import { ConfirmDialog } from "@/admin/components/ConfirmDialog";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/cn";
import { useClearanceAdmin } from "../context/ClearanceAdminContext";
import { buildOfficeChecks, countIssues } from "../utils/officeChecks";
import { downloadCsv, rowsToCsv } from "../utils/csv";
import type { ClearanceRequestRow } from "../types";

const MIN_REMARKS = 10;
const MAX_REMARKS = 200;

/**
 * Selection toolbar for the queue.
 *
 * Bulk approve is only offered when the staff member has a default saved
 * signature and none of the selected requests has an unresolved office check —
 * anything riskier has to be reviewed one by one. One Undo covers the batch
 * (handled by the context).
 */
export function BulkActionBar() {
  const {
    busy,
    bulkApprove,
    bulkReject,
    checkedIds,
    clearChecked,
    defaultSignature,
    records,
    rows,
    staff,
  } = useClearanceAdmin();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const barRef = useRef<HTMLDivElement | null>(null);
  const [reserve, setReserve] = useState(0);
  const hasSelection = checkedIds.length > 0;

  /*
   * The bar floats at the bottom of the viewport, so an in-flow spacer the same
   * height is rendered under the queue. Without it the last rows and the
   * pagination footer stay underneath the bar with no way to scroll clear.
   */
  useEffect(() => {
    const bar = barRef.current;
    if (!hasSelection || !bar) return;
    const observer = new ResizeObserver(() => {
      setReserve(Math.ceil(bar.getBoundingClientRect().height));
    });
    observer.observe(bar);
    return () => observer.disconnect();
  }, [hasSelection]);

  const selectedRows = useMemo(
    () => rows.filter((row) => checkedIds.includes(row.id)),
    [rows, checkedIds],
  );

  /** Selected rows that can still be decided by this office. */
  const actionable = useMemo(
    () => selectedRows.filter((row) => row.status === "requested"),
    [selectedRows],
  );

  const issueCount = useMemo(
    () =>
      actionable.filter((row) => {
        const record = records.find((entry) => entry.studentId === row.studentId);
        if (!record) return false;
        return countIssues(buildOfficeChecks(row.office, record, staff.name)) > 0;
      }).length,
    [actionable, records, staff.name],
  );

  if (!hasSelection) return null;

  const blocker = !defaultSignature
    ? "Save a signature first to bulk approve."
    : issueCount > 0
      ? issueCount === 1
        ? "1 selected request has unresolved issues — review it individually."
        : `${issueCount} selected requests have unresolved issues — review them individually.`
      : null;

  const exportSelected = () => {
    downloadCsv(
      `clearance-selected-${new Date().toISOString().slice(0, 10)}.csv`,
      rowsToCsv(selectedRows),
    );
  };

  const runBulkApprove = async () => {
    if (!defaultSignature) return;
    const signed = await bulkApprove(defaultSignature.id);
    if (signed) setConfirmOpen(false);
  };

  return (
    <>
      <div
        ref={barRef}
        className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center p-3 sm:justify-start sm:p-4 xl:pr-[29rem] print:hidden"
      >
        <section
          aria-label="Bulk actions for selected requests"
          className="pointer-events-auto w-full max-w-3xl rounded-2xl border border-cpc-tile-border/70 bg-white p-3 shadow-[0_24px_80px_rgba(15,36,104,0.35)]"
        >
          <p aria-live="polite" className="font-poppins text-[11px] font-semibold text-cpc-navy-text">
            {checkedIds.length} request{checkedIds.length === 1 ? "" : "s"} selected
          </p>

          <div className="mt-2 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              disabled={blocker !== null || actionable.length === 0 || busy}
              title={blocker ?? undefined}
              className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-cpc-button px-3 py-2 font-poppins text-xs font-semibold text-white transition-colors hover:bg-cpc-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent motion-reduce:animate-none disabled:cursor-not-allowed disabled:opacity-60"
            >
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
              Approve selected ({actionable.length})
            </button>

            <button
              type="button"
              onClick={() => setRejectOpen(true)}
              disabled={actionable.length === 0 || busy}
              className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 font-poppins text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-50/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 motion-reduce:animate-none disabled:cursor-not-allowed disabled:opacity-60"
            >
              <XCircle className="h-3.5 w-3.5" aria-hidden />
              Reject selected
            </button>

            <button
              type="button"
              onClick={exportSelected}
              className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-cpc-tile-border bg-white px-3 py-2 font-poppins text-xs font-semibold text-cpc-navy-text transition-colors hover:bg-cpc-section-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent motion-reduce:animate-none"
            >
              <Download className="h-3.5 w-3.5" aria-hidden />
              Export selected CSV
            </button>

            <button
              type="button"
              onClick={clearChecked}
              className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3 py-2 font-poppins text-xs font-semibold text-cpc-heading-soft transition-colors hover:bg-cpc-section-light hover:text-cpc-navy-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent motion-reduce:animate-none"
            >
              <X className="h-3.5 w-3.5" aria-hidden />
              Clear selection
            </button>
          </div>

          {blocker && (
            <p className="mt-2 flex items-start gap-1.5 font-poppins text-[11px] text-rose-700">
              <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              {blocker}
            </p>
          )}

          {busy && (
            <p className="mt-2 flex items-center gap-1.5 font-poppins text-[11px] font-semibold text-cpc-blue-accent">
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
              Signing {actionable.length} request{actionable.length === 1 ? "" : "s"}…
            </p>
          )}
        </section>
      </div>

      <ConfirmDialog
        open={confirmOpen && defaultSignature !== null}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => void runBulkApprove()}
        title={`Sign ${actionable.length} request${actionable.length === 1 ? "" : "s"}?`}
        description={
          <div className="space-y-2">
            <p>
              {defaultSignature
                ? `Each one is signed with “${defaultSignature.label}”. Review the students below first.`
                : "Save a signature first to bulk approve."}
            </p>
            <ul className="admin-scrollbar max-h-40 space-y-1 overflow-y-auto rounded-lg border border-cpc-tile-border/70 bg-cpc-section-light/40 p-2">
              {actionable.map((row) => (
                <li key={row.id} className="font-poppins text-xs text-cpc-navy-text">
                  <span className="font-semibold">{row.studentName}</span>
                  <span className="text-cpc-heading-soft"> · {row.section}</span>
                </li>
              ))}
            </ul>
            {busy && (
              <p className="flex items-center gap-1.5 font-poppins text-xs font-semibold text-cpc-blue-accent">
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                Signing {actionable.length} requests…
              </p>
            )}
            <p className="font-poppins text-[11px] text-cpc-heading-soft">
              A single Undo in the toast reverts the whole batch.
            </p>
          </div>
        }
        confirmLabel={busy ? "Signing…" : "Sign all selected"}
        busy={busy}
        id="bulk-approve-title"
      />

      <Modal open={rejectOpen} onClose={() => setRejectOpen(false)} labelledBy="bulk-reject-title">
        <BulkRejectBody
          rows={actionable}
          onDone={() => setRejectOpen(false)}
          submit={async (remarks) => {
            const rejected = await bulkReject(remarks);
            if (rejected) setRejectOpen(false);
            return rejected;
          }}
          busy={busy}
        />
      </Modal>

      <div aria-hidden className="pointer-events-none" style={{ height: reserve }} />
    </>
  );
}

type BulkRejectBodyProps = {
  rows: ClearanceRequestRow[];
  busy: boolean;
  onDone: () => void;
  submit: (remarks: string) => Promise<boolean>;
};

/** One shared remark applied to every selected request. */
function BulkRejectBody({ rows, busy, onDone, submit }: BulkRejectBodyProps) {
  const [remarks, setRemarks] = useState("");
  const trimmed = remarks.trim();
  const valid = trimmed.length >= MIN_REMARKS && trimmed.length <= MAX_REMARKS && !busy;

  return (
    <div className="p-5 sm:p-6">
      <div className="pr-8">
        <h2 id="bulk-reject-title" className="font-poppins text-lg font-semibold text-cpc-navy-text">
          Reject {rows.length} request{rows.length === 1 ? "" : "s"}
        </h2>
        <p className="mt-1 font-poppins text-xs leading-relaxed text-cpc-heading-soft">
          The same remarks are sent to every selected student.
        </p>
      </div>

      <ul className="admin-scrollbar mt-3 max-h-32 space-y-1 overflow-y-auto rounded-lg border border-cpc-tile-border/70 bg-cpc-section-light/40 p-2">
        {rows.map((row) => (
          <li key={row.id} className="font-poppins text-[11px] text-cpc-navy-text">
            {row.studentName} · {row.section}
          </li>
        ))}
      </ul>

      <label className="mt-3 block">
        <span className="font-poppins text-[11px] font-semibold text-cpc-navy-text">
          Shared remarks <span aria-hidden>*</span>
        </span>
        <textarea
          value={remarks}
          onChange={(event) => setRemarks(event.target.value.slice(0, MAX_REMARKS))}
          rows={3}
          maxLength={MAX_REMARKS}
          aria-describedby="bulk-reject-counter"
          placeholder="e.g. Outstanding requirements must be settled before we can sign."
          className="mt-1 w-full resize-y rounded-lg border border-cpc-tile-border bg-white px-3 py-2 font-poppins text-sm text-cpc-navy-text outline-none focus-visible:border-cpc-blue-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
        />
      </label>

      <p
        id="bulk-reject-counter"
        className={cn(
          "mt-1 font-poppins text-[11px] font-semibold",
          trimmed.length < MIN_REMARKS ? "text-rose-700" : "text-cpc-heading-soft",
        )}
      >
        {trimmed.length}/{MAX_REMARKS} characters
        {trimmed.length < MIN_REMARKS ? ` — at least ${MIN_REMARKS} required` : ""}
      </p>

      <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onDone}
          disabled={busy}
          className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-cpc-tile-border bg-white px-4 py-2.5 font-poppins text-sm font-semibold text-cpc-navy-text transition-colors hover:bg-cpc-section-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent disabled:cursor-not-allowed disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => void submit(trimmed)}
          disabled={!valid}
          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 py-2.5 font-poppins text-sm font-semibold text-white transition-colors hover:bg-rose-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          Reject selected
        </button>
      </div>
    </div>
  );
}
