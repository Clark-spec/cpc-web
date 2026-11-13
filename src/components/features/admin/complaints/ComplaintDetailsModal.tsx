import { useId, useState } from "react";
import { Check, EyeOff, FileText, Paperclip } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import { formatDateTime } from "@/lib/format";
import { ComplaintStatusBadge } from "@/components/features/student/complaints/ComplaintStatusBadge";
import { COMPLAINT_STATUS_LABELS } from "@/components/features/admin/complaints/mockComplaints";
import type {
  AdminComplaintRow,
  ComplaintUpdate,
} from "@/components/features/admin/complaints/types";

const FIELD_BASE =
  "w-full rounded-lg border border-cpc-input-border bg-white px-3 py-2 font-poppins text-xs text-cpc-navy-text placeholder:text-cpc-placeholder transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent";

const LABEL_BASE =
  "mb-1 block font-poppins text-[10px] font-bold tracking-[0.12em] text-cpc-heading-soft uppercase";

const STATUS_OPTIONS = ["pending", "in_review", "resolved"] as const;

const BTN = "cpc-btn cpc-btn-sm";

type ComplaintDetailsModalProps = {
  row: AdminComplaintRow;
  onClose: () => void;
  onSave: (id: string, update: ComplaintUpdate) => Promise<void>;
};

/**
 * Full complaint view + review form (spec §3). Reuses the shared `Modal` for
 * focus trapping and ESC handling; the page remounts it per row via `key`, so
 * the draft status/remarks always start from the stored record.
 */
