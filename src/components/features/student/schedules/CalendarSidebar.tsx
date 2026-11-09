import { useSchedule } from "@/components/features/student/schedules/useSchedule";
import { RegistrarHelpCard, ScheduleLegend } from "@/components/features/student/schedules/ScheduleLegend";

/** Desktop-only sticky rail beside the calendar: color legend and registrar help. */
export function CalendarSidebar() {
  const { schedule } = useSchedule();

  return (
    <aside className="hidden xl:block print:hidden">
      <div className="sticky top-6 space-y-4">
        <ScheduleLegend entries={schedule.entries} layout="sidebar" />
        <RegistrarHelpCard />
      </div>
    </aside>
  );
}
