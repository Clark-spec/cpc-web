import { useSchedule } from "@/components/features/student/schedules/useSchedule";
import { SubjectDetailsModal } from "@/components/features/student/schedules/SubjectDetailsModal";

/** Details dialog for whichever entry the table or calendar last opened. */
export function SelectedSubjectDialog() {
  const { selectedEntry, closeEntry } = useSchedule();

  return <SubjectDetailsModal entry={selectedEntry} onClose={closeEntry} />;
}
