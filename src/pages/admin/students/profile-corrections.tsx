import { useAdminAuth } from "@/components/context/AdminAuthContext";
import { AccessRestrictedCard } from "@/components/common/feedback";
import { ProfileCorrectionsWorkspace } from "@/components/features/admin/student-accounts/ProfileCorrectionsWorkspace";

export default function ProfileCorrectionsAdminPage() {
  const { user } = useAdminAuth();

  if (!user) return null;

  if (user.role !== "admin" && user.role !== "registrar") {
    return (
      <AccessRestrictedCard
        moduleTitle="Profile Correction Requests"
        description="Review and approval of official student profile changes is strictly reserved for the Registrar's Office and Administrator."
      />
    );
  }

  return <ProfileCorrectionsWorkspace />;
}
