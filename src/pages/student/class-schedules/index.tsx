import { PortalFooter } from "@/components/common/PortalFooter";
import { PortalHeader } from "@/components/common/PortalHeader";
import { ToastProvider } from "@/components/ui/toast";
import { PageHero } from "@/components/features/student/schedules/PageHero";
import { ScheduleContent } from "@/components/features/student/schedules/ScheduleContent";
import { SelectedSubjectDialog } from "@/components/features/student/schedules/SelectedSubjectDialog";
import { ScheduleProvider } from "@/components/features/student/schedules/useSchedule";

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
