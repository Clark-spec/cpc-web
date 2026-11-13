import { CalendarRange, Layers3, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  ACADEMIC_YEARS,
  SEMESTERS,
  type AcademicYear,
  type Semester,
} from "../data/academicCalendar";

type AcademicPeriodBarProps = {
  year: AcademicYear;
  semester: Semester | "All Semesters";
  range: string;
  eventCount: number;
  onYearChange: (year: AcademicYear) => void;
  onSemesterChange: (semester: Semester | "All Semesters") => void;
  onReset: () => void;
};

/**
 * Academic year + semester controls. The selection drives every section on the
 * page, so this bar is the single place the calendar scope is defined.
 */
export function AcademicPeriodBar({
  year,
  semester,
  range,
  eventCount,
  onYearChange,
  onSemesterChange,
  onReset,
}: AcademicPeriodBarProps) {
  return (
    <section
      aria-labelledby="academic-period-heading"
      className="rounded-2xl border border-white/80 bg-white/85 px-4 py-3.5 shadow-[0_8px_30px_rgb(15,36,104,0.04)] backdrop-blur-md"
    >
      <div className="flex flex-col gap-3.5 xl:flex-row xl:items-center xl:justify-between">
        {/* Left Side: Scope Badge + Controls (grouped together so they never break apart) */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Section Indicator */}
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-cpc-blue-accent/10 text-cpc-blue-accent shadow-2xs">
              <Layers3 className="h-4 w-4" aria-hidden />
            </span>
            <div className="flex items-center gap-1.5">
              <span
                id="academic-period-heading"
                className="font-poppins text-xs font-bold tracking-wider text-cpc-navy-text uppercase"
              >
                Academic Period
              </span>
              <Badge tone="success" size="sm">
                Active A.Y.
              </Badge>
            </div>
          </div>

          <span className="hidden h-5 w-px bg-cpc-input-border/60 sm:inline-block" aria-hidden />

          {/* Controls: Academic Year + Semester + Reset Button */}
          <div className="flex items-center gap-2 shrink-0">
            <label className="flex items-center">
              <span className="sr-only">Academic year</span>
              <select
                value={year}
                onChange={(event) => onYearChange(event.target.value as AcademicYear)}
                className="h-9 cursor-pointer rounded-xl border border-cpc-input-border/80 bg-white/95 px-3 py-1.5 font-poppins text-xs font-semibold text-cpc-navy-text shadow-2xs backdrop-blur-xs transition-colors hover:border-cpc-blue-accent/40 focus:border-cpc-blue-accent focus:outline-hidden focus:ring-2 focus:ring-cpc-blue-accent/20"
              >
                {ACADEMIC_YEARS.map((option) => (
                  <option key={option} value={option}>
                    A.Y. {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-center">
              <span className="sr-only">Semester</span>
              <select
                value={semester}
                onChange={(event) =>
                  onSemesterChange(event.target.value as Semester | "All Semesters")
                }
                className="h-9 cursor-pointer rounded-xl border border-cpc-input-border/80 bg-white/95 px-3 py-1.5 font-poppins text-xs font-semibold text-cpc-navy-text shadow-2xs backdrop-blur-xs transition-colors hover:border-cpc-blue-accent/40 focus:border-cpc-blue-accent focus:outline-hidden focus:ring-2 focus:ring-cpc-blue-accent/20"
              >
                <option value="All Semesters">All Semesters</option>
                {SEMESTERS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={onReset}
              className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-xl border border-cpc-input-border/70 bg-white/90 px-3 py-1.5 font-poppins text-xs font-semibold text-cpc-navy-text shadow-2xs backdrop-blur-xs transition-all hover:border-cpc-blue-accent/30 hover:bg-cpc-section-light hover:text-cpc-blue-accent focus-visible:outline-2 focus-visible:outline-cpc-blue-accent"
              title="Reset academic period"
            >
              <RotateCcw className="h-3.5 w-3.5 text-cpc-muted-blue" aria-hidden />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Right Side: Calendar Range + Total Events (grouped together so they never break apart) */}
        <div className="flex items-center gap-2.5 shrink-0 self-start xl:self-auto">
          <div className="inline-flex items-center gap-2 rounded-xl border border-cpc-input-border/60 bg-cpc-section-light/60 px-3 py-1.5 font-poppins text-xs text-cpc-heading-soft shadow-2xs">
            <CalendarRange className="h-3.5 w-3.5 text-cpc-blue-accent shrink-0" aria-hidden />
            <span>
              Calendar range:{" "}
              <strong className="font-semibold text-cpc-navy-text">{range}</strong>
            </span>
          </div>

          <span className="inline-flex items-center rounded-xl border border-cpc-blue-accent/20 bg-cpc-blue-accent/10 px-2.5 py-1.5 font-poppins text-xs font-bold text-cpc-blue-accent shadow-2xs tabular-nums whitespace-nowrap">
            {eventCount} {eventCount === 1 ? "event" : "events"}
          </span>
        </div>
      </div>
    </section>
  );
}
