import { RequestDetailsModal } from "@/components/features/student/service-requests/RequestDetailsModal";
import type { RequestId } from "@/services/serviceRequests/types";

type ServiceRequestDialogProps = {
  requestId: RequestId | null;
  onClose: () => void;
};

/** Details dialog for the request last opened from the history table. */
export function ServiceRequestDialog({ requestId, onClose }: ServiceRequestDialogProps) {
  if (requestId === null) return null;

  return <RequestDetailsModal requestId={requestId} onClose={onClose} />;
}
