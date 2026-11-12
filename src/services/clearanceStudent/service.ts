import {
  createInitialOffices,
  mockEvents,
  mockHistory,
  mockStudent,
  mockSubjects,
  officeSignerNames,
} from "./mock";
import {
  CLEARANCE_CHANNEL_NAME,
  CLEARANCE_NOTIFICATIONS_KEY,
  CLEARANCE_PERIOD_KEY,
  CLEARANCE_RECORDS_KEY,
  CLEARANCE_TIMELINE_KEY,
} from "@/lib/clearanceStorage";
import { createDemoSignature } from "@/lib/demoSignature";
import {
  pushAdminNotification,
  pushActivity,
  studentActivity,
} from "@/services/clearanceAdmin/storage";
import { OFFICE_LABELS } from "@/components/features/admin/clearance/officeChecks";
import type {
  ClearancePeriod,
  ClearanceRecord,
  ClearanceState,
  OfficeId,
  OfficeSignature,
  TimelineEvent,
} from "@/types/clearance";

/** The single signed-in demo student. A real session supplies this id. */
export const STUDENT_ID = mockStudent.studentId;

const READ_DELAY = 50;
const WRITE_DELAY = 50;
const MAX_TIMELINE = 240;

const DEFAULT_PERIOD: ClearancePeriod = {
  academicYear: "2026-2027",
  term: "1st Semester",
  opensAt: "2026-08-03T00:00:00.000Z",
  closesAt: "2026-12-15T23:59:59.000Z",
  open: true,
  overdueDays: 3,
};

function wait<T>(value: T, ms: number): Promise<T> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(value), ms);
  });
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota or private-mode failure: the in-memory state still renders.
  }
}

/** Broadcasts so a second portal open in this same tab group re-reads. */
function announce(reason: string): void {
  try {
    if (typeof BroadcastChannel === "undefined") return;
    const channel = new BroadcastChannel(CLEARANCE_CHANNEL_NAME);
    channel.postMessage({ reason });
    channel.close();
  } catch {
    // Storage events already cover cross-tab sync.
  }
}

function newId(): string {
  return typeof crypto !== "undefined" ? crypto.randomUUID() : `id-${Date.now()}`;
}

/**
 * Returns the currently signed-in student from the session, falling back to
 * default mock identity if unauthenticated.
 */
export function getActiveStudent(): {
  studentId: string;
  studentName: string;
  program: string;
  yearLevel: string;
} {
  try {
    const raw = typeof window !== "undefined" ? window.sessionStorage.getItem("cpc_user") : null;
    if (raw) {
      const u = JSON.parse(raw);
      return {
        studentId: u.studentNumber || u.id || mockStudent.studentId,
        studentName: u.name || mockStudent.name,
        program: u.course || mockStudent.program,
        yearLevel: u.yearLevel ? `${u.yearLevel}rd Year` : mockStudent.yearLevel,
      };
    }
  } catch {}
  return {
    studentId: mockStudent.studentId,
    studentName: mockStudent.name,
    program: mockStudent.program,
    yearLevel: mockStudent.yearLevel,
  };
}

/**
 * Clean initial student record: all offices start in "not_requested" state
 * so students can submit and cancel requests freshly.
 */
function createInitialStudentRecord(student = getActiveStudent()): ClearanceRecord {
  return {
    studentId: student.studentId,
    studentName: student.studentName,
    section: "BSIT 3-A",
    program: student.program,
    yearLevel: student.yearLevel,
    term: "1st Semester",
    academicYear: mockStudent.academicYear,
    offices: createInitialOffices(),
    subjects: mockSubjects,
    saoEvents: mockEvents,
  };
}

function normalizeRecord(
  parsed: Partial<ClearanceRecord>,
  student = getActiveStudent(),
): ClearanceRecord {
  const fallback = createInitialStudentRecord(student);
  const stored = Array.isArray(parsed.offices) ? parsed.offices : [];

  const offices = createInitialOffices().map((office) => {
    const match = stored.find((entry) => entry?.office === office.office);
    return match ? { ...office, ...match, label: office.label } : office;
  });

  return {
    studentId: typeof parsed.studentId === "string" ? parsed.studentId : fallback.studentId,
    studentName: parsed.studentName ?? fallback.studentName,
    section: parsed.section ?? fallback.section,
    program: parsed.program ?? fallback.program,
    yearLevel: parsed.yearLevel ?? fallback.yearLevel,
    term: parsed.term ?? fallback.term,
    academicYear: parsed.academicYear ?? fallback.academicYear,
    offices,
    subjects: Array.isArray(parsed.subjects) ? parsed.subjects : mockSubjects,
    saoEvents: Array.isArray(parsed.saoEvents) ? parsed.saoEvents : mockEvents,
    referenceNumber: parsed.referenceNumber,
    completedAt: parsed.completedAt,
  };
}

