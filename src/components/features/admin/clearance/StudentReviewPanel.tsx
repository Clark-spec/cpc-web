import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Info,
  Loader2,
  ShieldOff,
  UserRound,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/badge";
import { StudentQuickViewDrawer } from "@/components/common/feedback/StudentQuickViewDrawer";
import type { ActivityStudent } from "@/types/admin";
import { formatDate } from "@/lib/format";
import { useClearanceAdmin } from "@/components/features/admin/clearance/ClearanceAdminContext";
import { OFFICE_LABELS } from "@/components/features/admin/clearance/officeChecks";
import { formatAge, overdueLabel } from "@/components/features/admin/clearance/sla";
import type { ClearanceRequestRow } from "@/components/features/admin/clearance/types";
import { OfficeChecklist } from "@/components/features/admin/clearance/OfficeChecklist";
import { OfficeProgressStepper } from "@/components/features/admin/clearance/OfficeProgressStepper";
import { Form3Preview } from "@/components/features/admin/clearance/Form3Preview";
import { RequestTimeline } from "@/components/features/admin/clearance/RequestTimeline";
import { StatusBadge } from "@/components/features/admin/clearance/StatusBadge";

export type StudentReviewPanelProps = {
  onSign: (row: ClearanceRequestRow) => void;
  onReject: (row: ClearanceRequestRow) => void;
  onRevoke: (row: ClearanceRequestRow) => void;
  /** Only used in sheet (mobile dialog) mode. */
  onClose?: () => void;
  /** Render as the mobile full-screen sheet instead of the side panel. */
  sheet?: boolean;
};

const BTN =
  "inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3.5 py-2.5 font-poppins text-sm font-semibold transition-colors motion-reduce:animate-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent disabled:cursor-not-allowed disabled:opacity-60";
const BTN_PRIMARY = `${BTN} bg-cpc-button text-white hover:bg-cpc-navy`;
const BTN_ROSE = `${BTN} border border-rose-300 text-rose-700 hover:bg-rose-50`;
const BTN_NEUTRAL = `${BTN} border border-cpc-tile-border text-cpc-navy-text hover:bg-cpc-section-light`;
const KBD =
  "rounded border border-cpc-tile-border bg-cpc-section-light px-1 py-px font-poppins text-[10px] font-bold text-cpc-label";

function initialsOf(name: string): string {
  return name
    .split(" ")
    .map((part) => part.charAt(0))
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function emailFor(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "");
  return `${slug}@cpc.edu.ph`;
}

/**
 * One-line explanation shown under the footer buttons when the request can no
 * longer be decided here — disabled buttons always come with visible text.
 */
function decisionBlockReason(
  row: ClearanceRequestRow,
  homeOffice: ClearanceRequestRow["office"] | null,
  homePrograms?: string[] | null,
): string | null {
  if (homeOffice && row.office !== homeOffice) {
    return `This request belongs to the ${OFFICE_LABELS[row.office]}, not your office.`;
  }
  if (homeOffice === "dean" && homePrograms && homePrograms.length > 0) {
    const matches = homePrograms.some((prog) => {
      const pLower = prog.toLowerCase();
      const rLower = (row.program ?? "").toLowerCase();
      return rLower.includes(pLower) || pLower.includes(rLower);
    });
    if (!matches) {
      return `This student's program (${row.program}) is not under your department.`;
    }
  }
  switch (row.status) {
    case "requested":
      return null;
    case "signed":
      return `Already signed by ${row.signerName ?? "the office"}${
        row.respondedAt ? ` on ${formatDate(row.respondedAt)}` : ""
      }.`;
    case "rejected":
      return "Returned to student — they can request again.";
    case "not_requested":
      return "The student has not requested this signature yet.";
  }
}

/**
 * The review panel — page layout row 4, spec section 4: student header,
 * office stepper, note, checks, Form 3, timeline, and the sticky action
 * footer with J/K stepping. All data comes from the admin context; the props
 * only wire the footer buttons to the page-level modals.
 */
