import { ToastProvider } from "@/components/ui/toast";
import { NotificationProvider } from "@/context/NotificationContext";
import { ProfileProvider } from "@/student/features/profile/context/ProfileContext";
import { StudentProfileView } from "@/student/features/profile/components/StudentProfileView";
import { PROFILE_NOTIFICATIONS_KEY } from "@/student/features/profile/profile-constants";

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
