import { PortalFooter } from "@/student/layout/portal-footer";
import { PortalHeader } from "@/student/layout/portal-header";
import { useAcademicCalendar } from "../hooks/useAcademicCalendar";
import { AcademicCalendarHero } from "./AcademicCalendarHero";
import { AcademicCalendarMain } from "./AcademicCalendarMain";
import { CalendarDialogs } from "./CalendarDialogs";

/**
 * Owns the single calendar state tree and hands it to the regions below it.
 * `useAcademicCalendar` holds component state, so it must not be called twice.
 */
export function AcademicCalendarView() {
  const calendar = useAcademicCalendar();

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-white font-poppins">
      <PortalHeader />

      <AcademicCalendarHero />

      <AcademicCalendarMain calendar={calendar} />

      <PortalFooter />

      <CalendarDialogs calendar={calendar} />
    </div>
  );
}