export function StudentReviewPanel({
  onSign,
  onReject,
  onRevoke,
  onClose,
  sheet = false,
}: StudentReviewPanelProps) {
  const { selectedRow, selectedRecord, busy, isSuperAdmin, homeOffice, homePrograms, stepRequest } =
    useClearanceAdmin();

  const headingId = useId();
  const panelRef = useRef<HTMLElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);

  /* "View full profile" reuses the dashboard drawer, which wants an ActivityStudent. */
  const profileStudent = useMemo<ActivityStudent | null>(() => {
    if (!profileOpen || !selectedRow) return null;
    return {
      id: selectedRow.studentId,
      name: selectedRow.studentName,
      program: selectedRow.program,
      section: selectedRow.section,
      yearLevel: selectedRow.yearLevel,
      email: emailFor(selectedRow.studentName),
    };
  }, [profileOpen, selectedRow]);

  /* Sheet mode mirrors StudentQuickViewDrawer: focus in on open, back on close. */
  useEffect(() => {
    if (!sheet) return;
    // Guard: do not lock body scroll if on desktop (>= 1280px)
    if (typeof window !== "undefined" && window.innerWidth >= 1280) return;

    previouslyFocused.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const frame = window.requestAnimationFrame(() => panelRef.current?.focus());

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose?.();
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
  }, [sheet, onClose]);

  if (!selectedRow || !selectedRecord) {
    return (
      <section
        aria-label="Student review"
        className="flex min-h-64 flex-col items-center justify-center gap-2 rounded-2xl border border-white/80 bg-white/85 px-6 py-10 text-center shadow-[0_8px_30px_rgb(15,36,104,0.04)] backdrop-blur-md"
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-cpc-section-light text-cpc-blue-accent">
          <ClipboardList className="h-5 w-5" aria-hidden />
        </span>
        <h2 className="font-poppins text-sm font-semibold text-cpc-navy-text">
          Select a request to review it
        </h2>
        <p className="max-w-60 font-poppins text-xs leading-relaxed text-cpc-heading-soft">
          Choose a student from the queue to see their profile, office checks, Form 3 data and
          audit trail.
        </p>
      </section>
    );
  }

  const row = selectedRow;
  const blockReason = decisionBlockReason(row, homeOffice, homePrograms);
  const canDecide = blockReason === null;
  const canRevoke = isSuperAdmin && row.status === "signed";

  return (
    <>
      <section
        ref={panelRef}
        tabIndex={-1}
        role={sheet ? "dialog" : "complementary"}
        aria-modal={sheet ? true : undefined}
        aria-labelledby={sheet ? headingId : undefined}
        aria-label={sheet ? undefined : "Student review"}
        className={cn(
          "flex flex-col overflow-hidden outline-none",
          sheet
            ? "fixed inset-y-0 right-0 z-[70] h-full w-full rounded-none border-l border-white/80 bg-white shadow-none sm:max-w-md sm:rounded-l-2xl"
            : "max-h-[min(52rem,calc(100vh-7rem))] rounded-2xl border border-white/80 bg-white/85 shadow-[0_8px_30px_rgb(15,36,104,0.04)] backdrop-blur-md",
        )}
      >
        {sheet && (
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-cpc-tile-border/70 bg-cpc-bg px-4 py-3">
            <p className="font-poppins text-[11px] font-bold tracking-[0.14em] text-cpc-blue-accent uppercase">
              Student review
            </p>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close review panel"
              className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-cpc-heading-soft transition-colors hover:bg-white hover:text-cpc-navy-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
        )}

        <div className="admin-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
          {/* 1. Student header */}
          <header className="flex items-start gap-3">
            <span
              aria-hidden
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-cpc-navy font-poppins text-sm font-semibold text-white"
            >
              {initialsOf(row.studentName)}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <h2
                  id={headingId}
                  className="min-w-0 font-poppins text-base leading-snug font-bold text-cpc-navy-text sm:text-lg"
                >
                  {row.studentName}
                </h2>
                <StatusBadge status={row.status} />
                {row.isOverdue && (
                  <Badge tone="danger">
                    <AlertTriangle className="h-3 w-3" aria-hidden />
                    {overdueLabel(row.ageHours)}
                  </Badge>
                )}
              </div>
              <p className="mt-1 font-poppins text-[11px] leading-relaxed break-words text-cpc-heading-soft">
                {row.studentId} · {row.program} · {row.yearLevel} · {row.section}
              </p>
              <p className="mt-0.5 font-poppins text-[11px] text-cpc-heading-soft">
                {row.term} Semester · AY {row.academicYear}
              </p>
              <button
                type="button"
                onClick={() => setProfileOpen(true)}
                className="mt-1.5 inline-flex cursor-pointer items-center gap-1 rounded px-1 py-0.5 font-poppins text-[11px] font-semibold text-cpc-blue-accent underline decoration-dotted underline-offset-2 transition-colors hover:text-cpc-navy-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
              >
                <UserRound className="h-3.5 w-3.5" aria-hidden />
                View full profile
              </button>
            </div>
          </header>

          {/* 2. Office progress */}
          <OfficeProgressStepper />

          {/* 3. Student note */}
          <section aria-labelledby={`${headingId}-note`} className="min-w-0">
            <h3
              id={`${headingId}-note`}
              className="font-poppins text-[10px] font-bold tracking-[0.12em] text-cpc-heading-soft uppercase"
            >
              Student&rsquo;s note
            </h3>
            {row.studentNote ? (
              <>
                <blockquote className="mt-1.5 rounded-xl border border-cpc-tile-border/70 bg-cpc-section-light/60 px-3.5 py-3 font-poppins text-sm leading-relaxed break-words text-cpc-navy-text">
                  &ldquo;{row.studentNote}&rdquo;
                </blockquote>
                <p className="mt-1.5 font-poppins text-[11px] text-cpc-heading-soft">
                  {row.requestedAt
                    ? `Requested on ${formatDate(row.requestedAt)} · ${formatAge(row.ageHours)} ago`
                    : "Requested recently · no date recorded"}
                </p>
              </>
            ) : (
              <p className="mt-1.5 rounded-xl border border-dashed border-cpc-tile-border/70 px-3.5 py-2.5 font-poppins text-xs text-cpc-heading-soft italic">
                No note added
              </p>
            )}
          </section>

          {/* 4. Office checks (re-keyed by the page so local state resets) */}
          <OfficeChecklist />

          {/* 5. Form 3 */}
          <Form3Preview />

          {/* 6. Audit trail */}
          <RequestTimeline />
        </div>

        {/* 7. Sticky action footer */}
        <footer className="shrink-0 border-t border-cpc-tile-border/70 bg-white px-3 py-3 sm:px-4">
          {!canDecide && (
            <p
              role="status"
              className="mb-2 flex items-start gap-1.5 font-poppins text-[11px] leading-snug text-amber-700"
            >
              <Info className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden />
              {blockReason}
            </p>
          )}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => stepRequest(-1)}
                aria-label="Previous request (keyboard shortcut J)"
                className={cn(BTN, BTN_NEUTRAL, "px-2.5")}
              >
                <ArrowLeft className="h-4 w-4" aria-hidden />
                <kbd className={KBD}>J</kbd>
              </button>
              <button
                type="button"
                onClick={() => stepRequest(1)}
                aria-label="Next request (keyboard shortcut K)"
                className={cn(BTN, BTN_NEUTRAL, "px-2.5")}
              >
                <kbd className={KBD}>K</kbd>
                <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:justify-end">
              <button
                type="button"
                onClick={() => onSign(row)}
                disabled={busy || !canDecide}
                className={cn(BTN_PRIMARY, "col-span-2")}
              >
                {busy && canDecide ? (
                  <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden />
                ) : (
                  <CheckCircle2 className="h-4 w-4" aria-hidden />
                )}
                {busy && canDecide ? "Signing…" : "Approve & Sign"}
              </button>
              <button
                type="button"
                onClick={() => onReject(row)}
                disabled={busy || !canDecide}
                className={cn(BTN_ROSE, !canRevoke && "col-span-2")}
              >
                <X className="h-4 w-4" aria-hidden />
                Reject
              </button>
              {canRevoke && (
                <button
                  type="button"
                  onClick={() => onRevoke(row)}
                  disabled={busy}
                  className={BTN_NEUTRAL}
                >
                  <ShieldOff className="h-4 w-4" aria-hidden />
                  Revoke signature
                </button>
              )}
            </div>
          </div>
        </footer>
      </section>

      <StudentQuickViewDrawer
        student={profileStudent}
        activity={[]}
        onClose={() => setProfileOpen(false)}
      />
    </>
  );
}
