import { useSchedule } from "../hooks/useSchedule";
import { SubjectDetailsModal } from "./SubjectDetailsModal";

/** Details dialog for whichever entry the table or calendar last opened. */
export function SelectedSubjectDialog() {
  const { selectedEntry, closeEntry } = useSchedule();

  return <SubjectDetailsModal entry={selectedEntry} onClose={closeEntry} />;
}
