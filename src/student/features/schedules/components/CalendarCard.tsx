import { CalendarDays } from "lucide-react";
import { useSchedule } from "../hooks/useSchedule";
import { CalendarSkeleton } from "./ScheduleSkeletons";
import { EmptyWeeklyCalendar } from "./EmptySchedule";
import { WeeklyCalendar } from "./WeeklyCalendar";

/** The white "Weekly Calendar" card: header plus the grid, agenda, or empty state. */
export function CalendarCard() {
  const { schedule, loading, openEntry } = useSchedule();
  const hasEntries = schedule.entries.length > 0;

  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-cpc-input-border bg-white shadow-[0_10px_30px_rgba(27,47,158,0.06)] print:border-0 print:shadow-none">
      <div className="flex items-center justify-between gap-3 border-b border-cpc-input-border px-4 py-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cpc-section-light text-cpc-blue-accent">
            <CalendarDays className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <h2
              id="weekly-calendar-heading"
              className="font-poppins text-base leading-tight font-bold text-cpc-navy-text"
            >
              Weekly Calendar
            </h2>
            <p className="mt-0.5 font-poppins text-[11px] text-cpc-heading-soft">
              Monday to Saturday · 7:00 AM – 8:00 PM
            </p>
          </div>
        </div>
      </div>

      <div aria-busy={loading}>
        {loading ? (
          <CalendarSkeleton />
        ) : hasEntries ? (
          <div className="schedule-fade">
            <WeeklyCalendar schedule={schedule} onOpenEntry={openEntry} />
          </div>
        ) : (
          <EmptyWeeklyCalendar />
        )}
      </div>
    </div>
  );
}
