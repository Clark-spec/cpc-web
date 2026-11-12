import { ToastProvider } from "@/components/ui/toast";
import { ProfileProvider } from "@/components/features/student/profile/ProfileContext";
import { StudentProfileView } from "@/components/features/student/profile/StudentProfileView";

/** Route: /my-account/profile (student side only). */
export default function StudentProfilePage() {
  return (
    <ToastProvider>
      <ProfileProvider>
        <StudentProfileView />
      </ProfileProvider>
    </ToastProvider>
  );
}
