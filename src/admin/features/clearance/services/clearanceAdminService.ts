import {
  createInitialOffices,
  mockEvents,
  mockSubjects,
  officeSignerNames,
} from "@/shared/clearance/data/mockClearance";
import type {
  AppNotification,
  ClearancePeriod,
  ClearanceRecord,
  ClearanceRequestRow,
  OfficeId,
  OfficeSignature,
  SavedSignature,
  TimelineEvent,
} from "@/shared/clearance/types";
import type { ActivityItem, AdminNotification } from "@/admin/types";
import type { ApproveInput, NewSignatureInput, OfficeLoad } from "../types";
import { OFFICE_LABELS, OFFICE_ORDER } from "../utils/officeChecks";
import { ageHours, isOverdue } from "../utils/sla";

/**
 * Staff-side data layer for Online Clearance.
 *
 * (1) SHARED-STORAGE CONTRACT. Both portals read and write the same records,
 * so neither has to poll:
 *     cpc:clearance:records            ClearanceRecord[]  (one per studentId)
 *     cpc:clearance:timeline           TimelineEvent[]    (audit trail)
 *     cpc:clearance:period             ClearancePeriod    (window + SLA)
 *     cpc:notifications:{studentId}    AppNotification[]  (student bell)
 *     cpc:clearance:signatures:{staff} SavedSignature[]   (never shared)
 *   cpc.admin.notifications.v1 / cpc.admin.activity.v1 are written here too, so
 *   the admin bell, sidebar badge and dashboard all read one source of truth.
 *
 * (2) APPROVE FLOW. staff decision -> signature (draw / type / upload / saved)
 *   -> base64 PNG written onto the office entry of the record -> localStorage +
 *   BroadcastChannel("cpc-clearance") -> the student tab's storage listener
 *   re-reads the record and renders signatureImage, signerName and the dates.
 *
 * (3) QUEUE DERIVATION. The queue is never stored. Every office entry whose
 *   status is not "not_requested" becomes exactly one row keyed by
 *   `${studentId}:${office}`, so a re-request reuses the same row id.
 *
 * (4) SLA / OVERDUE. A row is overdue while it is still "requested" and older
 *   than `period.overdueDays` (default 3 days) measured from `requestedAt`.
 *   Turnaround is the mean requestedAt -> respondedAt gap of signed rows.
 *
 * Every function is async with a short delay so the UI exercises its real
 * loading states; each one notes where a `fetch` replaces the localStorage call.
 */

export const CLEARANCE_RECORDS_KEY = "cpc:clearance:records";
export const CLEARANCE_TIMELINE_KEY = "cpc:clearance:timeline";
export const CLEARANCE_PERIOD_KEY = "cpc:clearance:period";
export const ADMIN_FEED_KEY = "cpc.admin.notifications.v1";
export const ADMIN_ACTIVITY_KEY = "cpc.admin.activity.v1";
export const CLEARANCE_CHANNEL_NAME = "cpc-clearance";

const READ_DELAY = 400;
const WRITE_DELAY = 400;
const MAX_TIMELINE = 240;
const MAX_FEED = 30;
const MAX_ACTIVITY = 40;

export const DEFAULT_PERIOD: ClearancePeriod = {
  academicYear: "2026-2027",
  term: "1st Semester",
  opensAt: "2026-08-03T00:00:00.000Z",
  closesAt: "2026-12-15T23:59:59.000Z",
  open: true,
  overdueDays: 3,
};

function wait<T>(value: T, ms = READ_DELAY): Promise<T> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(value), ms);
  });
}

function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
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
    // Quota or private mode: this tab's in-memory state still works.
  }
}

/** Tells the other open tabs (and other hooks in this tab) to re-read. */
export function announceClearanceChange(reason: string): void {
  if (typeof BroadcastChannel === "undefined") return;
  try {
    const channel = new BroadcastChannel(CLEARANCE_CHANNEL_NAME);
    channel.postMessage({ reason, at: new Date().toISOString() });
    channel.close();
  } catch {
    // BroadcastChannel is unavailable in some privacy modes.
  }
}

/* ------------------------------------------------------------------- seed */