export function ComplaintDetailsModal({
  row,
  onClose,
  onSave,
}: ComplaintDetailsModalProps) {
  const headingId = useId();
  const [status, setStatus] = useState(row.status);
  const [remarks, setRemarks] = useState(row.adminRemarks);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const dirty = status !== row.status || remarks.trim() !== row.adminRemarks;

  async function handleSave() {
    if (!dirty || saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      await onSave(row.id, { status, adminRemarks: remarks.trim() });
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Could not save these changes.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose} labelledBy={headingId} className="sm:max-w-2xl">
      <header className="border-b border-cpc-tile-border/60 px-5 py-4 pr-12">
        <p className="font-poppins text-[10px] font-bold tracking-[0.14em] text-cpc-blue-accent uppercase">
          {row.referenceNumber}
        </p>
        <h2
          id={headingId}
          className="mt-1 font-poppins text-lg leading-snug font-bold text-cpc-navy-text"
        >
          {row.subject}
        </h2>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <ComplaintStatusBadge status={row.status} />
          <span className="font-poppins text-[11px] text-cpc-heading-soft">
            Filed {formatDateTime(row.filedAt)}
          </span>
        </div>
      </header>

      <div className="space-y-4 px-5 py-4">
        <section
          aria-label="Student information"
          className="rounded-xl border border-cpc-tile-border/70 bg-cpc-section-light/40 p-4"
        >
          <h3 className="font-poppins text-[10px] font-bold tracking-[0.12em] text-cpc-heading-soft uppercase">
            Student information
          </h3>
          <dl className="mt-2.5 grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
            <div className="min-w-0">
              <dt className="font-poppins text-[10px] text-cpc-heading-soft">Name</dt>
              <dd className="truncate font-poppins text-xs font-semibold text-cpc-navy-text">
                {row.studentName}
              </dd>
            </div>
            <div className="min-w-0">
              <dt className="font-poppins text-[10px] text-cpc-heading-soft">Student ID</dt>
              <dd className="truncate font-poppins text-xs font-semibold text-cpc-navy-text">
                {row.studentId}
              </dd>
            </div>
            <div className="min-w-0">
              <dt className="font-poppins text-[10px] text-cpc-heading-soft">
                Program / Year level
              </dt>
              <dd className="truncate font-poppins text-xs text-cpc-navy-text">
                {row.anonymous
                  ? "Hidden"
                  : [row.program, row.yearLevel].filter(Boolean).join(" · ") || "—"}
              </dd>
            </div>
            <div className="min-w-0">
              <dt className="font-poppins text-[10px] text-cpc-heading-soft">Email</dt>
              <dd
                className="truncate font-poppins text-xs text-cpc-navy-text"
                title={row.anonymous ? undefined : row.email}
              >
                {row.anonymous ? "Hidden" : row.email || "—"}
              </dd>
            </div>
          </dl>
          {row.anonymous && (
            <p className="mt-3 flex items-start gap-1.5 border-t border-cpc-tile-border/60 pt-2.5 font-poppins text-[11px] leading-relaxed text-cpc-heading-soft">
              <EyeOff className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
              Submitted anonymously. The student&apos;s identity is not part of this
              record and is not available to any administrator.
            </p>
          )}
        </section>

        <section aria-labelledby={`${headingId}-details`} className="space-y-2">
          <h3
            id={`${headingId}-details`}
            className="font-poppins text-[10px] font-bold tracking-[0.12em] text-cpc-heading-soft uppercase"
          >
            Complaint details
          </h3>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <div>
              <p className="font-poppins text-[10px] text-cpc-heading-soft">Category</p>
              <Badge tone="neutral" size="sm" dot={false} className="mt-1">
                {row.category}
              </Badge>
            </div>
            <div>
              <p className="font-poppins text-[10px] text-cpc-heading-soft">Date filed</p>
              <p className="mt-1 font-poppins text-xs font-semibold text-cpc-navy-text">
                {formatDateTime(row.filedAt)}
              </p>
            </div>
          </div>
          <div className="rounded-xl border border-cpc-tile-border/70 bg-white p-3">
            <p className="font-poppins text-xs leading-relaxed whitespace-pre-line text-cpc-navy-text">
              {row.description}
            </p>
          </div>
        </section>

        <section aria-labelledby={`${headingId}-attachment`}>
          <h3
            id={`${headingId}-attachment`}
            className="mb-1.5 font-poppins text-[10px] font-bold tracking-[0.12em] text-cpc-heading-soft uppercase"
          >
            Attachment
          </h3>
          {row.attachmentName ? (
            <div className="flex items-center gap-2.5 rounded-lg border border-cpc-tile-border bg-white px-3 py-2.5">
              <FileText className="h-4 w-4 shrink-0 text-cpc-blue-accent" aria-hidden />
              <div className="min-w-0">
                <p
                  className="truncate font-poppins text-xs font-semibold text-cpc-navy-text"
                  title={row.attachmentName}
                >
                  {row.attachmentName}
                </p>
                <p className="flex items-center gap-1 font-poppins text-[10px] text-cpc-heading-soft">
                  <Paperclip className="h-2.5 w-2.5 shrink-0" aria-hidden />
                  Attached by student
                </p>
              </div>
            </div>
          ) : (
            <p className="font-poppins text-xs text-cpc-heading-soft">
              No attachment was provided.
            </p>
          )}
        </section>

        <section
          aria-labelledby={`${headingId}-review`}
          className="space-y-3 rounded-xl border border-cpc-tile-border/70 p-4"
        >
          <h3
            id={`${headingId}-review`}
            className="font-poppins text-[10px] font-bold tracking-[0.12em] text-cpc-heading-soft uppercase"
          >
            Review
          </h3>

          <div>
            <label htmlFor="complaint-review-status" className={LABEL_BASE}>
              Status
            </label>
            <select
              id="complaint-review-status"
              value={status}
              onChange={(event) => setStatus(event.target.value as typeof status)}
              className={cn(FIELD_BASE, "cursor-pointer")}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {COMPLAINT_STATUS_LABELS[option]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="complaint-review-remarks" className={LABEL_BASE}>
              Admin remarks / response
            </label>
            <textarea
              id="complaint-review-remarks"
              rows={4}
              maxLength={500}
              value={remarks}
              onChange={(event) => setRemarks(event.target.value)}
              placeholder="Add findings, actions taken, or a response for the student…"
              className={cn(FIELD_BASE, "resize-y leading-relaxed")}
            />
            <p className="mt-1 flex items-center justify-between gap-2 font-poppins text-[10px] text-cpc-heading-soft">
              <span>Notes are kept with the complaint record.</span>
              <span className="tabular-nums">{remarks.length}/500</span>
            </p>
          </div>

          {saveError && (
            <p
              role="alert"
              className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 font-poppins text-[11px] leading-relaxed text-rose-700"
            >
              {saveError}
            </p>
          )}

          {row.updatedAt && (
            <p className="font-poppins text-[10px] text-cpc-heading-soft">
              Last updated {formatDateTime(row.updatedAt)}
              {row.updatedByName ? ` by ${row.updatedByName}` : ""}
            </p>
          )}
        </section>
      </div>

      <footer className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-cpc-tile-border/60 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-end">
        <button
          type="button"
          onClick={onClose}
          className="cpc-btn cpc-btn-secondary cpc-btn-sm"
        >
          Close
        </button>
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={!dirty || saving}
          title={dirty ? undefined : "Change the status or remarks to save"}
          className={cn(BTN, "cpc-btn-primary")}
        >
          <Check className="h-4 w-4 shrink-0" aria-hidden />
          {saving ? "Saving…" : "Save changes"}
        </button>
      </footer>
    </Modal>
  );
}
