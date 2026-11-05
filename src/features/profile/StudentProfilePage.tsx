import { ToastProvider } from "@/components/ui/toast";
import { NotificationProvider } from "@/context/NotificationContext";
import { ProfileProvider } from "./context/ProfileContext";
import { StudentProfileView } from "./components/StudentProfileView";
import { PROFILE_NOTIFICATIONS_KEY } from "./profile-constants";

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
