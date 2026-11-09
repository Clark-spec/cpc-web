import { ToastProvider } from "@/components/ui/toast";
import { NotificationProvider } from "@/components/context/NotificationContext";
import { ProfileProvider } from "@/components/features/student/profile/ProfileContext";
import { StudentProfileView } from "@/components/features/student/profile/StudentProfileView";
import { PROFILE_NOTIFICATIONS_KEY } from "@/components/features/student/profile/profile-constants";

/** Route: /my-account/profile (student side only). */
export default function StudentProfilePage() {
  return (
    <ToastProvider>
      <NotificationProvider storageKey={PROFILE_NOTIFICATIONS_KEY}>
        <ProfileProvider>
          <StudentProfileView />
        </ProfileProvider>
      </NotificationProvider>
    </ToastProvider>
  );
}
