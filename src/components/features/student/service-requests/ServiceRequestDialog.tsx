import { RequestDetailsModal } from "./RequestDetailsModal";

type ServiceRequestDialogProps = {
  requestId: number | null;
  onClose: () => void;
};

/** Details dialog for the request last opened from the history table. */
export function ServiceRequestDialog({ requestId, onClose }: ServiceRequestDialogProps) {
  if (requestId === null) return null;

  return <RequestDetailsModal requestId={requestId} onClose={onClose} />;
}
