import type {
  ClearanceRecord,
  ClearanceRequestRow,
  RequestStatus,
} from "@/types/clearance";
import {
  deriveRows,
  readPeriod,
  readRecords,
  resetClearanceDemo,
  simulateStudentRequest,
} from "@/components/features/admin/clearance/services/clearanceAdminService";
import { buildOfficeChecks } from "@/components/features/admin/clearance/utils/officeChecks";
import type {
  ActivityItem,
  ActivityStatus,
  AdminNotification,
  AdminUser,
  ChecklistItem,
  ClearanceRequest,
  ClearanceRequestStatus,
  DashboardStat,
  DashboardStats,
  EnrollmentOverviewRow,
} from "@/types/admin";

/**
 * Mock API layer for the admin portal shell (dashboard, bell, sidebar badge,
 * command palette).
 *
 * (1) SHARED-STORAGE CONTRACT: clearance data lives in exactly one place —
 * the `cpc:clearance:records` array owned by
 * `@/components/features/admin/clearance/services/clearanceAdminService`, which both
 * portals read and write. The shell no longer keeps its own copy of the queue:
 * every clearance number here is an adapter view of those same records, so the
 * dashboard KPI, the sidebar badge and the staff queue can never disagree.
 * Decisions are made inside the clearance module; this file only reads.
 *
 * The remaining functions still read and write their own admin keys. Replace
 * the localStorage calls with `fetch` when the backend lands; the function
 * signatures stay the same.
 */

export const ADMIN_ACTIVITY_KEY = "cpc.admin.activity.v1";
export const ADMIN_NOTIFICATIONS_KEY = "cpc.admin.notifications.v1";
export const ADMIN_SESSION_KEY = "cpc.admin.session.v1";
export const ADMIN_DEMO_MODE_KEY = "cpc.admin.demo-mode.v1";
export const ADMIN_SIDEBAR_KEY = "cpc.admin.sidebar.collapsed.v1";

const READ_DELAY = 400;
const WRITE_DELAY = 400;

function wait<T>(value: T, ms = READ_DELAY): Promise<T> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(value), ms);
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readJson(key: string, fallback: unknown): unknown {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as unknown;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore quota / private-mode failures; the in-memory UI still works.
  }
}

function removeKey(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore storage failures.
  }
}

/* ------------------------------------------------------------------ */
/* Seed data                                                           */
/* ------------------------------------------------------------------ */

const FIRST_NAMES = [
  "Alyssa",
  "John Paul",
  "Maria",
  "Kyla",
  "Joshua",
  "Angela",
  "Mark",
  "Nicole",
  "Christian",
  "Patricia",
  "Rafael",
  "Jasmine",
  "Daniel",
  "Bea",
  "Miguel",
  "Camille",
  "Jose",
  "Liza",
  "Ramon",
  "Ana",
  "Paolo",
  "Sofia",
  "Gabriel",
  "Isabel",
  "Marco",
  "Andrea",
  "Luis",
  "Erika",
  "Carlo",
  "Hannah",
  "Nathan",
  "Mika",
];

const LAST_NAMES = [
  "Dela Cruz",
  "Santos",
  "Reyes",
  "Villanueva",
  "Cruz",
  "Garcia",
  "Mendoza",
  "Bautista",
  "Navarro",
  "Aquino",
  "Ramos",
  "Castillo",
  "Flores",
  "Gonzales",
  "Torres",
  "Rivera",
  "Domingo",
  "Salazar",
  "Fernandez",
  "Pascual",
];

const PROGRAM_SECTIONS = [
  { program: "BS Information Technology", section: "BSIT 3-A", yearLevel: "3rd Year" },
  { program: "BS Education", section: "BSED 2-B", yearLevel: "2nd Year" },
  { program: "BS Hospitality Management", section: "BSHM 4-A", yearLevel: "4th Year" },
  { program: "BE Elementary Education", section: "BEED 1-C", yearLevel: "1st Year" },
  { program: "BS Business Administration", section: "BSBA 2-A", yearLevel: "2nd Year" },
  { program: "BS Computer Science", section: "BSCS 3-B", yearLevel: "3rd Year" },
];

type SeedStudent = {
  studentName: string;
  studentId: string;
  program: string;
  section: string;
  yearLevel: string;
  email: string;
};

function makeStudent(index: number): SeedStudent {
  const program = PROGRAM_SECTIONS[index % PROGRAM_SECTIONS.length];
  const first = FIRST_NAMES[(index * 7 + 3) % FIRST_NAMES.length];
  const last = LAST_NAMES[(index * 11 + 5) % LAST_NAMES.length];

  return {
    studentName: `${first} ${last}`,
    studentId: `STU-2026-${String(100 + index).padStart(4, "0")}`,
    program: program.program,
    section: program.section,
    yearLevel: program.yearLevel,
    email: `${first.toLowerCase().replace(/\s+/g, ".")}.${last
      .toLowerCase()
      .replace(/\s+/g, "")}@cpc.edu.ph`,
  };
}

