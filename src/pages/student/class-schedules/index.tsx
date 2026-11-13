import { PortalFooter } from "@/components/common/layout/PortalFooter";
import { PortalHeader } from "@/components/common/layout/PortalHeader";
import { PageHero } from "@/components/features/student/schedules/PageHero";
import { ScheduleContent } from "@/components/features/student/schedules/ScheduleContent";
import { SelectedSubjectDialog } from "@/components/features/student/schedules/SelectedSubjectDialog";
import { ScheduleProvider } from "@/components/features/student/schedules/useSchedule";

/** Route: /academics/class-schedules */
export default function ClassSchedulesPage() {
  return (
    <ScheduleProvider>
      <div className="min-h-screen w-full overflow-x-clip bg-white font-poppins">
        <PortalHeader />
        <PageHero />
        <ScheduleContent />
        <PortalFooter />
        <SelectedSubjectDialog />
      </div>
    </ScheduleProvider>
  );
}
