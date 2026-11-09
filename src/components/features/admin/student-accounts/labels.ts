import type { AccountStatus, CorrectionStatus } from "@/components/features/admin/student-accounts/types";

export const CORRECTION_STATUS_LABELS: Record<CorrectionStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

export const ACCOUNT_STATUS_LABELS: Record<AccountStatus, string> = {
  active: "Active",
  disabled: "Disabled",
  locked: "Locked",
};