const FIRST_NAMES = [
  "Kyla", "Nicole", "Jasmine", "Angela", "Paolo", "Marcus", "Andrea", "Mika",
  "Daniel", "Rhea", "Joshua", "Camille", "Trisha", "Nathan", "Aira", "Bianca",
  "Carlo", "Dana", "Ella", "Ferdinand", "Gwen", "Hannah", "Ivan", "Janelle",
  "Kirk", "Liza", "Miguel", "Naomi", "Omar", "Patricia", "Quincy", "Rafael",
  "Sofia", "Trevor", "Ulrich", "Vera", "Wilhelm", "Xander", "Yuki", "Zara",
];

const LAST_NAMES = [
  "Garcia", "Gonzales", "Santos", "Pascual", "Reyes", "Villanueva", "Cruz",
  "Fernandez", "Dela Cruz", "Alvarez", "Bautista", "Castillo", "Domingo",
  "Estrada", "Flores", "Gutierrez", "Hidalgo", "Ibarra", "Javellana", "Lopez",
  "Mendoza", "Navarro", "Ocampo", "Padilla", "Quiambao", "Ramos", "Salazar",
  "Torres", "Uy", "Valdez", "Aquino", "Bartolome", "Cabrera", "Del Rosario",
  "Espiritu", "Fajardo", "Galan", "Herrera", "Ilagan", "Jimenez",
];

const SECTIONS = ["BSIT 3-A", "BSIT 3-B", "BSIT 3-C", "BSIT 3-D"];

/** Six students deliberately parked past the three-day SLA. */
const OVERDUE_STUDENTS = new Set([3, 9, 17, 24, 31, 38]);

const NOTE_LINES = [
  "Requesting clearance for 2nd semester enrollment.",
  "Please sign before the filing deadline on Friday.",
  "I will settle any pending fee once this is signed.",
  "Needed for an OJT deployment endorsement.",
];

function seedStatusFor(
  index: number,
  officeIndex: number,
): OfficeSignature["status"] {
  // Every thirteenth student is fully cleared, to exercise the reference
  // number and the completed state on the student page.
  if (index % 13 === 0) return "signed";
  if (index % 17 === 0 && officeIndex === 2) return "rejected";

  const roll = (index * 7 + officeIndex * 13) % 10;
  if (roll <= 3) return "requested";
  if (roll <= 7) return "signed";
  if (roll === 8) return "rejected";
  return "not_requested";
}

function seedRequestedAt(index: number, officeIndex: number, now: number): string {
  const hoursAgo = OVERDUE_STUDENTS.has(index)
    ? 24 * (4 + (index % 5))
    : 1 + ((index * 5 + officeIndex * 3) % 44);
  return new Date(now - hoursAgo * 3_600_000).toISOString();
}

function seedOffices(index: number, now: number): OfficeSignature[] {
  return OFFICE_ORDER.map((office, officeIndex) => {
    const status = seedStatusFor(index, officeIndex);
    if (status === "not_requested") {
      return { office, label: OFFICE_LABELS[office], status };
    }

    const requestedAt = seedRequestedAt(index, officeIndex, now);
    const base: OfficeSignature = {
      office,
      label: OFFICE_LABELS[office],
      status,
      requestedAt,
    };

    if (status === "requested") {
      return index % 9 === 2
        ? { ...base, studentNote: NOTE_LINES[index % NOTE_LINES.length] }
        : base;
    }

    const respondedAt = new Date(
      Date.parse(requestedAt) + (3 + ((index + officeIndex) % 40)) * 3_600_000,
    ).toISOString();

    if (status === "rejected") {
      return {
        ...base,
        respondedAt,
        signerName: officeSignerNames[office],
        remarks: "Please settle the outstanding requirement and request again.",
      };
    }

    // Seeded signatures carry no image so the demo store stays small; the
    // student card falls back to the signer's name in a handwriting face.
    return { ...base, respondedAt, signerName: officeSignerNames[office] };
  });
}

function isFullySigned(offices: OfficeSignature[]): boolean {
  return (
    offices.length === OFFICE_ORDER.length &&
    offices.every((office) => office.status === "signed")
  );
}

/** CPC-2026-000123, continuing from the highest number already issued. */
function referenceNumberFor(sequence: number): string {
  return `CPC-2026-${String(sequence).padStart(6, "0")}`;
}

