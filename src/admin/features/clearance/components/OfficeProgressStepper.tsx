import { AlertTriangle, CheckCircle2, Circle, Clock3 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { useClearanceAdmin } from "../context/ClearanceAdminContext";
import { OFFICE_LABELS, OFFICE_ORDER } from "../utils/officeChecks";
import { formatDate } from "@/student/features/clearance/utils/format";
import type { RequestStatus } from "../types";

const STATUS_META: Record<RequestStatus, { label: string; icon: LucideIcon; tone: string }> = {
  signed: { label: "Signed", icon: CheckCircle2, tone: "text-emerald-700" },
  requested: { label: "Awaiting signature", icon: Clock3, tone: "text-amber-700" },
  rejected: { label: "Needs action", icon: AlertTriangle, tone: "text-rose-700" },
  not_requested: { label: "Not requested", icon: Circle, tone: "text-slate-500" },
};

/**
 * Signature caption timestamp: "Oct 09, 2026 10:42 AM" — the same en-US
 * pieces the student page builds its timestamps from, minus the separator.
 */
function stampDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const day = date.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
  const time = date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  return `${day} ${time}`;
}

/** Six-office progress strip: vertical list below `sm`, scrollable row above. */
export function OfficeProgressStepper() {
  const { selectedRow, selectedRecord, rows, selectRow } = useClearanceAdmin();
  if (!selectedRow || !selectedRecord) return null;

  const signedCount = selectedRecord.offices.filter((office) => office.status === "signed").length;

  return (
    <section aria-labelledby="office-progress-heading" className="min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-1.5">
        <h3
          id="office-progress-heading"
          className="font-poppins text-[10px] font-bold tracking-[0.12em] text-cpc-heading-soft uppercase"
        >
          Office progress
        </h3>
        <p className="font-poppins text-[11px] font-semibold text-cpc-navy-text">
          {signedCount} of {OFFICE_ORDER.length} signed
        </p>
      </div>

      <ol className="mt-2 flex flex-col gap-2 sm:flex-row sm:gap-1.5 sm:overflow-x-auto sm:pb-1">
        {OFFICE_ORDER.map((office, index) => {
          const signature = selectedRecord.offices.find((entry) => entry.office === office);
          const status: RequestStatus = signature?.status ?? "not_requested";
          const row = rows.find(
            (entry) => entry.studentId === selectedRecord.studentId && entry.office === office,
          );
          const isCurrent = office === selectedRow.office;
          const clickable = Boolean(row) && !isCurrent;
          const meta = STATUS_META[status];
          const Icon = meta.icon;
          const label = OFFICE_LABELS[office];
          const caption =
            status === "signed" && signature?.respondedAt
              ? `${signature.signerName ?? label} · ${label} · ${stampDateTime(signature.respondedAt)}`
              : null;

          const shellClass = cn(
            "w-full min-w-0 rounded-xl border p-2.5 text-left transition-colors motion-reduce:animate-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent",
            isCurrent
              ? "border-cpc-blue-accent bg-cpc-section-light ring-1 ring-cpc-blue-accent/40"
              : "border-cpc-tile-border/70 bg-white",
            clickable && "cursor-pointer hover:bg-cpc-section-light/70",
          );

          const body = (
            <>
              <span className="flex min-w-0 items-center gap-1.5">
                <span
                  aria-hidden
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold",
                    isCurrent
                      ? "border-cpc-blue-accent bg-cpc-blue-accent text-white"
                      : "border-cpc-tile-border bg-cpc-section-light text-cpc-label",
                  )}
                >
                  {index + 1}
                </span>
                <span className="min-w-0 truncate font-poppins text-[11px] font-bold text-cpc-navy-text">
                  {label}
                </span>
              </span>
              <p
                className={cn(
                  "mt-1 flex items-center gap-1 font-poppins text-[10px] font-semibold",
                  meta.tone,
                )}
              >
                <Icon className="h-3 w-3 shrink-0" aria-hidden />
                {meta.label}
                {isCurrent && <span className="font-normal text-cpc-heading-soft"> · this request</span>}
              </p>
              {status === "signed" && signature?.signerName && (
                <p className="mt-0.5 font-poppins text-[10px] leading-snug break-words text-cpc-heading-soft">
                  {signature.signerName}
                  {signature.respondedAt ? ` · ${formatDate(signature.respondedAt)}` : ""}
                </p>
              )}
              {caption && (
                <p className="mt-1 font-poppins text-[9px] leading-snug break-words text-cpc-heading-soft">
                  {caption}
                </p>
              )}
            </>
          );

          return (
            <li key={office} className="min-w-0 sm:w-44 sm:shrink-0">
              {clickable && row ? (
                <button
                  type="button"
                  onClick={() => selectRow(row.id)}
                  aria-label={`Review the ${label} request for ${selectedRecord.studentName}`}
                  className={shellClass}
                >
                  {body}
                </button>
              ) : (
                <div aria-current={isCurrent ? "step" : undefined} className={shellClass}>
                  {body}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
