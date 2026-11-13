import { Badge, type BadgeSize, type BadgeTone } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import {
  ACCOUNT_STATUS_LABELS,
  CORRECTION_STATUS_LABELS,
} from "@/components/features/admin/student-accounts/labels";
import type {
  AccountStatus,
  CorrectionStatus,
  StudentStatus,
} from "@/components/features/admin/student-accounts/types";

function StatusPill({
  tone,
  label,
  pulse,
  size,
  className,
}: {
  tone: BadgeTone;
  label: string;
  pulse?: boolean;
  size?: BadgeSize;
  className?: string;
}) {
  return (
    <Badge tone={tone} pulse={pulse} size={size} className={cn("gap-1.5", className)}>
      {label}
    </Badge>
  );
}

const STUDENT_STATUS: Record<
  StudentStatus,
  { label: string; tone: BadgeTone }
> = {
  active: { label: "Active", tone: "success" },
  inactive: { label: "Inactive", tone: "neutral" },
};

export function StudentStatusBadge({
  status,
  size,
  className,
}: {
  status: StudentStatus;
  size?: BadgeSize;
  className?: string;
}) {
  const config = STUDENT_STATUS[status];
  return (
    <StatusPill
      tone={config.tone}
      label={config.label}
      size={size}
      className={className}
    />
  );
}

const CORRECTION_STATUS: Record<
  CorrectionStatus,
  { tone: BadgeTone; pulse?: boolean }
> = {
  pending: { tone: "warning", pulse: true },
  approved: { tone: "success" },
  rejected: { tone: "danger" },
};

export function CorrectionStatusBadge({
  status,
  size,
  className,
}: {
  status: CorrectionStatus;
  size?: BadgeSize;
  className?: string;
}) {
  const config = CORRECTION_STATUS[status];
  return (
    <StatusPill
      tone={config.tone}
      pulse={config.pulse}
      label={CORRECTION_STATUS_LABELS[status]}
      size={size}
      className={className}
    />
  );
}

const ACCOUNT_STATUS: Record<AccountStatus, { tone: BadgeTone }> = {
  active: { tone: "success" },
  disabled: { tone: "danger" },
  locked: { tone: "danger" },
};

export function AccountStatusBadge({
  status,
  size,
  className,
}: {
  status: AccountStatus;
  size?: BadgeSize;
  className?: string;
}) {
  const config = ACCOUNT_STATUS[status];
  return (
    <StatusPill
      tone={config.tone}
      label={ACCOUNT_STATUS_LABELS[status]}
      size={size}
      className={className}
    />
  );
}
