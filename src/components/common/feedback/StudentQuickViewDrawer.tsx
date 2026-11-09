import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router";
import {
  ArrowRight,
  GraduationCap,
  Mail,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
import { StatusBadge } from "@/components/common/display/StatusBadge";
import type { ActivityItem, ActivityStudent } from "@/types/admin";

type StudentQuickViewDrawerProps = {
  student: ActivityStudent | null;
  activity: ActivityItem[];
  onClose: () => void;
};

/** Right-hand drawer with a student snapshot and a link to their clearance. */
export function StudentQuickViewDrawer({
  student,
  activity,
  onClose,
}: StudentQuickViewDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!student) return;

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
  }, [onClose, student]);

  if (!student) return null;

  const studentActivity = activity.filter((item) => item.student?.id === student.id);

  return createPortal(
    <div className="fixed inset-0 z-[80] flex justify-end">
      <div
        className="admin-drawer-backdrop absolute inset-0 bg-cpc-navy-deep/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={`${student.name} quick view`}
        className="admin-quick-view relative flex h-full w-full max-w-md flex-col bg-white shadow-[0_24px_80px_rgba(15,36,104,0.35)]"
      >
        <div className="flex items-start justify-between gap-3 border-b border-cpc-tile-border/70 bg-cpc-bg px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-cpc-navy font-poppins text-sm font-semibold text-white">
              {student.name
                .split(" ")
                .map((part) => part.charAt(0))
                .slice(0, 2)
                .join("")}
            </span>
            <div className="min-w-0">
              <h2 className="truncate font-poppins text-base font-semibold text-cpc-navy-text">
                {student.name}
              </h2>
              <p className="truncate font-poppins text-[11px] text-cpc-heading-soft">
                {student.id}
              </p>
            </div>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close student quick view"
            className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-cpc-heading-soft transition-colors hover:bg-white hover:text-cpc-navy-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="admin-scrollbar flex-1 overflow-y-auto px-5 py-4">
          <dl className="space-y-3">
            <div className="flex items-start gap-2.5">
              <GraduationCap className="mt-0.5 h-4 w-4 shrink-0 text-cpc-blue-accent" aria-hidden />
              <div>
                <dt className="font-poppins text-[10px] font-bold tracking-[0.1em] text-cpc-heading-soft uppercase">
                  Program
                </dt>
                <dd className="font-poppins text-xs font-medium text-cpc-navy-text">
                  {student.program}
                </dd>
                <dd className="font-poppins text-[11px] text-cpc-heading-soft">
                  {student.section} · {student.yearLevel}
                </dd>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-cpc-blue-accent" aria-hidden />
              <div>
                <dt className="font-poppins text-[10px] font-bold tracking-[0.1em] text-cpc-heading-soft uppercase">
                  Email
                </dt>
                <dd className="font-poppins text-xs font-medium break-all text-cpc-navy-text">
                  {student.email || "Not provided"}
                </dd>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-cpc-blue-accent" aria-hidden />
              <div>
                <dt className="font-poppins text-[10px] font-bold tracking-[0.1em] text-cpc-heading-soft uppercase">
                  Student ID
                </dt>
                <dd className="font-poppins text-xs font-medium text-cpc-navy-text">
                  {student.id}
                </dd>
              </div>
            </div>
          </dl>

          <div className="mt-5">
            <h3 className="font-poppins text-[10px] font-bold tracking-[0.12em] text-cpc-heading-soft uppercase">
              Recent activity
            </h3>
            {studentActivity.length === 0 ? (
              <p className="mt-2 rounded-lg bg-cpc-section-light/50 px-3 py-3 font-poppins text-[11px] text-cpc-heading-soft">
                No activity recorded for this student in the last 30 events.
              </p>
            ) : (
              <ul className="mt-2 space-y-2">
                {studentActivity.slice(0, 4).map((item) => (
                  <li
                    key={item.id}
                    className="rounded-lg border border-cpc-tile-border/60 px-3 py-2"
                  >
                    <p className="font-poppins text-[11px] font-medium text-cpc-navy-text">
                      {item.message}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <StatusBadge status={item.status} />
                      <span className="font-poppins text-[10px] text-cpc-heading-soft">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="shrink-0 border-t border-cpc-tile-border/70 p-4">
          <Link
            to={`/admin/clearance-requests?student=${encodeURIComponent(student.id)}`}
            onClick={onClose}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-cpc-button px-4 py-2.5 font-poppins text-sm font-semibold text-white transition-colors hover:bg-cpc-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
          >
            <ShieldCheck className="h-4 w-4" aria-hidden />
            View clearance requests
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </div>,
    document.body,
  );
}
