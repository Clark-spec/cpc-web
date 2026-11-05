import type { ClearanceRequestRow, RequestStatus } from "@/shared/clearance/types";

/** Requests older than this many days are overdue unless the period overrides it. */
export const DEFAULT_OVERDUE_DAYS = 3;

/** Hours elapsed since `iso`; undated rows are treated as brand new. */
export function ageHours(
  iso: string | undefined,
  now: Date = new Date(),
): number {
  if (!iso) return 0;
  const started = Date.parse(iso);
  if (Number.isNaN(started)) return 0;
  return Math.max(0, (now.getTime() - started) / 3_600_000);
}

/**
 * SLA / overdue logic: only an outstanding ("requested") row can be overdue,
 * and the cutoff is `overdueDays * 24` hours of age measured from the moment
 * the student sent the request.
 */
export function isOverdue(
  row: Pick<ClearanceRequestRow, "status" | "requestedAt">,
  overdueDays: number = DEFAULT_OVERDUE_DAYS,
  now: Date = new Date(),
): boolean {
  if (row.status !== "requested") return false;
  return ageHours(row.requestedAt, now) > overdueDays * 24;
}

/** "3d overdue" / "19h overdue" — always paired with an alert icon. */
export function overdueLabel(hours: number): string {
  const days = Math.floor(hours / 24);
  if (days >= 1) return `${days}d overdue`;
  return `${Math.max(1, Math.round(hours))}h overdue`;
}

/** Compact age for cards and tooltips: "4h", "2d 6h", "12d". */
export function formatAge(hours: number): string {
  if (hours < 1) return "just now";
  if (hours < 24) return `${Math.round(hours)}h`;
  const days = Math.floor(hours / 24);
  const rest = Math.round(hours - days * 24);
  return rest > 0 ? `${days}d ${rest}h` : `${days}d`;
}

/** Mean requested → signed turnaround in days, ignoring undated rows. */
export function averageTurnaroundDays(
  rows: ClearanceRequestRow[],
): number {
  const signed = rows.filter(
    (row): row is ClearanceRequestRow & { requestedAt: string; respondedAt: string } =>
      row.status === "signed" && Boolean(row.requestedAt) && Boolean(row.respondedAt),
  );
  if (signed.length === 0) return 0;

  const total = signed.reduce(
    (sum, row) =>
      sum +
      Math.max(0, Date.parse(row.respondedAt) - Date.parse(row.requestedAt)),
    0,
  );
  return total / signed.length / 86_400_000;
}

/** "1.8 days" / "14 hours" — the KPI strip shows text, never a bare number. */
export function formatTurnaround(days: number): string {
  if (days <= 0) return "no data";
  if (days < 1) return `${Math.max(1, Math.round(days * 24))} hours`;
  return `${days.toFixed(1)} ${days < 2 ? "day" : "days"}`;
}

/** Whole days left in the clearance window; negative once it has closed. */
export function daysRemaining(closesAt: string, now: Date = new Date()): number {
  const end = Date.parse(closesAt);
  if (Number.isNaN(end)) return 0;
  return Math.ceil((end - now.getTime()) / 86_400_000);
}

/** True when a row still needs this office's decision. */
export function isActionable(status: RequestStatus): boolean {
  return status === "requested";
}
