import { useSchedule } from "@/components/features/student/schedules/useSchedule";
import { CalendarCard } from "@/components/features/student/schedules/CalendarCard";
import { CalendarSidebar } from "@/components/features/student/schedules/CalendarSidebar";
import { RegistrarHelpCard, ScheduleLegend } from "@/components/features/student/schedules/ScheduleLegend";

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
