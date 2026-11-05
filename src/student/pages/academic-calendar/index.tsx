import { ToastProvider } from "@/components/ui/toast";
import { AcademicCalendarView } from "@/student/features/academic-calendar/components/AcademicCalendarView";

/** Route: /academics/academic-calendar — frontend-only sample data. */
export default function AcademicCalendarPage() {
  return (
    <ToastProvider>
      <AcademicCalendarView />
    </ToastProvider>
  );
}
