import { ProfileProvider } from "@/components/features/student/profile/ProfileContext";
import { StudentProfileView } from "@/components/features/student/profile/StudentProfileView";

/** Route: /my-account/profile (student side only). */
export default function StudentProfilePage() {
  return (
    <ProfileProvider>
      <StudentProfileView />
    </ProfileProvider>
  );
}
