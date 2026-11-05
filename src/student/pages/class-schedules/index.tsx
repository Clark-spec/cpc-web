import { PortalFooter } from "@/student/layout/portal-footer";
import { PortalHeader } from "@/student/layout/portal-header";
import { ToastProvider } from "@/components/ui/toast";
import { PageHero } from "@/student/features/schedules/components/PageHero";
import { ScheduleContent } from "@/student/features/schedules/components/ScheduleContent";
import { SelectedSubjectDialog } from "@/student/features/schedules/components/SelectedSubjectDialog";
import { ScheduleProvider } from "@/student/features/schedules/hooks/useSchedule";

/** Route: /academics/class-schedules */
export default function ClassSchedulesPage() {
  return (
    <ToastProvider>
      <ScheduleProvider>
        <div className="min-h-screen w-full overflow-x-hidden bg-white font-poppins">
          <PortalHeader />
          <PageHero />
          <ScheduleContent />
          <PortalFooter />
          <SelectedSubjectDialog />
        </div>
      </ScheduleProvider>
    </ToastProvider>
  );
}
