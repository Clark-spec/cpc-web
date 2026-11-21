import type {
  ClearanceRecord,
  ClearanceRequestRow,
  RequestStatus,
} from "@/types/clearance";
import type {
  AdminUser,
  ChecklistItem,
  ClearanceRequest,
  ClearanceRequestStatus,
} from "@/types/admin";
import {
  deriveRows,
  readPeriod,
  readRecords,
} from "@/services/clearanceAdmin";
import { getClearanceRecordsFromDatabase } from "@/services/clearanceAdmin/database";
import { buildOfficeChecks } from "@/components/features/admin/clearance/officeChecks";
import { programMatches } from "@/lib/programs";

export function studentEmail(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0] ?? "student";
  const last = parts.length > 1 ? parts[parts.length - 1] : first;

  return `${first.toLowerCase().replace(/\s+/g, ".")}.${last
    .toLowerCase()
    .replace(/\s+/g, "")}@cpc.edu.ph`;
}

/** "requested" is the record's word for a queue row staff has not answered. */
export function shellStatus(status: RequestStatus): ClearanceRequestStatus {
  if (status === "requested") return "pending";
  if (status === "signed") return "signed";
  return "rejected";
}

export function toShellRequest(
  row: ClearanceRequestRow,
  record: ClearanceRecord,
): ClearanceRequest {
  return {
    id: row.id,
    studentName: row.studentName,
    studentId: row.studentId,
    program: row.program,
    section: row.section,
    yearLevel: row.yearLevel,
    email: "",
    office: row.office,
    requestedAt: row.requestedAt ?? row.respondedAt ?? "",
    studentNote: row.studentNote,
    status: shellStatus(row.status),
    respondedAt: row.respondedAt,
    signerName: row.signerName,
    signatureImage: row.signatureImage,
    remarks: row.remarks,
    checklist: buildOfficeChecks(row.office, record).map<ChecklistItem>((check) => ({
      label: check.label,
      done: check.result === "ok",
      note: check.detail,
    })),
    live: true,
  };
}

export function readAdminRequests(): ClearanceRequest[] {
  const records = readRecords();
  const byId = new Map(records.map((record) => [record.studentId, record]));

  return deriveRows(records, readPeriod().overdueDays).flatMap<ClearanceRequest>(
    (row) => {
      const record = byId.get(row.studentId);
      return record ? [toShellRequest(row, record)] : [];
    },
  );
}

export function visibleRequests(user: AdminUser): ClearanceRequest[] {
  const all = readAdminRequests();
  if (user.role === "admin") return all;
  const byOffice = all.filter((request) => request.office === user.office);
  const programs = user.homePrograms;
  if (user.role.startsWith("dean_") && programs && programs.length > 0) {
    return byOffice.filter((request) =>
      programs.some((program) => programMatches(request.program, program)),
    );
  }
  return byOffice;
}

/** Role-aware clearance queue, newest request first. */
export async function getClearanceRequests(user: AdminUser): Promise<ClearanceRequest[]> {
  const records = await getClearanceRecordsFromDatabase();
  const byId = new Map(records.map((record) => [record.studentId, record]));
  const all = deriveRows(records, 3).flatMap((row) => {
    const record = byId.get(row.studentId);
    return record ? [toShellRequest(row, record)] : [];
  });
  const scoped = user.role === "admin" ? all : all.filter((request) => request.office === user.office);
  const requests = scoped.sort((a, b) =>
    b.requestedAt.localeCompare(a.requestedAt),
  );
  return requests;
}