function nextReferenceSequence(records: ClearanceRecord[]): number {
  const highest = records.reduce((max, record) => {
    const tail = (record.referenceNumber ?? "").split("-").pop() ?? "";
    const digits = Number.parseInt(tail, 10);
    return Number.isNaN(digits) ? max : Math.max(max, digits);
  }, 122);
  return highest + 1;
}

function seedRecord(index: number, now: number): ClearanceRecord {
  const offices = seedOffices(index, now);
  const complete = isFullySigned(offices);
  const rotation = index % 3;

  return {
    studentId: `STU-2026-${String(101 + index).padStart(4, "0")}`,
    studentName: `${FIRST_NAMES[index]} ${LAST_NAMES[index]}`,
    section: SECTIONS[index % SECTIONS.length],
    program: "BS Information Technology",
    yearLevel: "3rd Year",
    term: "1st",
    academicYear: "2026-2027",
    offices,
    subjects: [...mockSubjects.slice(rotation), ...mockSubjects.slice(0, rotation)],
    saoEvents: mockEvents.map((event, eventIndex) => ({
      ...event,
      attended: event.attended && (index % 5 !== 0 || eventIndex !== 3),
    })),
    referenceNumber: complete ? referenceNumberFor(123 + index) : undefined,
    completedAt: complete
      ? new Date(now - (index + 2) * 86_400_000).toISOString()
      : undefined,
  };
}

/**
 * The demo student from the student portal: five offices already signed, the
 * SAO still awaiting action, and one genuinely missing event so the SAO
 * checklist reports a real issue.
 */
function seedHarry(now: number): ClearanceRecord {
  const signed = createInitialOffices().map((office) => {
    const requestedAt = new Date(now - 9 * 86_400_000).toISOString();
    return {
      ...office,
      status: "signed" as const,
      requestedAt,
      respondedAt: new Date(Date.parse(requestedAt) + 6 * 3_600_000).toISOString(),
      signerName: officeSignerNames[office.office],
    };
  });

  return {
    studentId: "20240778",
    studentName: "Harry Styles",
    section: "BSIT 3-A",
    program: "BS Information Technology",
    yearLevel: "3rd Year",
    term: "1st",
    academicYear: "2026-2027",
    offices: signed.map((office) =>
      office.office === "sao"
        ? {
            ...office,
            status: "requested" as const,
            requestedAt: new Date(now - 5 * 3_600_000).toISOString(),
            respondedAt: undefined,
            signerName: undefined,
            studentNote: NOTE_LINES[0],
          }
        : office,
    ),
    subjects: mockSubjects,
    saoEvents: mockEvents,
  };
}

function seedRecords(): ClearanceRecord[] {
  const now = Date.now();
  return [
    seedHarry(now),
    ...Array.from({ length: 40 }, (_, index) => seedRecord(index, now)),
  ];
}

function seedTimeline(records: ClearanceRecord[]): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  for (const record of records) {
    for (const office of record.offices) {
      if (office.status === "not_requested" || !office.requestedAt) continue;
      const requestId = `${record.studentId}:${office.office}`;
      events.push({
        id: newId(),
        requestId,
        at: office.requestedAt,
        actor: record.studentName,
        type: "requested",
        detail: office.studentNote,
      });
      if (!office.respondedAt) continue;
      events.push({
        id: newId(),
        requestId,
        at: office.respondedAt,
        actor: office.signerName ?? OFFICE_LABELS[office.office],
        type: office.status === "signed" ? "signed" : "rejected",
        detail: office.status === "rejected" ? office.remarks : undefined,
      });
    }
  }

  return events.sort((a, b) => b.at.localeCompare(a.at)).slice(0, MAX_TIMELINE);
}

/* ---------------------------------------------------------------- records */

/** Real API: `GET /clearance/records`. */
export function readRecords(): ClearanceRecord[] {
  const stored = readJson<ClearanceRecord[]>(CLEARANCE_RECORDS_KEY, []);
  const records = Array.isArray(stored)
    ? stored.filter(
        (record) =>
          typeof record?.studentId === "string" && Array.isArray(record.offices),
      )
    : [];

  if (records.length > 0) return records;

  const seeded = seedRecords();
  writeJson(CLEARANCE_RECORDS_KEY, seeded);
  if (!window.localStorage.getItem(CLEARANCE_TIMELINE_KEY)) {
    writeJson(CLEARANCE_TIMELINE_KEY, seedTimeline(seeded));
  }
  return seeded;
}

