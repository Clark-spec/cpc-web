import { CheckCircle2 } from "lucide-react";
import { Badge } from "./Badge";
import { useClearance } from "../context/ClearanceContext";
import { useClearanceProgress } from "../hooks/useClearanceProgress";

/** Section 1: live progress across the six signatories. */
export function ClearanceStatusCard() {
  const { student } = useClearance();
  const { total, signed, pending, percent, isCleared } = useClearanceProgress();

  return (
    <section
      aria-labelledby="status-heading"
      className="rounded-xl border border-cpc-input-border bg-white p-5 shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="status-heading" className="font-poppins text-lg font-bold text-cpc-navy-text">
          Clearance Status
        </h2>
        {isCleared ? (
          <Badge tone="success">
            <CheckCircle2 className="h-3 w-3" aria-hidden />
            Cleared
          </Badge>
        ) : (
          <Badge tone="warning">In Progress</Badge>
        )}
      </div>

      <p className="mt-1 font-poppins text-xs text-cpc-heading-soft">
        {student.semester}, A.Y. {student.academicYear}
      </p>

      <div className="mt-4 flex items-center gap-4">
        <p className="font-poppins text-3xl leading-none font-bold text-cpc-navy-text sm:text-4xl">
          {percent}%
        </p>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2 font-poppins text-[11px] text-cpc-heading-soft">
            <span>
              {signed} of {total} offices cleared
            </span>
            <span>{pending} pending</span>
          </div>
          <div
            role="progressbar"
            aria-label="Clearance progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
            aria-valuetext={`${signed} of ${total} offices cleared`}
            className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-cpc-section-light"
          >
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-700 ease-out"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-2.5 sm:gap-3">
        <div className="flex flex-col-reverse rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5">
          <dt className="font-poppins text-[11px] font-medium text-emerald-800">Completed</dt>
          <dd className="font-poppins text-xl leading-tight font-bold text-emerald-700">{signed}</dd>
        </div>
        <div className="flex flex-col-reverse rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
          <dt className="font-poppins text-[11px] font-medium text-amber-800">Pending</dt>
          <dd className="font-poppins text-xl leading-tight font-bold text-amber-700">{pending}</dd>
        </div>
        <div className="flex flex-col-reverse rounded-lg border border-cpc-tile-border bg-cpc-section-light px-3 py-2.5">
          <dt className="font-poppins text-[11px] font-medium text-cpc-heading-soft">Total</dt>
          <dd className="font-poppins text-xl leading-tight font-bold text-cpc-blue-accent">{total}</dd>
        </div>
      </dl>
    </section>
  );
}
