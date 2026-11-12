import type {
  ClearanceRecord,
  ClearanceRequestRow,
  OfficeId,
} from "@/types/clearance";
import type { OfficeLoad } from "@/components/features/admin/clearance/types";
import { OFFICE_LABELS, OFFICE_ORDER } from "@/components/features/admin/clearance/officeChecks";
import { ageHours, isOverdue } from "@/components/features/admin/clearance/sla";
import { wait } from "./primitives";
import { readPeriod, readRecords } from "./storage";

/**
 * Queue derivation: one row per student + office, skipping offices the student
 * has not asked about yet.
 */
export function deriveRows(
  records: ClearanceRecord[],
  overdueDays: number,
  now: Date = new Date(),
): ClearanceRequestRow[] {
  const rows: ClearanceRequestRow[] = [];

  for (const record of records) {
    for (const office of record.offices) {
      if (office.status === "not_requested") continue;
      const anchor =
        office.status === "requested"
          ? office.requestedAt
          : (office.respondedAt ?? office.requestedAt);

      rows.push({
        id: `${record.studentId}:${office.office}`,
        studentId: record.studentId,
        studentName: record.studentName,
        section: record.section,
        program: record.program,
        yearLevel: record.yearLevel,
        term: record.term,
        academicYear: record.academicYear,
        office: office.office,
        status: office.status,
        requestedAt: office.requestedAt,
        respondedAt: office.respondedAt,
        studentNote: office.studentNote,
        remarks: office.remarks,
        signerName: office.signerName,
        signatureImage: office.signatureImage,
        isOverdue: isOverdue(office, overdueDays, now),
        ageHours: ageHours(anchor, now),
      });
    }
  }

  return rows;
}

/** Office staff only ever see their own office; the admin sees everything.
 * Program-aware deans only see students from their respective department programs.
 */
export function scopeRows(
  rows: ClearanceRequestRow[],
  office: OfficeId | null,
  homePrograms?: string[] | null,
): ClearanceRequestRow[] {
  if (!office) return rows;
  let filtered = rows.filter((row) => row.office === office);
  if (office === "dean" && homePrograms && homePrograms.length > 0) {
    filtered = filtered.filter((row) =>
      homePrograms.some((prog) => {
        const pLower = prog.toLowerCase();
        const rLower = (row.program ?? "").toLowerCase();
        return rLower.includes(pLower) || pLower.includes(rLower);
      }),
    );
  }
  return filtered;
}

/** Real API: `GET /clearance/requests`; filtering is server-side in a real build. */
export async function getClearanceRows(
  office: OfficeId | null = null,
): Promise<ClearanceRequestRow[]> {
  const period = readPeriod();
  return wait(scopeRows(deriveRows(readRecords(), period.overdueDays), office));
}

/** Pure, so the chart and the queue can never disagree. */
export function computeOfficeLoad(rows: ClearanceRequestRow[]): OfficeLoad[] {
  return OFFICE_ORDER.map((office) => ({
    office,
    label: OFFICE_LABELS[office],
    pending: rows.filter((row) => row.office === office && row.status === "requested").length,
    signed: rows.filter((row) => row.office === office && row.status === "signed").length,
  }));
}

/** Real API: `GET /clearance/workload`. */
export async function getOfficeLoad(): Promise<OfficeLoad[]> {
  return wait(computeOfficeLoad(deriveRows(readRecords(), readPeriod().overdueDays)));
}

export function isSameDay(iso: string | undefined, now: Date): boolean {
  if (!iso) return false;
  const stamp = new Date(iso);
  return (
    stamp.getFullYear() === now.getFullYear() &&
    stamp.getMonth() === now.getMonth() &&
    stamp.getDate() === now.getDate()
  );
}

export type ClearanceKpiSet = {
  awaitingMine: number;
  signedToday: number;
  rejected: number;
  overdue: number;
  avgTurnaroundDays: number;
};

/** Pure, so the KPI strip, the dashboard and the sidebar always agree. */
export function computeKpis(
  rows: ClearanceRequestRow[],
  now: Date = new Date(),
): ClearanceKpiSet {
  const signed = rows.filter((row) => row.requestedAt && row.respondedAt);
  const turnaround =
    signed.length === 0
      ? 0
      : signed.reduce(
          (sum, row) =>
            sum +
            Math.max(
              0,
              Date.parse(row.respondedAt ?? "") - Date.parse(row.requestedAt ?? ""),
            ),
          0,
        ) /
        signed.length /
        86_400_000;

  return {
    awaitingMine: rows.filter((row) => row.status === "requested").length,
    signedToday: rows.filter(
      (row) => row.status === "signed" && isSameDay(row.respondedAt, now),
    ).length,
    rejected: rows.filter((row) => row.status === "rejected").length,
    overdue: rows.filter((row) => row.isOverdue).length,
    avgTurnaroundDays: turnaround,
  };
}

