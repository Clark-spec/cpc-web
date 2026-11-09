import { CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useClearance } from "@/components/features/student/clearance/ClearanceContext";
import { useClearanceProgress } from "@/components/features/student/clearance/useClearanceProgress";

/** Section 1: live progress across the six signatories. */
export function ClearanceStatusCard() {
  const { student } = useClearance();
  const { total, signed, pending, percent, isCleared } = useClearanceProgress();

  return (
    <section
      aria-labelledby="status-heading"
      className="flex h-full flex-col justify-between rounded-2xl border border-white/80 bg-white/85 p-5 shadow-[0_8px_30px_rgb(15,36,104,0.04)] backdrop-blur-md transition-all sm:p-6"
    >
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <h2 id="status-heading" className="font-poppins text-lg font-bold text-cpc-navy-text">
              Clearance Status
            </h2>
            <p className="mt-0.5 font-poppins text-xs text-cpc-heading-soft">
              {student.semester}, A.Y. {student.academicYear}
            </p>
          </div>
          <div className="shrink-0">
            {isCleared ? (
              <Badge tone="success" className="gap-1.5 px-3 py-1 text-xs shadow-2xs">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                Cleared
              </Badge>
            ) : (
              <Badge tone="warning" className="gap-1.5 px-3 py-1 text-xs shadow-2xs">
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" aria-hidden />
                In Progress
              </Badge>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-4 rounded-xl border border-white/80 bg-white/60 p-3.5 shadow-2xs backdrop-blur-xs">
          <p className="font-poppins text-3xl leading-none font-bold text-cpc-navy-text sm:text-4xl tabular-nums">
            {percent}%
          </p>

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2 font-poppins text-[11px] font-medium text-cpc-heading-soft">
              <span>
                <strong className="text-cpc-navy-text font-semibold">{signed}</strong> of {total} offices cleared
              </span>
              <span className="font-semibold text-amber-700">{pending} pending</span>
            </div>
            <div
              role="progressbar"
              aria-label="Clearance progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={percent}
              aria-valuetext={`${signed} of ${total} offices cleared`}
              className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-cpc-section-light/90 border border-cpc-tile-border/30"
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-700 ease-out"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        </div>

        <dl className="mt-3.5 grid grid-cols-3 gap-2.5 sm:gap-3">
          <div className="flex flex-col-reverse rounded-xl border border-emerald-200/80 bg-emerald-50/80 p-3 text-center sm:text-left backdrop-blur-xs shadow-2xs">
            <dt className="mt-0.5 font-poppins text-[10.5px] font-semibold text-emerald-800">Completed</dt>
            <dd className="font-poppins text-2xl leading-none font-bold text-emerald-700 tabular-nums">
              {signed}
            </dd>
          </div>
          <div className="flex flex-col-reverse rounded-xl border border-amber-200/80 bg-amber-50/80 p-3 text-center sm:text-left backdrop-blur-xs shadow-2xs">
            <dt className="mt-0.5 font-poppins text-[10.5px] font-semibold text-amber-800">Pending</dt>
            <dd className="font-poppins text-2xl leading-none font-bold text-amber-700 tabular-nums">
              {pending}
            </dd>
          </div>
          <div className="flex flex-col-reverse rounded-xl border border-cpc-tile-border/60 bg-cpc-section-light/80 p-3 text-center sm:text-left backdrop-blur-xs shadow-2xs">
            <dt className="mt-0.5 font-poppins text-[10.5px] font-semibold text-cpc-heading-soft">Total Offices</dt>
            <dd className="font-poppins text-2xl leading-none font-bold text-cpc-blue-accent tabular-nums">
              {total}
            </dd>
          </div>
        </dl>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-cpc-tile-border/40 pt-3 text-[11px] font-poppins text-cpc-heading-soft">
        <span>
          Student ID: <strong className="font-semibold text-cpc-navy-text">{student.studentId}</strong>
        </span>
        <span className="font-medium">
          {isCleared ? "All clearances verified" : "Submit signature requests below"}
        </span>
      </div>
    </section>
  );
}
