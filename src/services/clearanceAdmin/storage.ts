import {
  CLEARANCE_PERIOD_KEY,
  CLEARANCE_RECORDS_KEY,
  CLEARANCE_TIMELINE_KEY,
  studentNotificationsKey,
} from "@/lib/clearanceStorage";
import type {
  AppNotification,
  ClearancePeriod,
  ClearanceRecord,
  OfficeId,
  SavedSignature,
  TimelineEvent,
} from "@/types/clearance";
import type { ActivityItem, AdminNotification } from "@/types/admin";
import type { NewSignatureInput } from "@/components/features/admin/clearance/types";
import {
  ADMIN_ACTIVITY_KEY,
  ADMIN_FEED_KEY,
  DEFAULT_PERIOD,
  MAX_ACTIVITY,
  MAX_FEED,
  MAX_TIMELINE,
  WRITE_DELAY,
  announceClearanceChange,
  newId,
  readJson,
  wait,
  writeJson,
} from "./primitives";

/* ---------------------------------------------------------------- records */

/** Real API: `GET /clearance/records`. Starts clean without mock records. */
export function readRecords(): ClearanceRecord[] {
  const stored = readJson<ClearanceRecord[]>(CLEARANCE_RECORDS_KEY, []);
  const records = Array.isArray(stored)
    ? stored.filter(
        (record) =>
          typeof record?.studentId === "string" && Array.isArray(record.offices),
      )
    : [];

  return records;
}

export function writeRecords(records: ClearanceRecord[]): void {
  writeJson(CLEARANCE_RECORDS_KEY, records);
}

/** Real API: `GET /clearance/records`. */
export async function getRecords(): Promise<ClearanceRecord[]> {
  return wait(readRecords());
}

/* ----------------------------------------------------------------- period */

/** Real API: `GET /clearance/period`. */
export function readPeriod(): ClearancePeriod {
  const stored = readJson<Partial<ClearancePeriod>>(CLEARANCE_PERIOD_KEY, {});
  return {
    ...DEFAULT_PERIOD,
    ...stored,
    overdueDays:
      typeof stored.overdueDays === "number" && stored.overdueDays > 0
        ? stored.overdueDays
        : DEFAULT_PERIOD.overdueDays,
  };
}

/** Real API: `GET /clearance/period`. */
export async function getPeriod(): Promise<ClearancePeriod> {
  return wait(readPeriod());
}

/** Real API: `PUT /clearance/period`. */
export async function setPeriod(
  patch: Partial<ClearancePeriod>,
): Promise<ClearancePeriod> {
  const next = { ...readPeriod(), ...patch };
  writeJson(CLEARANCE_PERIOD_KEY, next);
  announceClearanceChange("period");
  return wait(next, WRITE_DELAY);
}

/* --------------------------------------------------------------- timeline */

export function readTimeline(): TimelineEvent[] {
  const stored = readJson<TimelineEvent[]>(CLEARANCE_TIMELINE_KEY, []);
  return Array.isArray(stored) ? stored : [];
}

export function appendTimeline(events: TimelineEvent[]): void {
  const existing = readTimeline();
  writeJson(
    CLEARANCE_TIMELINE_KEY,
    [...events, ...existing]
      .sort((a, b) => b.at.localeCompare(a.at))
      .slice(0, MAX_TIMELINE),
  );
}

export function removeTimeline(ids: string[]): void {
  const set = new Set(ids);
  writeJson(
    CLEARANCE_TIMELINE_KEY,
    readTimeline().filter((event) => !set.has(event.id)),
  );
}

/** Events for one request, newest first. Real API: `GET /clearance/:id/timeline`. */
export async function getTimeline(requestId: string): Promise<TimelineEvent[]> {
  return wait(readTimeline().filter((event) => event.requestId === requestId));
}

/** Every stored event — the page scopes it to the rows it is showing. */
export function readAllTimeline(): TimelineEvent[] {
  return readTimeline();
}

/** Newest activity across every request. Real API: `GET /clearance/timeline`. */
export async function getAllTimeline(): Promise<TimelineEvent[]> {
  return wait(readTimeline());
}

/* --------------------------------------------------------- single record */

export function readRecordSync(studentId: string): ClearanceRecord | null {
  return readRecords().find((entry) => entry.studentId === studentId) ?? null;
}

/** Real API: `GET /clearance/students/:studentId`. */
export async function getClearanceRecord(
  studentId: string,
): Promise<ClearanceRecord | null> {
  return wait(readRecordSync(studentId));
}

/* ---------------------------------------------------------- notifications */

export function studentEmail(record: ClearanceRecord): string {
  const slug = record.studentName
    .toLowerCase()
    .replace(/[^a-z]+/g, ".")
    .replace(/^\.|\.$/g, "");
  return `${slug}@cpc.edu.ph`;
}

