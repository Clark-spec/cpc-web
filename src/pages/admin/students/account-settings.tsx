import { useAdminAuth } from "@/components/context/AdminAuthContext";
import { AccessRestrictedCard } from "@/components/common/feedback";
import { AccountSettingsWorkspace } from "@/components/features/admin/student-accounts/AccountSettingsWorkspace";

export default function AccountSettingsAdminPage() {
  const { user } = useAdminAuth();

  if (!user) return null;

  if (user.role !== "admin" && user.role !== "registrar") {
    return (
      <AccessRestrictedCard
        moduleTitle="Account Settings"
        description="Student account security credentials, credential resets, and access controls are managed by the Administrator and Registrar."
      />
    );
  }

  return <AccountSettingsWorkspace />;
}
