import { CalendarRange, Layers3, RotateCcw } from "lucide-react";
import {
  ACADEMIC_YEARS,
  SEMESTERS,
  type AcademicYear,
  type Semester,
} from "../data/academicCalendar";
import { inputClass } from "./CalendarPieces";

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
      className="rounded-2xl border border-cpc-tile-border/70 bg-white px-4 py-3 shadow-[0_18px_50px_rgba(15,36,104,0.22)]"
    >
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="flex items-center gap-1.5 font-poppins text-[10px] font-bold tracking-[0.08em] text-cpc-heading-soft uppercase">
            <Layers3 className="h-3.5 w-3.5 text-cpc-blue-accent" aria-hidden />
            <span id="academic-period-heading">Academic Period</span>
          </span>

          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 font-poppins text-[11px] font-semibold text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
            Active A.Y.
          </span>

          <label className="flex items-center gap-1.5">
            <span className="sr-only">Academic year</span>
            <select
              value={year}
              onChange={(event) => onYearChange(event.target.value as AcademicYear)}
              className={`${inputClass} !w-auto !py-1.5 !text-xs font-semibold`}
            >
              {ACADEMIC_YEARS.map((option) => (
                <option key={option} value={option}>
                  A.Y. {option}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-1.5">
            <span className="sr-only">Semester</span>
            <select
              value={semester}
              onChange={(event) =>
                onSemesterChange(event.target.value as Semester | "All Semesters")
              }
              className={`${inputClass} !w-auto !py-1.5 !text-xs font-semibold`}
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
            className="inline-flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1.5 font-poppins text-[11px] font-semibold text-cpc-blue-accent transition-colors hover:bg-cpc-section-light focus-visible:outline-2 focus-visible:outline-cpc-blue-accent"
          >
            <RotateCcw className="h-3 w-3" aria-hidden />
            Reset
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 font-poppins text-[11px] text-cpc-heading-soft">
          <span className="inline-flex items-center gap-1.5">
            <CalendarRange className="h-3.5 w-3.5 text-cpc-blue-accent" aria-hidden />
            <span>
              Calendar range: <span className="font-semibold text-cpc-navy-text">{range}</span>
            </span>
          </span>
          <span className="rounded-full border border-cpc-tile-border bg-cpc-section-light px-2 py-1 font-semibold text-cpc-navy-text">
            {eventCount} {eventCount === 1 ? "event" : "events"}
          </span>
        </div>
      </div>
    </section>
  );
}
