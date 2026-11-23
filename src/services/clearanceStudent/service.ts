import { canonicalProgram } from "@/lib/programs";
import type { ClearancePeriod, ClearanceState, OfficeId, StudentProfile } from "@/types/clearance";
import { loadMyClearanceRecord, requestMyClearanceOffices, updateMyClearance } from "./database";
import { defaultSaoEvents } from "@/services/clearanceStudent/mock";

const DEFAULT_PERIOD: ClearancePeriod = {
  academicYear: "2025-2026", term: "2nd Semester", opensAt: "", closesAt: "", open: true, overdueDays: 3,
};

export function getActiveStudent() {
  try {
    const raw = typeof window !== "undefined" ? window.sessionStorage.getItem("cpc_user") : null;
    if (raw) {
      const u = JSON.parse(raw);
      if (u.role === "student") {
        const year = Number(u.yearLevel ?? 0);
        return {
          studentId: u.studentNumber || u.id || "",
          studentName: u.name || "Student",
          program: canonicalProgram(u.course || ""),
          yearLevel: year ? `${year} Year` : "",
          section: u.section || "",
        };
      }
    }
  } catch { /* invalid session */ }
  return { studentId: "", studentName: "Student", program: "", yearLevel: "", section: "" };
}

function toClearanceState(record: Awaited<ReturnType<typeof loadMyClearanceRecord>>): ClearanceState {
  const fullySigned = record.offices.length === 5 && record.offices.every((office) => office.status === "signed");
  const completedAt = fullySigned
    ? record.completedAt ?? record.offices.map((office) => office.respondedAt).filter((value): value is string => Boolean(value)).sort().at(-1) ?? null
    : null;
  const history: ClearanceState["history"] = Array.isArray(record.history) && record.history.length
    ? record.history
    : fullySigned && completedAt
    ? [{
        academicYear: record.academicYear,
        semester: record.term,
        status: "Cleared",
        dateCleared: completedAt,
        signatures: record.offices,
        section: record.section,
        program: record.program,
        yearLevel: record.yearLevel,
      }]
    : [];
  return {
    offices: record.offices,
    saoEvents: record.saoEvents?.length
      ? record.saoEvents
      : defaultSaoEvents.map((event) => ({ ...event })),
    history,
    dateCleared: completedAt,
    referenceNumber: record.referenceNumber,
    periodOpen: true,
    studentSnapshot: {
      name: record.studentName,
      studentId: record.studentId,
      section: record.section,
      yearLevel: record.yearLevel,
      course: record.program,
      program: canonicalProgram(record.program),
      academicYear: record.academicYear,
      semester: record.term,
      term: record.term.toLowerCase().includes("1st") ? "1st" : "2nd",
    },
  };
}

export async function getClearance(): Promise<ClearanceState> {
  const record = await loadMyClearanceRecord();
  return toClearanceState(record);
}

export async function getClearancePeriod(): Promise<ClearancePeriod> {
  await loadMyClearanceRecord();
  return DEFAULT_PERIOD;
}

export async function requestSignature(officeId: OfficeId, note?: string): Promise<ClearanceState> {
  const record = await updateMyClearance("request", officeId, note?.trim());
  return toClearanceState(record);
}

export async function requestSignatures(officeIds: OfficeId[]): Promise<ClearanceState> {
  const record = await requestMyClearanceOffices(officeIds);
  return toClearanceState(record);
}

export async function cancelRequest(officeId: OfficeId): Promise<ClearanceState> {
  const record = await updateMyClearance("cancel", officeId);
  return toClearanceState(record);
}

export type { StudentProfile };
