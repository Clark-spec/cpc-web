import { CalendarColumns } from "./CalendarColumns";
import { CalendarToolbar } from "./CalendarToolbar";
import type { AcademicCalendar } from "../hooks/useAcademicCalendar";

/** Scrollable body of the academic calendar page. */
export function AcademicCalendarMain({ calendar }: { calendar: AcademicCalendar }) {
  return (
    <main className="w-full bg-ac-page">
      <div className="mx-auto w-full max-w-[1280px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
        <CalendarToolbar calendar={calendar} />
        <CalendarColumns calendar={calendar} />
      </div>
    </main>
  );
}
