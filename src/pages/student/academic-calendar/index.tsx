import { ToastProvider } from "@/components/ui/toast";
import { AcademicCalendarView } from "@/components/features/student/academic-calendar/AcademicCalendarView";

/** Route: /academics/academic-calendar — frontend-only sample data. */
export default function AcademicCalendarPage() {
  return (
    <ToastProvider>
      <AcademicCalendarView />
    </ToastProvider>
  );
}
