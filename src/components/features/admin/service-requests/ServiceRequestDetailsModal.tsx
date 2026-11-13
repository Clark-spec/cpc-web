import { useEffect, useId, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Download,
  Loader2,
  Save,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { formatDateTime } from "@/lib/format";
import { Modal } from "@/components/ui/modal";
import { ApiError } from "@/lib/apiClient";
import { ServiceRequestStatusBadge } from "@/components/features/admin/service-requests/ServiceRequestStatusBadge";
import {
  SERVICE_STATUS_LABELS,
  SERVICE_STATUS_ORDER,
  type AdminServiceRequestDetail,
  type AdminServiceRequestStatus,
} from "@/services/serviceRequests/admin";
import {
  downloadAdminServiceDocument,
  getAdminServiceRequest,
  updateAdminServiceRequest,
} from "@/services/serviceRequests/adminApi";

type ServiceRequestDetailsModalProps = {
  requestId: string;
  onClose: () => void;
  /** Called with the saved record so the queue row can be patched in place. */
  onSaved: (request: AdminServiceRequestDetail) => void;
  /** A second administrator changed the record first; the page reloads it. */
  onConflict: (message: string) => void;
};

const FIELD_BASE =
  "w-full rounded-lg border border-admin-border/70 bg-white px-3 py-2 font-poppins text-[11.5px] leading-relaxed text-admin-text outline-none transition-colors placeholder:text-admin-muted/70 focus:border-admin-secondary focus:ring-2 focus:ring-admin-secondary/15";

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function formatFileSize(bytes: number): string {
  if (!bytes) return "Unknown size";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return "Something went wrong. Please try again.";
}

/**
 * Full detail view for one service request. The record is fetched from the
 * shared admin API so its status history is always current; edits send the
 * record's `updatedAt` back as the conflict token.
 */
export function ServiceRequestDetailsModal({
  requestId,
  onClose,
  onSaved,
  onConflict,
}: ServiceRequestDetailsModalProps) {
  const headingId = useId();
  const [detail, setDetail] = useState<AdminServiceRequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [status, setStatus] = useState<AdminServiceRequestStatus>("submitted");
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    getAdminServiceRequest(requestId)
      .then((data) => {
        if (!active) return;
        setDetail(data);
        setStatus(data.status);
        setRemarks(data.remarks ?? "");
      })
      .catch((error) => {
        if (active) setLoadError(getErrorMessage(error));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [requestId]);

  const dirty =
    detail !== null &&
    (status !== detail.status || remarks.trim() !== (detail.remarks ?? "").trim());

  async function handleSave() {
    if (!detail || !dirty || saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      const updated = await updateAdminServiceRequest(
        detail.id,
        { status, remarks: remarks.trim() },
        detail.updatedAt,
      );
      setDetail(updated);
      setStatus(updated.status);
      setRemarks(updated.remarks ?? "");
      onSaved(updated);
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        onConflict(error.message);
        // Show the other administrator's version without closing the dialog.
        try {
          const latest = await getAdminServiceRequest(detail.id);
          setDetail(latest);
          setStatus(latest.status);
          setRemarks(latest.remarks ?? "");
        } catch {
          // Keep the stale record; the queue reload from the page is authoritative.
        }
        return;
      }
      setSaveError(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function handleDownload() {
    if (!detail?.document) return;
    setDownloading(true);
    setDownloadError(null);
    try {
      await downloadAdminServiceDocument(detail.id, detail.document.name);
    } catch (error) {
      setDownloadError(getErrorMessage(error));
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Modal open onClose={onClose} labelledBy={headingId} className="sm:max-w-[680px]">
      {/* Frosted modal header */}
      <div className="relative overflow-hidden border-b border-white/60 bg-gradient-to-br from-cpc-navy via-[#0d2460] to-[#091b4c] px-5 py-5 pr-14">
        {/* Ambient glow */}
        <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-cpc-blue-accent/20 blur-2xl" aria-hidden />

        <div className="relative flex items-start gap-3.5">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 font-poppins text-sm font-bold text-white shadow-sm ring-1 ring-white/20 backdrop-blur-sm"
            aria-hidden
          >
            {initials(detail?.student.name ?? "")}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2
                id={headingId}
                className="font-poppins text-[17px] leading-tight font-bold text-white"
              >
                {detail?.student.name || "Loading request…"}
              </h2>
              {detail && <ServiceRequestStatusBadge status={detail.status} />}
            </div>
            <p className="mt-0.5 font-poppins text-[11px] text-white/60">
              {detail
                ? `${detail.referenceNumber} · ${detail.student.studentNumber || "No student number"}`
                : requestId}
            </p>
          </div>
        </div>

        {detail && (
          <div className="relative mt-3.5 flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2.5 backdrop-blur-sm">
            <ClipboardList className="h-4 w-4 shrink-0 text-white/70" aria-hidden />
            <span className="font-poppins text-[12px] font-semibold text-white/90">
              {detail.service.name}
              {detail.copies > 1 ? ` · ${detail.copies} copies` : ""}
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="space-y-4 px-5 py-5">
        {loading && !detail && (
          <div className="flex items-center justify-center gap-2 py-12 font-poppins text-[11.5px] text-admin-muted">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Loading request details…
          </div>
        )}

        {!loading && loadError && (
          <div className="flex items-start gap-2 rounded-xl border border-rose-200/70 bg-rose-50/80 px-3.5 py-2.5">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" aria-hidden />
            <p className="font-poppins text-[11px] leading-snug text-rose-700">{loadError}</p>
          </div>
        )}

        {detail && (
          <>
            {detail.status === "rejected" && (
              <div className="flex items-start gap-2 rounded-xl border border-rose-200/70 bg-rose-50/80 px-3.5 py-2.5">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" aria-hidden />
                <p className="font-poppins text-[11px] leading-snug text-rose-700">
                  This request is rejected. The student has been notified with the office remarks
                  recorded below.
                </p>
              </div>
            )}

            {/* Student information */}
            <div className="rounded-xl border border-admin-border/50 bg-admin-page/50 p-4">
              <h3 className="mb-3 font-poppins text-[9.5px] font-bold tracking-[0.1em] text-admin-muted uppercase">
                Student Information
              </h3>
              <dl className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
                {[
                  { label: "Name", value: detail.student.name || "—" },
                  { label: "Student No.", value: detail.student.studentNumber || "—" },
                  { label: "Program", value: detail.student.course || "—" },
                  { label: "Year Level", value: detail.student.yearLevel || "—" },
                  {
                    label: "Email",
                    value: detail.student.email || "—",
                  },
                ].map((row) => (
                  <div key={row.label} className="min-w-0">
                    <dt className="font-poppins text-[9.5px] font-bold tracking-[0.08em] text-admin-muted uppercase">
                      {row.label}
                    </dt>
                    <dd className="mt-0.5 font-poppins text-[11.5px] leading-snug font-medium break-words text-admin-text">
                      {row.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Request details */}
            <div className="rounded-xl border border-admin-border/50 bg-admin-page/50 p-4">
              <h3 className="mb-3 font-poppins text-[9.5px] font-bold tracking-[0.1em] text-admin-muted uppercase">
                Request Details
              </h3>
              <dl className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
                {[
                  { label: "Service", value: detail.service.name },
                  { label: "Purpose", value: detail.purpose || "No purpose stated" },
                  { label: "Copies", value: String(detail.copies) },
                  { label: "Submitted", value: formatDateTime(detail.submittedAt) },
                  { label: "Last Updated", value: formatDateTime(detail.updatedAt) },
                  {
                    label: "Last Updated By",
                    value: detail.lastUpdatedByName
                      ? `${detail.lastUpdatedByName}${detail.lastUpdatedByRole ? ` (${detail.lastUpdatedByRole})` : ""}`
                      : "Not yet updated",
                  },
                ].map((row) => (
                  <div key={row.label} className="min-w-0">
                    <dt className="font-poppins text-[9.5px] font-bold tracking-[0.08em] text-admin-muted uppercase">
                      {row.label}
                    </dt>
                    <dd className="mt-0.5 font-poppins text-[11.5px] leading-snug font-medium break-words text-admin-text">
                      {row.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Notes */}
            <div className="rounded-xl border border-admin-border/50 bg-admin-page/60 px-4 py-3.5">
              <p className="font-poppins text-[9.5px] font-bold tracking-[0.08em] text-admin-muted uppercase">
                Student Notes
              </p>
              <p className="mt-1.5 font-poppins text-[11.5px] leading-relaxed whitespace-pre-wrap text-admin-text">
                {detail.notes || "No additional notes."}
              </p>
            </div>

            {/* Uploaded document */}
            <div className="rounded-xl border border-admin-border/50 bg-admin-page/60 px-4 py-3.5">
              <p className="font-poppins text-[9.5px] font-bold tracking-[0.08em] text-admin-muted uppercase">
                Uploaded Document
              </p>
              {detail.document ? (
                <div className="mt-1.5 flex items-center gap-3 rounded-lg border border-admin-border/60 bg-white px-3 py-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-admin-page text-admin-secondary">
                    <ClipboardList className="h-4 w-4" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-poppins text-[11.5px] font-medium text-admin-text">
                      {detail.document.name}
                    </p>
                    <p className="font-poppins text-[10px] text-admin-muted">
                      {formatFileSize(detail.document.size)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownload}
                    disabled={downloading}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-admin-border/60 bg-white px-2.5 py-1 font-poppins text-[10.5px] font-semibold text-admin-secondary transition-colors hover:bg-admin-page disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {downloading ? (
                      <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
                    ) : (
                      <Download className="h-3 w-3" aria-hidden />
                    )}
                    {downloading ? "Preparing…" : "Download"}
                  </button>
                </div>
              ) : (
                <p className="mt-1.5 font-poppins text-[11px] text-admin-muted">
                  No document was uploaded with this request.
                </p>
              )}
              {downloadError && (
                <p className="mt-1 font-poppins text-[10px] text-rose-600">{downloadError}</p>
              )}
            </div>

            {/* Office action */}
            <div className="rounded-xl border border-admin-border/50 bg-admin-page/50 p-4">
              <h3 className="mb-3 font-poppins text-[9.5px] font-bold tracking-[0.1em] text-admin-muted uppercase">
                Office Action
              </h3>
              <div className="grid gap-3">
                <div>
                  <label
                    htmlFor={`${headingId}-status`}
                    className="mb-1 block font-poppins text-[10px] font-bold tracking-[0.08em] text-admin-muted uppercase"
                  >
                    Status
                  </label>
                  <select
                    id={`${headingId}-status`}
                    value={status}
                    onChange={(event) =>
                      setStatus(event.target.value as AdminServiceRequestStatus)
                    }
                    className={cn(FIELD_BASE, "cursor-pointer")}
                  >
                    {SERVICE_STATUS_ORDER.map((option) => (
                      <option key={option} value={option}>
                        {SERVICE_STATUS_LABELS[option]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor={`${headingId}-remarks`}
                    className="mb-1 flex items-center justify-between font-poppins text-[10px] font-bold tracking-[0.08em] text-admin-muted uppercase"
                  >
                    <span>Remarks for the student</span>
                    <span className="font-medium tracking-normal normal-case tabular-nums">
                      {remarks.length}/500
                    </span>
                  </label>
                  <textarea
                    id={`${headingId}-remarks`}
                    value={remarks}
                    onChange={(event) => setRemarks(event.target.value)}
                    maxLength={500}
                    rows={3}
                    placeholder="Add a note about requirements, pickup, or why the request was rejected."
                    className={cn(FIELD_BASE, "resize-y")}
                  />
                </div>
              </div>
              {saveError && (
                <p role="alert" className="mt-2 font-poppins text-[10.5px] text-rose-600">
                  {saveError}
                </p>
              )}
            </div>

            {/* Status history */}
            <div>
              <h3 className="font-poppins text-[9.5px] font-bold tracking-[0.1em] text-admin-muted uppercase">
                Status History
              </h3>
              {detail.history.length === 0 ? (
                <p className="mt-1.5 font-poppins text-[11px] text-admin-muted">
                  No office actions recorded yet.
                </p>
              ) : (
                <ul className="mt-1.5 space-y-1.5">
                  {[...detail.history].reverse().map((entry) => (
                    <li
                      key={String(entry.id)}
                      className="rounded-lg border border-admin-border/50 bg-white px-3 py-2"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-1.5">
                        <span className="inline-flex items-center gap-1.5 font-poppins text-[11px] font-semibold text-admin-text">
                          <CheckCircle2 className="h-3 w-3 text-admin-secondary" aria-hidden />
                          {entry.oldStatus
                            ? `${SERVICE_STATUS_LABELS[entry.oldStatus]} → ${entry.statusLabel}`
                            : entry.statusLabel}
                        </span>
                        <span className="font-poppins text-[10px] text-admin-muted">
                          {formatDateTime(entry.changedAt)}
                        </span>
                      </div>
                      {entry.remarks && (
                        <p className="mt-1 font-poppins text-[10.5px] leading-[15px] text-admin-text">
                          {entry.remarks}
                        </p>
                      )}
                      <p className="mt-0.5 font-poppins text-[10px] text-admin-muted">
                        By {entry.changedByName || entry.changedByRole || "Student services"}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-admin-border/50 bg-admin-page/40 px-5 py-3.5">
        <p className="font-poppins text-[10px] text-admin-muted">
          {detail
            ? `Last updated ${formatDateTime(detail.updatedAt)}`
            : "Changes are recorded in the request history."}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-admin-border/60 bg-white px-5 py-2 font-poppins text-[11.5px] font-semibold text-admin-text shadow-xs transition-all hover:bg-admin-page hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-info"
          >
            Close
          </button>
          {detail && (
            <button
              type="button"
              onClick={handleSave}
              disabled={!dirty || saving}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-admin-secondary px-5 py-2 font-poppins text-[11.5px] font-semibold text-white shadow-xs transition-all hover:bg-cpc-navy-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-info disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
              ) : (
                <Save className="h-3.5 w-3.5" aria-hidden />
              )}
              {saving ? "Saving…" : "Save Changes"}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