function writeRecords(records: ClearanceRecord[]): void {
  writeJson(CLEARANCE_RECORDS_KEY, records);
}

/** Real API: `GET /clearance/records`. */
export async function getRecords(): Promise<ClearanceRecord[]> {
  return wait(readRecords());
}

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

function readTimeline(): TimelineEvent[] {
  const stored = readJson<TimelineEvent[]>(CLEARANCE_TIMELINE_KEY, []);
  return Array.isArray(stored) ? stored : [];
}

function appendTimeline(events: TimelineEvent[]): void {
  const existing = readTimeline();
  writeJson(
    CLEARANCE_TIMELINE_KEY,
    [...events, ...existing]
      .sort((a, b) => b.at.localeCompare(a.at))
      .slice(0, MAX_TIMELINE),
  );
}

function removeTimeline(ids: string[]): void {
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

/* ------------------------------------------------------------------- rows */

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

/** Office staff only ever see their own office; the admin sees everything. */
export function scopeRows(
  rows: ClearanceRequestRow[],
  office: OfficeId | null,
): ClearanceRequestRow[] {
  return office ? rows.filter((row) => row.office === office) : rows;
}

/** Real API: `GET /clearance/requests`; filtering is server-side in a real build. */
export async function getClearanceRows(
  office: OfficeId | null = null,
): Promise<ClearanceRequestRow[]> {
  const period = readPeriod();
  return wait(scopeRows(deriveRows(readRecords(), period.overdueDays), office));
}

/** Real API: `GET /clearance/students/:studentId`. */
export async function getClearanceRecord(
  studentId: string,
): Promise<ClearanceRecord | null> {
  return wait(readRecordSync(studentId));
}

export function readRecordSync(studentId: string): ClearanceRecord | null {
  return readRecords().find((entry) => entry.studentId === studentId) ?? null;
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

/* ---------------------------------------------------------------- derived */

function isSameDay(iso: string | undefined, now: Date): boolean {
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

/* -------------------------------------------------------------- mutations */

export type DecisionSnapshot = {
  requestId: string;
  studentId: string;
  office: OfficeId;
  previous: OfficeSignature;
  previousReferenceNumber?: string;
  previousCompletedAt?: string;
  addedTimelineId: string;
};

export type DecisionOutcome = {
  rows: ClearanceRequestRow[];
  snapshots: DecisionSnapshot[];
};

type DecisionSpec = {
  ids: string[];
  patch: (office: OfficeSignature) => OfficeSignature;
  event: (input: {
    requestId: string;
    office: OfficeId;
    at: string;
  }) => TimelineEvent;
  /** Runs after the write so a failed batch cannot emit half-sent alerts. */
  notify?: (input: {
    record: ClearanceRecord;
    office: OfficeId;
    at: string;
  }) => void;
};

function parseRowId(id: string): { studentId: string; office: OfficeId } | null {
  const separator = id.lastIndexOf(":");
  if (separator <= 0) return null;
  const studentId = id.slice(0, separator);
  const office = id.slice(separator + 1) as OfficeId;
  return OFFICE_ORDER.includes(office) ? { studentId, office } : null;
}

function studentEmail(record: ClearanceRecord): string {
  const slug = record.studentName
    .toLowerCase()
    .replace(/[^a-z]+/g, ".")
    .replace(/^\.|\.$/g, "");
  return `${slug}@cpc.edu.ph`;
}

function studentActivity(
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

function pushStudentNotification(
  studentId: string,
  input: { message: string; type: AppNotification["type"]; officeId?: OfficeId },
): void {
  const key = `cpc:notifications:${studentId}`;
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

function pushAdminNotification(
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

function pushActivity(item: ActivityItem): void {
  const existing = readJson<ActivityItem[]>(ADMIN_ACTIVITY_KEY, []);
  const list = Array.isArray(existing) ? existing : [];
  writeJson(ADMIN_ACTIVITY_KEY, [item, ...list].slice(0, MAX_ACTIVITY));
}

function queueHref(requestId: string): string {
  return `/admin/clearance-requests?request=${encodeURIComponent(requestId)}`;
}

/**
 * (2) The single write path for every staff decision: mutate the office entry
 * on a copy of the record, recompute completion (3), persist once, broadcast,
 * then notify.
 */
function applyDecision(spec: DecisionSpec): DecisionOutcome {
  const period = readPeriod();
  const records = readRecords();
  const targets: Array<{ studentId: string; office: OfficeId; requestId: string }> = [];

  for (const id of spec.ids) {
    const parsed = parseRowId(id);
    if (parsed) targets.push({ ...parsed, requestId: id });
  }

  const snapshots: DecisionSnapshot[] = [];
  const addedEvents: TimelineEvent[] = [];
  const notifyQueue: Array<{ record: ClearanceRecord; office: OfficeId; at: string }> = [];
  const touched = new Set<string>();
  let sequence = nextReferenceSequence(records);

  const next = records.map((record) => {
    const entries = targets.filter((target) => target.studentId === record.studentId);
    if (entries.length === 0) return record;

    const offices = record.offices.slice();
    const decided: OfficeId[] = [];

    for (const entry of entries) {
      const index = offices.findIndex((office) => office.office === entry.office);
      if (index < 0) continue;

      const previous = { ...offices[index] };
      const updated = spec.patch(previous);
      if (
        updated.status === previous.status &&
        updated.respondedAt === previous.respondedAt
      ) {
        continue;
      }

      const at = new Date().toISOString();
      offices[index] = updated;
      decided.push(entry.office);

      const event = spec.event({
        requestId: entry.requestId,
        office: entry.office,
        at,
      });
      addedEvents.push(event);
      snapshots.push({
        requestId: entry.requestId,
        studentId: record.studentId,
        office: entry.office,
        previous,
        previousReferenceNumber: record.referenceNumber,
        previousCompletedAt: record.completedAt,
        addedTimelineId: event.id,
      });
    }

    if (decided.length === 0) return record;

    const complete = isFullySigned(offices);
    const completedAt = new Date().toISOString();
    const result: ClearanceRecord = complete
      ? {
          ...record,
          offices,
          referenceNumber: record.referenceNumber ?? referenceNumberFor(sequence++),
          completedAt: record.completedAt ?? completedAt,
        }
      : { ...record, offices, referenceNumber: undefined, completedAt: undefined };

    touched.add(record.studentId);
    for (const office of decided) {
      notifyQueue.push({ record: result, office, at: completedAt });
    }

    return result;
  });

  if (addedEvents.length > 0) {
    appendTimeline(addedEvents);
    writeRecords(next);
    announceClearanceChange("decision");
    for (const entry of notifyQueue) spec.notify?.(entry);
  }

  return {
    rows: scopeRows(deriveRows(next, period.overdueDays), null).filter((row) =>
      touched.has(row.studentId),
    ),
    snapshots,
  };
}

/**
 * Sign one request. Real API:
 *   PATCH /clearance/:studentId/offices/:officeId
 *   { status: "signed", signatureImage, signerName, respondedAt, reviewedBy }
 */
export async function approveRequest(
  requestId: string,
  input: ApproveInput & { signerName: string; staffId: string },
): Promise<DecisionOutcome> {
  if (input.draft.saveAs) {
    storeSignature(input.staffId, {
      imageBase64: input.draft.imageBase64,
      method: input.draft.method,
      label: input.draft.saveAs.label.trim() || input.signerName,
      isDefault: input.draft.saveAs.isDefault,
    });
  }

  const outcome = applyDecision({
    ids: [requestId],
    patch: (office) => ({
      ...office,
      status: "signed" as const,
      signerName: input.signerName,
      signatureImage: input.draft.imageBase64,
      respondedAt: new Date().toISOString(),
      remarks: undefined,
    }),
    event: ({ requestId: id, office, at }) => ({
      id: newId(),
      requestId: id,
      at,
      actor: input.signerName,
      type: "signed" as const,
      detail:
        input.internalRemarks?.trim() || `${OFFICE_LABELS[office]} signature applied.`,
    }),
    notify: ({ record, office }) => {
      pushStudentNotification(record.studentId, {
        message: isFullySigned(record.offices)
          ? "Your clearance is complete. You can now download your confirmation."
          : `${OFFICE_LABELS[office]} signed your clearance.`,
        type: "success",
        officeId: office,
      });
      pushActivity(
        studentActivity(
          record,
          office,
          input.signerName,
          "completed",
          `${OFFICE_LABELS[office]} clearance signed for ${record.studentName}`,
        ),
      );
    },
  });

  return wait(outcome, WRITE_DELAY);
}

/** Real API: `PATCH /clearance/:studentId/offices/:officeId` with remarks. */
export async function rejectRequest(
  requestId: string,
  input: { remarks: string; signerName: string },
): Promise<DecisionOutcome> {
  const outcome = applyDecision({
    ids: [requestId],
    patch: (office) => ({
      ...office,
      status: "rejected" as const,
      remarks: input.remarks,
      signerName: input.signerName,
      respondedAt: new Date().toISOString(),
    }),
    event: ({ requestId: id, at }) => ({
      id: newId(),
      requestId: id,
      at,
      actor: input.signerName,
      type: "rejected" as const,
      detail: input.remarks,
    }),
    notify: ({ record, office }) => {
      pushStudentNotification(record.studentId, {
        message: `${OFFICE_LABELS[office]} needs action: ${input.remarks}`,
        type: "warning",
        officeId: office,
      });
      pushActivity(
        studentActivity(
          record,
          office,
          input.signerName,
          "pending",
          `${OFFICE_LABELS[office]} returned ${record.studentName}'s request`,
        ),
      );
    },
  });

  return wait(outcome, WRITE_DELAY);
}

/** Admin only: sends a signed request back to the office queue. */
export async function revokeRequest(
  requestId: string,
  input: { reason: string; actorName: string },
): Promise<DecisionOutcome> {
  const outcome = applyDecision({
    ids: [requestId],
    patch: (office) => ({
      ...office,
      status: "requested" as const,
      signatureImage: undefined,
      signerName: undefined,
      respondedAt: undefined,
      remarks: undefined,
    }),
    event: ({ requestId: id, at }) => ({
      id: newId(),
      requestId: id,
      at,
      actor: input.actorName,
      type: "revoked" as const,
      detail: input.reason,
    }),
    notify: ({ record, office }) => {
      pushStudentNotification(record.studentId, {
        message: `${OFFICE_LABELS[office]} revoked the signature: ${input.reason}`,
        type: "warning",
        officeId: office,
      });
      pushActivity(
        studentActivity(
          record,
          office,
          input.actorName,
          "pending",
          `${OFFICE_LABELS[office]} signature revoked for ${record.studentName}`,
        ),
      );
    },
  });

  return wait(outcome, WRITE_DELAY);
}

/** Bulk sign with one of the staff member's saved signatures. */
export async function bulkApprove(
  requestIds: string[],
  input: { signatureId: string; staffId: string; signerName: string },
): Promise<DecisionOutcome> {
  const signature = readSavedSignatures(input.staffId).find(
    (entry) => entry.id === input.signatureId,
  );
  if (!signature) return wait({ rows: [], snapshots: [] }, WRITE_DELAY);

  const outcome = applyDecision({
    ids: requestIds,
    patch: (office) => ({
      ...office,
      status: "signed" as const,
      signerName: input.signerName,
      signatureImage: signature.imageBase64,
      respondedAt: new Date().toISOString(),
      remarks: undefined,
    }),
    event: ({ requestId: id, at }) => ({
      id: newId(),
      requestId: id,
      at,
      actor: input.signerName,
      type: "signed" as const,
      detail: `Signed with saved signature "${signature.label}".`,
    }),
    notify: ({ record, office }) => {
      pushStudentNotification(record.studentId, {
        message: isFullySigned(record.offices)
          ? "Your clearance is complete. You can now download your confirmation."
          : `${OFFICE_LABELS[office]} signed your clearance.`,
        type: "success",
        officeId: office,
      });
    },
  });

  return wait(outcome, WRITE_DELAY);
}

/** Bulk reject with one shared remark. */
export async function bulkReject(
  requestIds: string[],
  input: { remarks: string; signerName: string },
): Promise<DecisionOutcome> {
  const outcome = applyDecision({
    ids: requestIds,
    patch: (office) => ({
      ...office,
      status: "rejected" as const,
      remarks: input.remarks,
      signerName: input.signerName,
      respondedAt: new Date().toISOString(),
    }),
    event: ({ requestId: id, at }) => ({
      id: newId(),
      requestId: id,
      at,
      actor: input.signerName,
      type: "rejected" as const,
      detail: input.remarks,
    }),
    notify: ({ record, office }) => {
      pushStudentNotification(record.studentId, {
        message: `${OFFICE_LABELS[office]} needs action: ${input.remarks}`,
        type: "warning",
        officeId: office,
      });
    },
  });

  return wait(outcome, WRITE_DELAY);
}

/**
 * Replays stored snapshots — how the 8-second Undo reverts one decision or a
 * whole batch. Real API: `POST /clearance/decisions/:id/undo`.
 */
export async function undoDecision(
  snapshots: DecisionSnapshot[],
): Promise<ClearanceRequestRow[]> {
  const period = readPeriod();
  const records = readRecords();
  const byStudent = new Map<string, DecisionSnapshot[]>();

  for (const snapshot of snapshots) {
    const list = byStudent.get(snapshot.studentId) ?? [];
    list.push(snapshot);
    byStudent.set(snapshot.studentId, list);
  }

  const next = records.map((record) => {
    const restores = byStudent.get(record.studentId);
    if (!restores) return record;

    const offices = record.offices.slice();
    for (const restore of restores) {
      const index = offices.findIndex((office) => office.office === restore.office);
      if (index >= 0) offices[index] = { ...restore.previous };
    }

    const complete = isFullySigned(offices);
    return {
      ...record,
      offices,
      referenceNumber: complete
        ? record.referenceNumber
        : restores[0]?.previousReferenceNumber,
      completedAt: complete ? record.completedAt : restores[0]?.previousCompletedAt,
    };
  });

  removeTimeline(snapshots.map((snapshot) => snapshot.addedTimelineId));
  writeRecords(next);
  announceClearanceChange("undo");

  return wait(scopeRows(deriveRows(next, period.overdueDays), null), WRITE_DELAY);
}

/* ------------------------------------------------------------------ period */

/** Real API: `PUT /clearance/period`. */
export async function setPeriod(
  patch: Partial<ClearancePeriod>,
): Promise<ClearancePeriod> {
  const next = { ...readPeriod(), ...patch };
  writeJson(CLEARANCE_PERIOD_KEY, next);
  announceClearanceChange("period");
  return wait(next, WRITE_DELAY);
}

/**
 * Real API: `POST /clearance/reminders`. Nudges every office still holding
 * work and re-notifies students whose request is past the SLA.
 */
export async function sendReminders(staffName: string): Promise<number> {
  const period = readPeriod();
  const rows = deriveRows(readRecords(), period.overdueDays).filter(
    (row) => row.status === "requested",
  );

  const byOffice = new Map<OfficeId, ClearanceRequestRow[]>();
  for (const row of rows) {
    const list = byOffice.get(row.office) ?? [];
    list.push(row);
    byOffice.set(row.office, list);
  }

  for (const [office, officeRows] of byOffice) {
    pushAdminNotification(
      `Reminder sent to ${OFFICE_LABELS[office]}: ${officeRows.length} request${
        officeRows.length === 1 ? "" : "s"
      } still awaiting signature.`,
      "info",
      `/admin/clearance-requests?office=${office}&status=requested`,
    );
  }

  for (const row of rows.filter((entry) => entry.isOverdue)) {
    pushStudentNotification(row.studentId, {
      message: `${OFFICE_LABELS[row.office]} is still reviewing your request (${row.section}).`,
      type: "warning",
      officeId: row.office,
    });
  }

  pushActivity({
    id: newId(),
    type: "clearance",
    message: `Reminders sent to ${byOffice.size} offices`,
    actor: staffName,
    status: "published",
    createdAt: new Date().toISOString(),
    href: "/admin/clearance-requests",
  });

  announceClearanceChange("reminders");
  return wait(byOffice.size, WRITE_DELAY);
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

function writeSavedSignatures(staffId: string, list: SavedSignature[]): void {
  writeJson(savedSignaturesKey(staffId), list);
}

/** Sync write so "save this signature" costs no extra round trip. */
function storeSignature(
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

/* ------------------------------------------------------------ demo helpers */

/** Real API: the student's own `POST /clearance/:studentId/offices`. */
export async function simulateStudentRequest(
  studentId?: string,
  office?: OfficeId,
): Promise<ClearanceRequestRow | null> {
  const period = readPeriod();
  const records = readRecords();
  const record =
    records.find((entry) => entry.studentId === studentId) ??
    records.filter((entry) =>
      entry.offices.some(
        (officeEntry) =>
          officeEntry.status === "not_requested" || officeEntry.status === "rejected",
      ),
    )[Math.floor(Math.random() * 40)] ??
    records[0];

  if (!record) return wait(null, WRITE_DELAY);

  const target =
    record.offices.find(
      (officeEntry) =>
        (!office || officeEntry.office === office) &&
        (officeEntry.status === "not_requested" || officeEntry.status === "rejected"),
    ) ?? record.offices.find((officeEntry) => officeEntry.status !== "signed");

  if (!target) return wait(null, WRITE_DELAY);

  const wasRejected = target.status === "rejected";
  const now = new Date().toISOString();
  const note = NOTE_LINES[Math.floor(Math.random() * NOTE_LINES.length)];

  const next = records.map((entry) =>
    entry.studentId !== record.studentId
      ? entry
      : {
          ...entry,
          offices: entry.offices.map((officeEntry) =>
            officeEntry.office !== target.office
              ? officeEntry
              : {
                  ...officeEntry,
                  status: "requested" as const,
                  requestedAt: now,
                  respondedAt: undefined,
                  remarks: undefined,
                  signerName: undefined,
                  signatureImage: undefined,
                  studentNote: note,
                },
          ),
        },
  );

  const requestId = `${record.studentId}:${target.office}`;
  appendTimeline([
    {
      id: newId(),
      requestId,
      at: now,
      actor: record.studentName,
      type: wasRejected ? "reopened" : "requested",
      detail: note,
    },
  ]);
  writeRecords(next);

  pushAdminNotification(
    `New request from ${record.studentName} (${record.section}) to ${OFFICE_LABELS[target.office]}`,
    "info",
    queueHref(requestId),
  );
  pushActivity(
    studentActivity(
      record,
      target.office,
      record.studentName,
      "new",
      `New clearance request from ${record.studentName} to ${OFFICE_LABELS[target.office]}`,
    ),
  );
  announceClearanceChange("student-request");

  const row = deriveRows(next, period.overdueDays).find(
    (entry) => entry.id === requestId,
  );

  return wait(row ?? null, WRITE_DELAY);
}

/** Real API: the student's own `DELETE /clearance/:studentId/offices/:office`. */
export async function simulateStudentCancel(
  requestId: string,
): Promise<boolean> {
  const parsed = parseRowId(requestId);
  if (!parsed) return wait(false, WRITE_DELAY);

  const records = readRecords();
  const record = records.find((entry) => entry.studentId === parsed.studentId);
  const office = record?.offices.find((entry) => entry.office === parsed.office);
  if (!record || !office || office.status !== "requested") {
    return wait(false, WRITE_DELAY);
  }

  const next = records.map((entry) =>
    entry.studentId !== record.studentId
      ? entry
      : {
          ...entry,
          offices: entry.offices.map((officeEntry) =>
            officeEntry.office !== parsed.office
              ? officeEntry
              : {
                  ...officeEntry,
                  status: "not_requested" as const,
                  requestedAt: undefined,
                  respondedAt: undefined,
                  studentNote: undefined,
                  remarks: undefined,
                },
          ),
        },
  );

  appendTimeline([
    {
      id: newId(),
      requestId,
      at: new Date().toISOString(),
      actor: record.studentName,
      type: "cancelled",
    },
  ]);
  writeRecords(next);
  pushAdminNotification(
    `${record.studentName} cancelled a ${OFFICE_LABELS[parsed.office]} request`,
    "info",
    "/admin/clearance-requests",
  );
  announceClearanceChange("student-cancel");

  return wait(true, WRITE_DELAY);
}

/** Wipes every clearance key and re-seeds from scratch. */
export async function resetClearanceDemo(): Promise<ClearanceRequestRow[]> {
  const records = seedRecords();
  writeJson(CLEARANCE_RECORDS_KEY, records);
  writeJson(CLEARANCE_TIMELINE_KEY, seedTimeline(records));
  writeJson(CLEARANCE_PERIOD_KEY, DEFAULT_PERIOD);

  for (const record of records) {
    window.localStorage.removeItem(`cpc:notifications:${record.studentId}`);
  }

  announceClearanceChange("reset");
  return wait(deriveRows(records, DEFAULT_PERIOD.overdueDays), WRITE_DELAY);
}