/* ------------------------------------------------------------------ */
/* Clearance adapter — the shared record store is the only source       */
/* ------------------------------------------------------------------ */

/**
 * (1) The queue is not stored here. `deriveRows` turns the shared
 * `cpc:clearance:records` array into one row per student + office — exactly the
 * rows the staff clearance page renders — and this adapter only reshapes them
 * into the legacy `ClearanceRequest` consumed by the dashboard KPI, the bell,
 * the sidebar badge and the command palette. Nothing in this section writes.
 */
function studentEmail(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0] ?? "student";
  const last = parts.length > 1 ? parts[parts.length - 1] : first;

  return `${first.toLowerCase().replace(/\s+/g, ".")}.${last
    .toLowerCase()
    .replace(/\s+/g, "")}@cpc.edu.ph`;
}

/** "requested" is the record's word for a queue row staff has not answered. */
function shellStatus(status: RequestStatus): ClearanceRequestStatus {
  if (status === "requested") return "pending";
  if (status === "signed") return "signed";
  return "rejected";
}

function toShellRequest(
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
    email: studentEmail(row.studentName),
    office: row.office,
    requestedAt: row.requestedAt ?? record.completedAt ?? new Date().toISOString(),
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

function readAdminRequests(): ClearanceRequest[] {
  const records = readRecords();
  const byId = new Map(records.map((record) => [record.studentId, record]));

  return deriveRows(records, readPeriod().overdueDays).flatMap<ClearanceRequest>(
    (row) => {
      const record = byId.get(row.studentId);
      return record ? [toShellRequest(row, record)] : [];
    },
  );
}

function visibleRequests(user: AdminUser): ClearanceRequest[] {
  const all = readAdminRequests();
  return user.role === "admin"
    ? all
    : all.filter((request) => request.office === user.office);
}

function seedActivity(): ActivityItem[] {
  const now = Date.now();
  const alyssa = makeStudent(0);
  const john = makeStudent(7);
  const maria = makeStudent(14);

  return [
    {
      id: "activity-1",
      type: "enrollment",
      message: "New enrollment application submitted",
      actor: alyssa.studentName,
      student: {
        id: alyssa.studentId,
        name: alyssa.studentName,
        program: alyssa.program,
        section: alyssa.section,
        yearLevel: alyssa.yearLevel,
        email: alyssa.email,
      },
      status: "new",
      createdAt: new Date(now - 12 * 60 * 1000).toISOString(),
      href: "/admin/enrollment/applications",
    },
    {
      id: "activity-2",
      type: "clearance",
      message: "Registrar signed a clearance request",
      actor: "Mrs. Liza Reyes",
      student: {
        id: john.studentId,
        name: john.studentName,
        program: john.program,
        section: john.section,
        yearLevel: john.yearLevel,
        email: john.email,
      },
      status: "completed",
      createdAt: new Date(now - 38 * 60 * 1000).toISOString(),
      href: "/admin/clearance-requests",
    },
    {
      id: "activity-3",
      type: "complaint",
      message: "Complaint assigned to the SAO",
      actor: "Prof. Lorna Fernandez",
      student: {
        id: maria.studentId,
        name: maria.studentName,
        program: maria.program,
        section: maria.section,
        yearLevel: maria.yearLevel,
        email: maria.email,
      },
      status: "pending",
      createdAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
      href: "/admin/support/complaints",
    },
    {
      id: "activity-4",
      type: "announcement",
      message: "Published: 2nd semester enrollment schedule",
      actor: "Maria Santos",
      status: "published",
      createdAt: new Date(now - 5 * 60 * 60 * 1000).toISOString(),
      href: "/admin/news/announcements",
    },
    {
      id: "activity-5",
      type: "enrollment",
      message: "Application moved to For Review",
      actor: "Registrar Staff",
      student: {
        id: alyssa.studentId,
        name: alyssa.studentName,
        program: alyssa.program,
        section: alyssa.section,
        yearLevel: alyssa.yearLevel,
        email: alyssa.email,
      },
      status: "pending",
      createdAt: new Date(now - 9 * 60 * 60 * 1000).toISOString(),
      href: "/admin/enrollment/for-review",
    },
  ];
}

function isActivityStatus(value: unknown): value is ActivityStatus {
  return value === "new" || value === "completed" || value === "pending" || value === "published";
}

function normalizeActivity(value: unknown): ActivityItem | null {
  if (!isRecord(value)) return null;
  if (
    typeof value.id !== "string" ||
    typeof value.message !== "string" ||
    typeof value.actor !== "string" ||
    typeof value.createdAt !== "string" ||
    !isActivityStatus(value.status) ||
    (value.type !== "enrollment" &&
      value.type !== "clearance" &&
      value.type !== "complaint" &&
      value.type !== "announcement")
  ) {
    return null;
  }

  return {
    id: value.id,
    type: value.type,
    message: value.message,
    actor: value.actor,
    student: isRecord(value.student)
      ? {
          id: typeof value.student.id === "string" ? value.student.id : "",
          name: typeof value.student.name === "string" ? value.student.name : "",
          program: typeof value.student.program === "string" ? value.student.program : "",
          section: typeof value.student.section === "string" ? value.student.section : "",
          yearLevel:
            typeof value.student.yearLevel === "string" ? value.student.yearLevel : "",
          email: typeof value.student.email === "string" ? value.student.email : "",
        }
      : undefined,
    status: value.status,
    createdAt: value.createdAt,
    href: typeof value.href === "string" ? value.href : undefined,
  };
}

function readActivity(): ActivityItem[] {
  const stored = readJson(ADMIN_ACTIVITY_KEY, null);

  if (Array.isArray(stored)) {
    const normalized = stored
      .map(normalizeActivity)
      .filter((item): item is ActivityItem => item !== null);
    if (normalized.length > 0) return normalized;
  }

  const seeded = seedActivity();
  writeJson(ADMIN_ACTIVITY_KEY, seeded);
  return seeded;
}

function seedAdminNotifications(): AdminNotification[] {
  const now = Date.now();

  return [
    {
      id: "notif-1",
      message: "3 clearance requests are waiting for your signature.",
      type: "info",
      createdAt: new Date(now - 8 * 60 * 1000).toISOString(),
      read: false,
      href: "/admin/clearance-requests",
    },
    {
      id: "notif-2",
      message: "A new enrollment application needs review.",
      type: "warning",
      createdAt: new Date(now - 35 * 60 * 1000).toISOString(),
      read: false,
      href: "/admin/enrollment/for-review",
    },
    {
      id: "notif-3",
      message: "Registrar signed 5 clearance requests today.",
      type: "success",
      createdAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
      read: false,
      href: "/admin/clearance-requests",
    },
    {
      id: "notif-4",
      message: "Weekly enrollment summary is ready.",
      type: "info",
      createdAt: new Date(now - 26 * 60 * 60 * 1000).toISOString(),
      read: true,
      href: "/admin/dashboard",
    },
  ];
}

function normalizeAdminNotification(value: unknown): AdminNotification | null {
  if (!isRecord(value)) return null;
  if (
    typeof value.id !== "string" ||
    typeof value.message !== "string" ||
    typeof value.createdAt !== "string" ||
    typeof value.read !== "boolean" ||
    (value.type !== "info" && value.type !== "success" && value.type !== "warning")
  ) {
    return null;
  }

  return {
    id: value.id,
    message: value.message,
    type: value.type,
    createdAt: value.createdAt,
    read: value.read,
    href: typeof value.href === "string" ? value.href : undefined,
  };
}

function readAdminNotifications(): AdminNotification[] {
  const stored = readJson(ADMIN_NOTIFICATIONS_KEY, null);

  if (Array.isArray(stored)) {
    const normalized = stored
      .map(normalizeAdminNotification)
      .filter((item): item is AdminNotification => item !== null);
    if (normalized.length > 0) return normalized;
  }

  const seeded = seedAdminNotifications();
  writeJson(ADMIN_NOTIFICATIONS_KEY, seeded);
  return seeded;
}

/* ------------------------------------------------------------------ */
/* Reads                                                               */
/* ------------------------------------------------------------------ */

/** Role-aware clearance queue, newest request first. */
export async function getClearanceRequests(user: AdminUser): Promise<ClearanceRequest[]> {
  const requests = visibleRequests(user).sort((a, b) =>
    b.requestedAt.localeCompare(a.requestedAt),
  );
  return wait(requests);
}

function isToday(value: string | undefined): boolean {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function sparklineFor(value: number, offsets: number[]): number[] {
  return offsets.map((offset) => Math.max(0, value - offset));
}

/** Dashboard KPIs and sparkline series for the signed-in role. */
export async function getDashboardStats(user: AdminUser): Promise<DashboardStats> {
  const requests = visibleRequests(user);
  const pendingClearance = requests.filter((request) => request.status === "pending").length;
  const signedToday = requests.filter(
    (request) => request.status === "signed" && isToday(request.respondedAt),
  ).length;
  const rejectedClearance = requests.filter(
    (request) => request.status === "rejected",
  ).length;

  const pendingEnrollments = 126;
  const openRequests = 39;
  const activeComplaints = 12;

  const stats: DashboardStat[] = [
    {
      id: "enrollments",
      label: "Pending Enrollments",
      value: pendingEnrollments,
      change: 12,
      trend: "up",
      href: "/admin/enrollment/for-review",
      sparkline: [98, 104, 101, 110, 108, 118, pendingEnrollments],
    },
    {
      id: "clearance",
      label: "Pending Clearance",
      value: pendingClearance,
      change: 6,
      trend: "up",
      href: "/admin/clearance-requests",
      sparkline: sparklineFor(pendingClearance, [24, 18, 20, 13, 10, 4, 0]),
    },
    {
      id: "requests",
      label: "Open Requests",
      value: openRequests,
      change: 0,
      trend: "flat",
      href: "/admin/service-requests",
      sparkline: [42, 41, 43, 40, 39, 39, openRequests],
    },
    {
      id: "complaints",
      label: "Active Complaints",
      value: activeComplaints,
      change: -3,
      trend: "down",
      href: "/admin/support/complaints",
      sparkline: [18, 17, 16, 15, 14, 13, activeComplaints],
    },
  ];

  return wait({
    pendingEnrollments,
    pendingClearance,
    openRequests,
    activeComplaints,
    signedToday,
    rejectedClearance,
    stats,
    lastUpdated: new Date().toISOString(),
  });
}

export async function getEnrollmentOverview(): Promise<EnrollmentOverviewRow[]> {
  const rows: EnrollmentOverviewRow[] = [
    {
      status: "submitted",
      label: "Submitted",
      count: 126,
      last7Days: 18,
      href: "/admin/enrollment/applications",
    },
    {
      status: "for-review",
      label: "For Review",
      count: 42,
      last7Days: 7,
      href: "/admin/enrollment/for-review",
    },
    {
      status: "approved",
      label: "Approved",
      count: 78,
      last7Days: 11,
      href: "/admin/enrollment/approved",
    },
    {
      status: "needs-requirements",
      label: "Needs Requirements",
      count: 21,
      last7Days: -4,
      href: "/admin/enrollment/needs-requirements",
    },
  ];

  return wait(rows);
}

export async function getRecentActivity(): Promise<ActivityItem[]> {
  const activity = readActivity().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return wait(activity.slice(0, 30));
}

export async function getAdminNotifications(): Promise<AdminNotification[]> {
  const notifications = readAdminNotifications().sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
  return wait(notifications.slice(0, 30));
}

/* ------------------------------------------------------------------ */
/* Notifications and demo controls                                     */
/* ------------------------------------------------------------------ */

export async function markNotificationsRead(ids?: string[]): Promise<void> {
  const notifications = readAdminNotifications();
  const next = notifications.map((notification) =>
    ids === undefined || ids.includes(notification.id)
      ? { ...notification, read: true }
      : notification,
  );
  writeJson(ADMIN_NOTIFICATIONS_KEY, next);
  return wait(undefined, 200);
}

/**
 * Demo reset: the shared clearance store goes back to its 40-student seed and
 * the shell's own activity/bell feeds are cleared, so every number on the
 * dashboard is regenerated from the same seed the next time it is read.
 */
export async function resetDemoData(): Promise<void> {
  await resetClearanceDemo();
  [ADMIN_ACTIVITY_KEY, ADMIN_NOTIFICATIONS_KEY].forEach(removeKey);
  return wait(undefined, WRITE_DELAY);
}

/**
 * Demo "generate sample requests": each call asks the shared service to behave
 * like a student tapping Request Signature, so the new rows appear in the staff
 * queue, the dashboard badge and the bell through the same write path.
 */
export async function generateSampleRequests(count = 6): Promise<ClearanceRequest[]> {
  const ids: string[] = [];

  for (let index = 0; index < count; index += 1) {
    const row = await simulateStudentRequest();
    if (row) ids.push(row.id);
  }

  const generated = readAdminRequests().filter((request) => ids.includes(request.id));

  const notifications = readAdminNotifications();
  writeJson(ADMIN_NOTIFICATIONS_KEY, [
    {
      id: crypto.randomUUID(),
      message: `${generated.length} sample clearance requests were generated.`,
      type: "info",
      createdAt: new Date().toISOString(),
      read: false,
      href: "/admin/clearance-requests",
    },
    ...notifications,
  ].slice(0, 30));

  return wait(generated, WRITE_DELAY);
}
