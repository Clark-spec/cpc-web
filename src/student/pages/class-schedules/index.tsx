import { PortalFooter } from "@/components/ui/student/PortalFooter";
import { PortalHeader } from "@/components/ui/student/PortalHeader";
import { ToastProvider } from "@/components/ui/toast";
import { PageHero } from "@/components/features/student/schedules/components/PageHero";
import { ScheduleContent } from "@/components/features/student/schedules/components/ScheduleContent";
import { SelectedSubjectDialog } from "@/components/features/student/schedules/components/SelectedSubjectDialog";
import { ScheduleProvider } from "@/components/features/student/schedules/hooks/useSchedule";

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