function readRecords(): ClearanceRecord[] {
  const stored = readJson<ClearanceRecord[]>(CLEARANCE_RECORDS_KEY, []);
  return Array.isArray(stored)
    ? stored.filter(
        (record) =>
          typeof record?.studentId === "string" && Array.isArray(record.offices),
      )
    : [];
}

function readStudentRecord(): ClearanceRecord {
  const student = getActiveStudent();
  const records = readRecords();
  const found = records.find(
    (record) =>
      record.studentId === student.studentId ||
      record.studentId === mockStudent.studentId ||
      record.studentName.toLowerCase() === student.studentName.toLowerCase(),
  );
  if (found) {
    const normalized = normalizeRecord(found, student);
    normalized.studentId = student.studentId;
    normalized.studentName = student.studentName;
    return normalized;
  }

  const created = createInitialStudentRecord(student);
  writeJson(CLEARANCE_RECORDS_KEY, [...records, created]);
  return created;
}

function writeStudentRecord(record: ClearanceRecord, reason: string): void {
  const records = readRecords();
  const exists = records.some(
    (entry) =>
      entry.studentId === record.studentId ||
      entry.studentName.toLowerCase() === record.studentName.toLowerCase(),
  );
  const next = exists
    ? records.map((entry) =>
        entry.studentId === record.studentId ||
        entry.studentName.toLowerCase() === record.studentName.toLowerCase()
          ? record
          : entry,
      )
    : [...records, record];

  writeJson(CLEARANCE_RECORDS_KEY, next);
  announce(reason);
}

function readPeriod(): ClearancePeriod {
  return { ...DEFAULT_PERIOD, ...readJson<Partial<ClearancePeriod>>(CLEARANCE_PERIOD_KEY, {}) };
}

function readTimeline(): TimelineEvent[] {
  const stored = readJson<TimelineEvent[]>(CLEARANCE_TIMELINE_KEY, []);
  return Array.isArray(stored) ? stored : [];
}

function appendTimeline(events: TimelineEvent[]): void {
  const next = [...events, ...readTimeline()]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, MAX_TIMELINE);
  writeJson(CLEARANCE_TIMELINE_KEY, next);
}

function event(
  officeId: OfficeId,
  type: TimelineEvent["type"],
  actor: string,
  detail?: string,
  at = new Date().toISOString(),
): TimelineEvent {
  const student = getActiveStudent();
  return { id: newId(), requestId: `${student.studentId}:${officeId}`, at, actor, type, detail };
}

const isFullySigned = (offices: OfficeSignature[]): boolean =>
  offices.length > 0 && offices.every((office) => office.status === "signed");

function nextReferenceNumber(records: ClearanceRecord[]): string {
  const highest = records.reduce((max, record) => {
    const digits = Number.parseInt((record.referenceNumber ?? "").split("-").pop() ?? "", 10);
    return Number.isNaN(digits) ? max : Math.max(max, digits);
  }, 122);
  return `CPC-${mockStudent.academicYear.slice(0, 4)}-${String(highest + 1).padStart(6, "0")}`;
}

function toState(record: ClearanceRecord, period: ClearancePeriod): ClearanceState {
  return {
    offices: record.offices,
    history: mockHistory,
    dateCleared: record.completedAt ?? null,
    referenceNumber: record.referenceNumber,
    periodOpen: period.open,
  };
}

function patchOffice(
  record: ClearanceRecord,
  officeId: OfficeId,
  patch: Partial<OfficeSignature>,
): ClearanceRecord {
  const offices = record.offices.map((office) =>
    office.office === officeId ? { ...office, ...patch } : office,
  );

  const complete = isFullySigned(offices);
  return {
    ...record,
    offices,
    referenceNumber: complete
      ? (record.referenceNumber ?? nextReferenceNumber(readRecords()))
      : undefined,
    completedAt: complete ? (record.completedAt ?? new Date().toISOString()) : undefined,
  };
}

export async function getClearance(): Promise<ClearanceState> {
  return wait(toState(readStudentRecord(), readPeriod()), READ_DELAY);
}

export async function getClearancePeriod(): Promise<ClearancePeriod> {
  return wait(readPeriod(), READ_DELAY);
}

