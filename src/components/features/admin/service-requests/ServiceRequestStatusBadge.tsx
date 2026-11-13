import { Badge, type BadgeSize, type BadgeTone } from "@/components/ui/badge";
import {
  SERVICE_STATUS_LABELS,
  type AdminServiceRequestStatus,
} from "@/services/serviceRequests/admin";

const STATUS_STYLES: Record<
  AdminServiceRequestStatus,
  { tone: BadgeTone; pulse?: boolean }
> = {
  submitted: { tone: "success" },
  under_review: { tone: "info", pulse: true },
  processing: { tone: "info", pulse: true },
  ready_for_release: { tone: "info" },
  released: { tone: "success" },
  rejected: { tone: "danger" },
};

export function ServiceRequestStatusBadge({
  status,
  size,
  className,
}: {
  status: AdminServiceRequestStatus;
  size?: BadgeSize;
  className?: string;
}) {
  const config = STATUS_STYLES[status];

  return (
    <Badge tone={config.tone} size={size} pulse={config.pulse} className={className}>
      {SERVICE_STATUS_LABELS[status]}
    </Badge>
  );
}
