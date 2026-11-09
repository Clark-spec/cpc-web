import type { LucideIcon } from "lucide-react";
import { Ban, CheckCircle2, CircleSlash, Clock3, Lock, XCircle } from "lucide-react";
import { Badge, type BadgeTone } from "@/components/ui/badge";
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
  icon: Icon,
  label,
  className,
}: {
  tone: BadgeTone;
  icon: LucideIcon;
  label: string;
  className?: string;
}) {
  return (
    <Badge tone={tone} className={cn("gap-1.5", className)}>
      <Icon className="h-3 w-3 shrink-0" aria-hidden />
      {label}
    </Badge>
  );
}

const STUDENT_STATUS: Record<
  StudentStatus,
  { label: string; tone: BadgeTone; icon: LucideIcon }
> = {
  active: { label: "Active", tone: "success", icon: CheckCircle2 },
  inactive: { label: "Inactive", tone: "neutral", icon: CircleSlash },
};

export function StudentStatusBadge({
  status,
  className,
}: {
  status: StudentStatus;
  className?: string;
}) {
  const config = STUDENT_STATUS[status];
  return (
    <StatusPill
      tone={config.tone}
      icon={config.icon}
      label={config.label}
      className={className}
    />
  );
}

const CORRECTION_STATUS: Record<
  CorrectionStatus,
  { tone: BadgeTone; icon: LucideIcon }
> = {
  pending: { tone: "warning", icon: Clock3 },
  approved: { tone: "success", icon: CheckCircle2 },
  rejected: { tone: "danger", icon: XCircle },
};

export function CorrectionStatusBadge({
  status,
  className,
}: {
  status: CorrectionStatus;
  className?: string;
}) {
  const config = CORRECTION_STATUS[status];
  return (
    <StatusPill
      tone={config.tone}
      icon={config.icon}
      label={CORRECTION_STATUS_LABELS[status]}
      className={className}
    />
  );
}

const ACCOUNT_STATUS: Record<AccountStatus, { tone: BadgeTone; icon: LucideIcon }> = {
  active: { tone: "success", icon: CheckCircle2 },
  disabled: { tone: "neutral", icon: Ban },
  locked: { tone: "danger", icon: Lock },
};

export function AccountStatusBadge({
  status,
  className,
}: {
  status: AccountStatus;
  className?: string;
}) {
  const config = ACCOUNT_STATUS[status];
  return (
    <StatusPill
      tone={config.tone}
      icon={config.icon}
      label={ACCOUNT_STATUS_LABELS[status]}
      className={className}
    />
  );
}
