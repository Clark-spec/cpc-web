import { useAdminAuth } from "@/components/context/AdminAuthContext";
import { AccessRestrictedCard } from "@/components/common/feedback";
import AcademicCalendarPage from "@/components/features/admin/academic-calendar/components/AcademicCalendarPage";
import { DEAN_ROLES } from "@/lib/navigation";
import type { AdminRole } from "@/types/admin";

const CALENDAR_ROLES: AdminRole[] = ["admin", "registrar", ...DEAN_ROLES];

/** Route page for /admin/academics/academic-calendar; guarded so only authorized academic staff have access. */
export default function AcademicCalendarAdminPage() {
  const { user } = useAdminAuth();

  if (!user) return null;

  if (!CALENDAR_ROLES.includes(user.role)) {
    return (
      <AccessRestrictedCard
        moduleTitle="Academic Calendar"
        description="The institutional academic calendar is maintained by the Administrator, Registrar, and Academic Deans. Your office account is not permitted to access this module."
      />
    );
  }

  return <AcademicCalendarPage />;
}
