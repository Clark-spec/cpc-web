import { useAdminAuth } from "@/components/context/AdminAuthContext";
import { AccessRestrictedCard } from "@/components/common/feedback";
import { AllStudentsWorkspace } from "@/components/features/admin/student-accounts/AllStudentsWorkspace";
import type { AdminRole } from "@/types/admin";

const STUDENT_DIRECTORY_ROLES: AdminRole[] = ["admin", "registrar", "sao"];

export default function AllStudentsAdminPage() {
  const { user } = useAdminAuth();

  if (!user) return null;

  if (!STUDENT_DIRECTORY_ROLES.includes(user.role)) {
    return (
      <AccessRestrictedCard
        moduleTitle="Student Accounts"
        description="The student master directory is accessible to the Administrator, Registrar, and Student Affairs Office (SAO)."
      />
    );
  }

  return <AllStudentsWorkspace />;
}
