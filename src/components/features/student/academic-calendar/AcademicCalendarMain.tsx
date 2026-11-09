import { CalendarColumns } from "@/components/features/student/academic-calendar/CalendarColumns";
import { CalendarToolbar } from "@/components/features/student/academic-calendar/CalendarToolbar";
import type { AcademicCalendar } from "@/components/features/student/academic-calendar/useAcademicCalendar";

/** Scrollable body of the academic calendar page. */
export function AcademicCalendarMain({ calendar }: { calendar: AcademicCalendar }) {
  return (
    <main className="w-full bg-white">
      <div className="mx-auto w-full max-w-[1280px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <CalendarToolbar calendar={calendar} />
        <CalendarColumns calendar={calendar} />
      </div>
    </main>
  );
}