export function queueHref(requestId: string): string {
  return `/admin/clearance-requests?request=${encodeURIComponent(requestId)}`;
}

export function studentActivity(
  record: ClearanceRecord,
  office: OfficeId,
  actor: string,
  status: ActivityItem["status"],
  message: string,
): ActivityItem {
  return {
    id: newId(),
    type: "clearance",
    message,
    actor,
    student: {
      id: record.studentId,
      name: record.studentName,
      program: record.program,
      section: record.section,
      yearLevel: record.yearLevel,
      email: studentEmail(record),
    },
    status,
    createdAt: new Date().toISOString(),
    href: queueHref(`${record.studentId}:${office}`),
  };
}

export function pushStudentNotification(
  studentId: string,
  input: { message: string; type: AppNotification["type"]; officeId?: OfficeId },
): void {
  const key = studentNotificationsKey(studentId);
  const existing = readJson<AppNotification[]>(key, []);
  const list = Array.isArray(existing) ? existing : [];
  const notification: AppNotification = {
    id: newId(),
    message: input.message,
    type: input.type,
    createdAt: new Date().toISOString(),
    read: false,
    officeId: input.officeId,
  };
  writeJson(key, [notification, ...list].slice(0, MAX_FEED));
}

export function pushAdminNotification(
  message: string,
  type: AdminNotification["type"],
  href: string,
): void {
  const existing = readJson<AdminNotification[]>(ADMIN_FEED_KEY, []);
  const list = Array.isArray(existing) ? existing : [];
  const notification: AdminNotification = {
    id: newId(),
    message,
    type,
    createdAt: new Date().toISOString(),
    read: false,
    href,
  };
  writeJson(ADMIN_FEED_KEY, [notification, ...list].slice(0, MAX_FEED));
}

export function pushActivity(item: ActivityItem): void {
  const existing = readJson<ActivityItem[]>(ADMIN_ACTIVITY_KEY, []);
  const list = Array.isArray(existing) ? existing : [];
  writeJson(ADMIN_ACTIVITY_KEY, [item, ...list].slice(0, MAX_ACTIVITY));
}

/* --------------------------------------------------------- saved signatures */

export function savedSignaturesKey(staffId: string): string {
  return `cpc:clearance:signatures:${staffId}`;
}

/** Stored per staff user and never exposed to another account. */
export function readSavedSignatures(staffId: string): SavedSignature[] {
  const stored = readJson<SavedSignature[]>(savedSignaturesKey(staffId), []);
  return Array.isArray(stored)
    ? stored.filter(
        (entry) =>
          typeof entry?.id === "string" && typeof entry.imageBase64 === "string",
      )
    : [];
}

export function writeSavedSignatures(staffId: string, list: SavedSignature[]): void {
  writeJson(savedSignaturesKey(staffId), list);
}

/** Sync write so "save this signature" costs no extra round trip. */
export function storeSignature(
  staffId: string,
  input: NewSignatureInput,
): SavedSignature {
  const list = readSavedSignatures(staffId);
  const signature: SavedSignature = {
    id: newId(),
    staffId,
    imageBase64: input.imageBase64,
    method: input.method,
    label: input.label.trim() || "Signature",
    isDefault: input.isDefault || list.length === 0,
    createdAt: new Date().toISOString(),
  };

  const next = [
    signature,
    ...list.map((entry) =>
      signature.isDefault ? { ...entry, isDefault: false } : entry,
    ),
  ];

  writeSavedSignatures(staffId, next);
  announceClearanceChange("signatures");
  return signature;
}

/** Real API: `POST /staff/:staffId/signatures`. */
export async function addSavedSignature(
  staffId: string,
  input: NewSignatureInput,
): Promise<SavedSignature> {
  return wait(storeSignature(staffId, input), WRITE_DELAY);
}

/** Real API: `PATCH /staff/:staffId/signatures/:id`. */
export async function updateSavedSignature(
  staffId: string,
  id: string,
  patch: Partial<Pick<SavedSignature, "label" | "isDefault">>,
): Promise<SavedSignature[]> {
  const list = readSavedSignatures(staffId).map((entry) => {
    if (entry.id === id) return { ...entry, ...patch };
    return patch.isDefault ? { ...entry, isDefault: false } : entry;
  });

  writeSavedSignatures(staffId, list);
  announceClearanceChange("signatures");
  return wait(list, WRITE_DELAY);
}

/** Real API: `DELETE /staff/:staffId/signatures/:id`. */
export async function deleteSavedSignature(
  staffId: string,
  id: string,
): Promise<SavedSignature[]> {
  const list = readSavedSignatures(staffId).filter((entry) => entry.id !== id);
  if (list.length > 0 && !list.some((entry) => entry.isDefault)) {
    list[0] = { ...list[0], isDefault: true };
  }

  writeSavedSignatures(staffId, list);
  announceClearanceChange("signatures");
  return wait(list, WRITE_DELAY);
}

