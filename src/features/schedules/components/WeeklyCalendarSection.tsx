import { useSchedule } from "../hooks/useSchedule";
import { CalendarCard } from "./CalendarCard";
import { CalendarSidebar } from "./CalendarSidebar";
import { RegistrarHelpCard, ScheduleLegend } from "./ScheduleLegend";

/** Weekly calendar region: chips legend, calendar card, sidebar, and mobile help card. */
export function WeeklyCalendarSection() {
  const { schedule } = useSchedule();

  return (
    <section aria-labelledby="weekly-calendar-heading" className="mt-6">
      {/* Tablet / mobile: chips above the calendar. */}
      <div className="mb-4 xl:hidden print:hidden">
        <ScheduleLegend entries={schedule.entries} layout="chips" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <CalendarCard />
        <CalendarSidebar />
      </div>

      {/* Tablet / mobile: registrar card below the calendar. */}
      <div className="mt-4 xl:hidden print:hidden">
        <RegistrarHelpCard />
      </div>
    </section>
  );
}
