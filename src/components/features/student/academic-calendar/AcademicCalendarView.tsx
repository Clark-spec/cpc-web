import { PortalFooter } from "@/components/common/layout/PortalFooter";
import { PortalHeader } from "@/components/common/layout/PortalHeader";
import { useAcademicCalendar } from "@/components/features/student/academic-calendar/useAcademicCalendar";
import { AcademicCalendarHero } from "@/components/features/student/academic-calendar/AcademicCalendarHero";
import { AcademicCalendarMain } from "@/components/features/student/academic-calendar/AcademicCalendarMain";
import { CalendarDialogs } from "@/components/features/student/academic-calendar/CalendarDialogs";

/**
 * Owns the single calendar state tree and hands it to the regions below it.
 * `useAcademicCalendar` holds component state, so it must not be called twice.
 */
export function AcademicCalendarView() {
  const calendar = useAcademicCalendar();

  return (
    <div className="min-h-screen w-full overflow-x-clip bg-white font-poppins">
      <PortalHeader />

      <AcademicCalendarHero />

      <AcademicCalendarMain calendar={calendar} />

      <PortalFooter />

      <CalendarDialogs calendar={calendar} />
    </div>
  );
}
