import { RequestDetailsModal } from "@/components/features/student/service-requests/RequestDetailsModal";
import type { RequestId, ServiceRequestUpdate } from "@/services/serviceRequests/types";

type ServiceRequestDialogProps = {
  requestId: RequestId | null;
  onClose: () => void;
  liveUpdate?: ServiceRequestUpdate | null;
};

/** Details dialog for the request last opened from the history table. */
export function ServiceRequestDialog({
  requestId,
  onClose,
  liveUpdate,
}: ServiceRequestDialogProps) {
  if (requestId === null) return null;

  return (
    <RequestDetailsModal requestId={requestId} onClose={onClose} liveUpdate={liveUpdate} />
  );
}
