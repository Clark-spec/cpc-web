import { useAdminAuth } from "@/components/context/AdminAuthContext";
import { AccessRestrictedCard } from "@/components/common/feedback";
import ScheduleAdminPage from "@/components/features/admin/schedules/ScheduleAdminPage";
import { DEAN_ROLES } from "@/lib/navigation";
import type { AdminRole } from "@/types/admin";

const SCHEDULE_ROLES: AdminRole[] = ["admin", "registrar", ...DEAN_ROLES, "instructor"];

/** Route page for /admin/academics/class-schedules; guarded so only authorized academic staff have access. */
export default function ClassSchedulesAdminPage() {
  const { user } = useAdminAuth();

  if (!user) return null;

  if (!SCHEDULE_ROLES.includes(user.role)) {
    return (
      <AccessRestrictedCard
        moduleTitle="Class Schedules"
        description="Class schedules are managed by the Administrator, Registrar, Academic Deans, and Instructors. Your office account is not permitted to access timetable records."
      />
    );
  }

  return <ScheduleAdminPage />;
}