export async function requestSignature(
  officeId: OfficeId,
  studentNote?: string,
): Promise<ClearanceState> {
  const period = readPeriod();
  const record = readStudentRecord();
  const current = record.offices.find((office) => office.office === officeId);

  if (!current || !period.open || current.status === "requested" || current.status === "signed") {
    return wait(toState(record, period), WRITE_DELAY);
  }

  const at = new Date().toISOString();
  const note = studentNote?.trim() || undefined;
  const next = patchOffice(record, officeId, {
    status: "requested",
    requestedAt: at,
    respondedAt: undefined,
    signerName: undefined,
    signatureImage: undefined,
    studentNote: note,
    remarks: undefined,
  });

  appendTimeline([
    event(officeId, current.status === "rejected" ? "reopened" : "requested", record.studentName, note, at),
  ]);
  writeStudentRecord(next, "student-request");

  const officeLabel = OFFICE_LABELS[officeId] ?? officeId;
  pushAdminNotification(
    `${record.studentName} (${record.section}) requested clearance from ${officeLabel}.`,
    "info",
    `/admin/clearance-requests?office=${officeId}&student=${record.studentId}`,
  );
  pushActivity(
    studentActivity(
      record,
      officeId,
      record.studentName,
      "pending",
      `${record.studentName} requested clearance from ${officeLabel}`,
    ),
  );

  return wait(toState(next, period), WRITE_DELAY);
}

export async function requestSignatures(officeIds: OfficeId[]): Promise<ClearanceState> {
  const period = readPeriod();
  let record = readStudentRecord();
  const at = new Date().toISOString();
  const events: TimelineEvent[] = [];

  for (const officeId of officeIds) {
    const current = record.offices.find((office) => office.office === officeId);
    if (!current || !period.open) continue;
    if (current.status === "requested" || current.status === "signed") continue;

    events.push(
      event(
        officeId,
        current.status === "rejected" ? "reopened" : "requested",
        record.studentName,
        current.studentNote,
        at,
      ),
    );
    record = patchOffice(record, officeId, {
      status: "requested",
      requestedAt: at,
      respondedAt: undefined,
      signerName: undefined,
      signatureImage: undefined,
      remarks: undefined,
    });
  }

  if (events.length > 0) {
    appendTimeline(events);
    writeStudentRecord(record, "student-request");

    pushAdminNotification(
      `${record.studentName} requested clearance from ${events.length} offices.`,
      "info",
      `/admin/clearance-requests`,
    );
  }

  return wait(toState(record, period), WRITE_DELAY);
}

export async function cancelRequest(officeId: OfficeId): Promise<ClearanceState> {
  const period = readPeriod();
  const record = readStudentRecord();
  const current = record.offices.find((office) => office.office === officeId);

  if (!current || current.status !== "requested") {
    return wait(toState(record, period), WRITE_DELAY);
  }

  const next = patchOffice(record, officeId, {
    status: "not_requested",
    requestedAt: undefined,
    respondedAt: undefined,
    signerName: undefined,
    signatureImage: undefined,
    studentNote: undefined,
    remarks: undefined,
  });

  appendTimeline([event(officeId, "cancelled", record.studentName)]);
  writeStudentRecord(next, "student-cancel");

  const officeLabel = OFFICE_LABELS[officeId] ?? officeId;
  pushAdminNotification(
    `${record.studentName} cancelled clearance request for ${officeLabel}.`,
    "warning",
    `/admin/clearance-requests?office=${officeId}`,
  );

  return wait(toState(next, period), WRITE_DELAY);
}

export async function demoApprove(officeId: OfficeId): Promise<ClearanceState> {
  const period = readPeriod();
  const record = readStudentRecord();
  const current = record.offices.find((office) => office.office === officeId);

  if (!current || current.status !== "requested") {
    return wait(toState(record, period), WRITE_DELAY);
  }

  const signerName = officeSignerNames[officeId];
  const signatureImage = await createDemoSignature(signerName);
  const at = new Date().toISOString();
  const next = patchOffice(record, officeId, {
    status: "signed",
    signerName,
    signatureImage,
    respondedAt: at,
    remarks: undefined,
  });

  appendTimeline([event(officeId, "signed", signerName, undefined, at)]);
  writeStudentRecord(next, "decision");

  return wait(toState(next, period), WRITE_DELAY);
}

export async function demoReject(
  officeId: OfficeId,
  remarks: string,
): Promise<ClearanceState> {
  const period = readPeriod();
  const record = readStudentRecord();
  const current = record.offices.find((office) => office.office === officeId);

  if (!current || current.status !== "requested") {
    return wait(toState(record, period), WRITE_DELAY);
  }

  const at = new Date().toISOString();
  const note =
    remarks.trim() || "Please complete the missing requirement and request again.";
  const next = patchOffice(record, officeId, {
    status: "rejected",
    remarks: note,
    signerName: officeSignerNames[officeId],
    signatureImage: undefined,
    respondedAt: at,
  });

  appendTimeline([event(officeId, "rejected", officeSignerNames[officeId], note, at)]);
  writeStudentRecord(next, "decision");

  return wait(toState(next, period), WRITE_DELAY);
}

export async function resetClearance(): Promise<ClearanceState> {
  const record = createInitialStudentRecord();
  writeStudentRecord(record, "reset");
  writeJson(CLEARANCE_NOTIFICATIONS_KEY, []);
  return wait(toState(record, readPeriod()), WRITE_DELAY);
}

