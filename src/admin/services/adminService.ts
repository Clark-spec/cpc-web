import type { AppNotification } from "@/context/NotificationContext";
import {
  mockStudent,
  officeOrder,
  officeSignerNames,
} from "@/features/clearance/data/mockClearance";
import {
  CLEARANCE_NOTIFICATIONS_KEY,
  CLEARANCE_STORAGE_KEY,
} from "@/features/clearance/services/clearanceService";
import type {
  ClearanceState,
  OfficeId,
  OfficeSignature,
  RequestStatus,
} from "@/features/clearance/types";
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
  RejectPayload,
  SavedSignature,
  SignatureMethod,
  SignaturePayload,
} from "../types";

/**
 * Mock API layer for the admin portal.
 *
 * Every function returns a promise with a small artificial delay so the UI
 * exercises real loading states. The clearance functions read and write the
 * SAME localStorage keys as the student portal:
 *   cpc.online-clearance.v1
 *   cpc.online-clearance.notifications.v1
 * so a student request appears here immediately and a staff signature shows up
 * on the student's Online Clearance page. Replace the localStorage calls with
 * `fetch` calls when the backend lands; the function signatures stay the same.
 */

export const ADMIN_REQUESTS_KEY = "cpc.admin.clearance-requests.v1";
export const ADMIN_ACTIVITY_KEY = "cpc.admin.activity.v1";
export const ADMIN_NOTIFICATIONS_KEY = "cpc.admin.notifications.v1";
export const ADMIN_SESSION_KEY = "cpc.admin.session.v1";
export const ADMIN_DEMO_MODE_KEY = "cpc.admin.demo-mode.v1";
export const ADMIN_SIDEBAR_KEY = "cpc.admin.sidebar.collapsed.v1";
export const SAVED_SIGNATURE_PREFIX = "cpc.admin.saved-signature.v1";

const READ_DELAY = 400;
const WRITE_DELAY = 400;

const OFFICE_LABELS: Record<OfficeId, string> = {
  instructor: "Instructor",
  dean: "Dean",
  library: "Library",
  registrar: "Registrar",
  accounting: "Accounting",
  sao: "SAO / SSG Adviser",
};

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

function normalizeStatus(value: unknown): RequestStatus {
  return value === "requested" || value === "signed" || value === "rejected"
    ? value
    : "not_requested";
}

/* ------------------------------------------------------------------ */
/* Student clearance bridge                                            */
/* ------------------------------------------------------------------ */

function createDefaultOffices(): OfficeSignature[] {
  return officeOrder.map((office) => ({
    office,
    label: OFFICE_LABELS[office],
    status: "not_requested",
  }));
}

function readStudentClearance(): ClearanceState {
  const parsed = readJson(CLEARANCE_STORAGE_KEY, null);

  if (!isRecord(parsed) || !Array.isArray(parsed.offices)) {
    return { offices: createDefaultOffices(), history: [], dateCleared: null };
  }

  const rawOffices = parsed.offices;
  const offices = createDefaultOffices().map((fallback) => {
    const match = rawOffices.find(
      (entry) => isRecord(entry) && entry.office === fallback.office,
    );
    if (!isRecord(match)) return fallback;

    return {
      ...fallback,
      status: normalizeStatus(match.status),
      requestedAt: typeof match.requestedAt === "string" ? match.requestedAt : undefined,
      respondedAt: typeof match.respondedAt === "string" ? match.respondedAt : undefined,
      signerName: typeof match.signerName === "string" ? match.signerName : undefined,
      signatureImage:
        typeof match.signatureImage === "string" ? match.signatureImage : undefined,
      studentNote: typeof match.studentNote === "string" ? match.studentNote : undefined,
      remarks: typeof match.remarks === "string" ? match.remarks : undefined,
    };
  });

  return {
    offices,
    history: Array.isArray(parsed.history)
      ? (parsed.history as ClearanceState["history"])
      : [],
    dateCleared: typeof parsed.dateCleared === "string" ? parsed.dateCleared : null,
  };
}

function writeStudentClearance(state: ClearanceState): void {
  writeJson(CLEARANCE_STORAGE_KEY, state);
}

/** Builds the admin rows that mirror the live student clearance record. */
function buildLiveRequests(): ClearanceRequest[] {
  const state = readStudentClearance();

  return state.offices.flatMap<ClearanceRequest>((office) => {
    if (office.status === "not_requested") return [];

    const status: ClearanceRequestStatus =
      office.status === "requested"
        ? "pending"
        : office.status === "signed"
          ? "signed"
          : "rejected";

    return [
      {
        id: `live-${mockStudent.studentId}-${office.office}`,
        studentName: mockStudent.name,
        studentId: mockStudent.studentId,
        program: mockStudent.program,
        section: `${mockStudent.course} 3-A`,
        yearLevel: mockStudent.yearLevel,
        email: "harry.styles@cpc.edu.ph",
        office: office.office,
        requestedAt: office.requestedAt ?? new Date().toISOString(),
        studentNote: office.studentNote,
        status,
        respondedAt: office.respondedAt,
        signerName: office.signerName,
        signatureImage: office.signatureImage,
        remarks: office.remarks,
        checklist: CHECKLIST_TEMPLATES[office.office].map((item) => ({ ...item })),
        live: true,
      },
    ];
  });
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

const STUDENT_NOTES: Array<string | undefined> = [
  "Requesting clearance for 2nd semester enrollment.",
  "Please review my clearance before the enrollment deadline.",
  "I have completed all my library requirements.",
  "For scholarship renewal, thank you.",
  "Kindly sign my clearance for the current term.",
  undefined,
  undefined,
];

const REJECTION_NOTES = [
  "Please settle the ₱350.00 laboratory fee at the Accounting Office before requesting again.",
  "Your Exhibit (Index Card) attendance sheet is still missing. Submit it to the SAO.",
  "One library book is still on loan. Return it and request again.",
  "Your enrollment records need verification at the Registrar's Office.",
];

const CHECKLIST_TEMPLATES: Record<OfficeId, ChecklistItem[]> = {
  instructor: [
    { label: "Class attendance completed", done: true },
    { label: "Final project submitted", done: true },
  ],
  dean: [
    { label: "Program requirements completed", done: true },
    { label: "Dean's approval requested", done: true },
  ],
  library: [
    { label: "All borrowed books returned", done: true },
    { label: "Library fines settled", done: false, note: "A ₱25.00 overdue fine is still on record." },
  ],
  registrar: [
    { label: "Enrollment records verified", done: true },
    { label: "Student ID validated", done: true },
  ],
  accounting: [
    { label: "Tuition balance settled", done: true },
    { label: "Miscellaneous fees paid", done: false, note: "The ₱350.00 laboratory fee is still unpaid." },
  ],
  sao: [
    { label: "Organization clearance completed", done: true },
    { label: "Attendance sheet submitted", done: false, note: "The Exhibit (Index Card) attendance sheet is missing." },
  ],
};

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

function cloneChecklist(office: OfficeId): ChecklistItem[] {
  return CHECKLIST_TEMPLATES[office].map((item) => ({ ...item }));
}

function seedRequests(): ClearanceRequest[] {
  const now = Date.now();
  const requests: ClearanceRequest[] = [];

  // 84 pending rows keep the dashboard KPI, sidebar badge and table in sync.
  for (let index = 0; index < 84; index += 1) {
    const office = officeOrder[index % officeOrder.length];
    const student = makeStudent(index);
    const requestedAt = new Date(
      now - ((index % 14) * 24 + (index % 9) * 3 + 1) * 60 * 60 * 1000,
    ).toISOString();

    requests.push({
      id: `seed-${index + 1}`,
      ...student,
      office,
      requestedAt,
      studentNote: STUDENT_NOTES[index % STUDENT_NOTES.length],
      status: "pending",
      checklist: cloneChecklist(office),
    });
  }

  // Signed and rejected rows give the other tabs realistic content.
  for (let index = 0; index < 8; index += 1) {
    const office = officeOrder[index % officeOrder.length];
    const student = makeStudent(84 + index);
    const respondedAt = new Date(now - (index + 1) * 42 * 60 * 1000).toISOString();

    requests.push({
      id: `seed-signed-${index + 1}`,
      ...student,
      office,
      requestedAt: new Date(now - (index + 2) * 5 * 60 * 60 * 1000).toISOString(),
      status: "signed",
      respondedAt,
      signerName: officeSignerNames[office],
      checklist: cloneChecklist(office).map((item) => ({ ...item, done: true })),
    });
  }

  for (let index = 0; index < 4; index += 1) {
    const office = officeOrder[index % officeOrder.length];
    const student = makeStudent(92 + index);

    requests.push({
      id: `seed-rejected-${index + 1}`,
      ...student,
      office,
      requestedAt: new Date(now - (index + 3) * 9 * 60 * 60 * 1000).toISOString(),
      status: "rejected",
      respondedAt: new Date(now - (index + 1) * 3 * 60 * 60 * 1000).toISOString(),
      signerName: officeSignerNames[office],
      remarks: REJECTION_NOTES[index % REJECTION_NOTES.length],
      checklist: cloneChecklist(office),
    });
  }

  return requests;
}

function isChecklistItem(value: unknown): value is ChecklistItem {
  return (
    isRecord(value) &&
    typeof value.label === "string" &&
    typeof value.done === "boolean" &&
    (value.note === undefined || typeof value.note === "string")
  );
}

function normalizeRequest(value: unknown): ClearanceRequest | null {
  if (!isRecord(value)) return null;
  if (
    typeof value.id !== "string" ||
    typeof value.studentName !== "string" ||
    typeof value.studentId !== "string" ||
    typeof value.office !== "string" ||
    (value.status !== "pending" && value.status !== "signed" && value.status !== "rejected")
  ) {
    return null;
  }

  return {
    id: value.id,
    studentName: value.studentName,
    studentId: value.studentId,
    program: typeof value.program === "string" ? value.program : "BS Information Technology",
    section: typeof value.section === "string" ? value.section : "BSIT 3-A",
    yearLevel: typeof value.yearLevel === "string" ? value.yearLevel : "3rd Year",
    email: typeof value.email === "string" ? value.email : "",
    office: value.office as OfficeId,
    requestedAt:
      typeof value.requestedAt === "string" ? value.requestedAt : new Date().toISOString(),
    studentNote: typeof value.studentNote === "string" ? value.studentNote : undefined,
    status: value.status,
    respondedAt: typeof value.respondedAt === "string" ? value.respondedAt : undefined,
    signerName: typeof value.signerName === "string" ? value.signerName : undefined,
    signatureImage:
      typeof value.signatureImage === "string" ? value.signatureImage : undefined,
    remarks: typeof value.remarks === "string" ? value.remarks : undefined,
    checklist: Array.isArray(value.checklist)
      ? value.checklist.filter(isChecklistItem)
      : [],
    live: value.live === true,
  };
}

function readStoredAdminRequests(): ClearanceRequest[] {
  const stored = readJson(ADMIN_REQUESTS_KEY, null);

  if (Array.isArray(stored)) {
    const normalized = stored
      .map(normalizeRequest)
      .filter((request): request is ClearanceRequest => request !== null);
    if (normalized.length > 0) return normalized;
  }

  const seeded = seedRequests();
  writeJson(ADMIN_REQUESTS_KEY, seeded);
  return seeded;
}

function readAdminRequests(): ClearanceRequest[] {
  return [
    ...buildLiveRequests(),
    ...readStoredAdminRequests().filter((request) => request.live !== true),
  ];
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

function isAppNotification(value: unknown): value is AppNotification {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.message === "string" &&
    typeof value.createdAt === "string" &&
    typeof value.read === "boolean" &&
    (value.type === "info" || value.type === "success" || value.type === "warning")
  );
}

function readStudentNotifications(): AppNotification[] {
  const stored = readJson(CLEARANCE_NOTIFICATIONS_KEY, null);
  return Array.isArray(stored) ? stored.filter(isAppNotification) : [];
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
/* Decisions                                                           */
/* ------------------------------------------------------------------ */

type Decision =
  | { kind: "approve"; signature: SignaturePayload }
  | { kind: "reject"; rejection: RejectPayload };

/**
 * Signature flow (staff side):
 *   draw / type / upload -> base64 PNG (SignaturePadModal)
 *   -> this function -> cpc.online-clearance.v1
 *   -> the student portal reads the same record and renders the image.
 */
async function applyDecision(
  ids: string[],
  decision: Decision,
): Promise<ClearanceRequest[]> {
  const all = readAdminRequests();
  const targets = all.filter((request) => ids.includes(request.id));

  if (targets.length === 0) return wait([]);

  const stored = readStoredAdminRequests();
  const now = new Date().toISOString();
  const updated: ClearanceRequest[] = [];

  const studentState = readStudentClearance();
  const studentOffices = studentState.offices.map((office) => ({ ...office }));
  let studentChanged = false;

  for (const target of targets) {
    const approved = decision.kind === "approve";
    const respondedAt = approved ? decision.signature.signedAt : decision.rejection.respondedAt;
    const signerName = approved ? decision.signature.signerName : decision.rejection.signerName;
    const signatureImage = approved ? decision.signature.image : undefined;
    const remarks = approved ? undefined : decision.rejection.remarks;

    if (target.live) {
      const office = studentOffices.find((entry) => entry.office === target.office);
      if (!office) continue;

      office.status = approved ? "signed" : "rejected";
      office.respondedAt = respondedAt || now;
      office.signerName = signerName;
      office.signatureImage = signatureImage;
      office.remarks = remarks;
      studentChanged = true;

      updated.push({
        ...target,
        status: approved ? "signed" : "rejected",
        respondedAt: respondedAt || now,
        signerName,
        signatureImage,
        remarks,
      });
      continue;
    }

    const index = stored.findIndex((request) => request.id === target.id);
    if (index === -1) continue;

    const next: ClearanceRequest = {
      ...stored[index],
      status: approved ? "signed" : "rejected",
      respondedAt: respondedAt || now,
      signerName,
      signatureImage,
      remarks,
    };
    stored[index] = next;
    updated.push(next);
  }

  if (studentChanged) {
    const cleared = studentOffices.every((office) => office.status === "signed");
    const nextState: ClearanceState = {
      ...studentState,
      offices: studentOffices,
      dateCleared: cleared ? (studentState.dateCleared ?? now) : null,
    };
    writeStudentClearance(nextState);

    // Notify the student feed read by the clearance page.
    const studentNotifications = readStudentNotifications();
    const newStudentNotifications: AppNotification[] = targets
      .filter((target) => target.live)
      .map((target) => ({
        id: crypto.randomUUID(),
        message:
          decision.kind === "approve"
            ? `${OFFICE_LABELS[target.office]} signed your clearance.`
            : `${OFFICE_LABELS[target.office]} needs action: ${decision.rejection.remarks}`,
        type: decision.kind === "approve" ? "success" : "warning",
        createdAt: now,
        read: false,
        officeId: target.office,
      }));

    if (newStudentNotifications.length > 0) {
      writeJson(CLEARANCE_NOTIFICATIONS_KEY, [
        ...newStudentNotifications,
        ...studentNotifications,
      ].slice(0, 30));
    }
  }

  writeJson(ADMIN_REQUESTS_KEY, stored);

  const adminNotifications = readAdminNotifications();
  const newAdminNotifications: AdminNotification[] = targets.map((target) => ({
    id: crypto.randomUUID(),
    message:
      decision.kind === "approve"
        ? `${target.studentName}'s ${OFFICE_LABELS[target.office]} clearance was signed.`
        : `${target.studentName}'s ${OFFICE_LABELS[target.office]} clearance needs action.`,
    type: decision.kind === "approve" ? "success" : "warning",
    createdAt: now,
    read: false,
    href: "/admin/clearance-requests",
  }));

  writeJson(ADMIN_NOTIFICATIONS_KEY, [
    ...newAdminNotifications,
    ...adminNotifications,
  ].slice(0, 30));

  const activity = readActivity();
  const newActivity: ActivityItem[] = targets.map((target) => ({
    id: crypto.randomUUID(),
    type: "clearance",
    message:
      decision.kind === "approve"
        ? `${OFFICE_LABELS[target.office]} clearance signed for ${target.studentName}`
        : `${OFFICE_LABELS[target.office]} requested changes from ${target.studentName}`,
    actor:
      decision.kind === "approve"
        ? decision.signature.signerName
        : decision.rejection.signerName,
    student: {
      id: target.studentId,
      name: target.studentName,
      program: target.program,
      section: target.section,
      yearLevel: target.yearLevel,
      email: target.email,
    },
    status: decision.kind === "approve" ? "completed" : "pending",
    createdAt: now,
    href: "/admin/clearance-requests",
  }));

  writeJson(ADMIN_ACTIVITY_KEY, [...newActivity, ...activity].slice(0, 40));

  return wait(updated, WRITE_DELAY);
}

export async function approveRequest(
  requestId: string,
  signature: SignaturePayload,
): Promise<ClearanceRequest | null> {
  const [updated] = await applyDecision([requestId], { kind: "approve", signature });
  return updated ?? null;
}

export async function rejectRequest(
  requestId: string,
  rejection: RejectPayload,
): Promise<ClearanceRequest | null> {
  const [updated] = await applyDecision([requestId], { kind: "reject", rejection });
  return updated ?? null;
}

export async function bulkApproveRequests(
  requestIds: string[],
  signature: SignaturePayload,
): Promise<ClearanceRequest[]> {
  return applyDecision(requestIds, { kind: "approve", signature });
}

/* ------------------------------------------------------------------ */
/* Notifications, demo controls, saved signatures                      */
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

export async function resetDemoData(): Promise<void> {
  [
    ADMIN_REQUESTS_KEY,
    ADMIN_ACTIVITY_KEY,
    ADMIN_NOTIFICATIONS_KEY,
    CLEARANCE_STORAGE_KEY,
    CLEARANCE_NOTIFICATIONS_KEY,
  ].forEach(removeKey);
  return wait(undefined, WRITE_DELAY);
}

export async function generateSampleRequests(count = 6): Promise<ClearanceRequest[]> {
  const stored = readStoredAdminRequests();
  const now = Date.now();
  const generated: ClearanceRequest[] = [];

  for (let index = 0; index < count; index += 1) {
    const office = officeOrder[(index + Math.floor(now / 1000)) % officeOrder.length];
    const student = makeStudent(300 + index + (now % 17));

    generated.push({
      id: crypto.randomUUID(),
      ...student,
      office,
      requestedAt: new Date(now - index * 60 * 1000).toISOString(),
      studentNote: "Sample request generated from demo mode.",
      status: "pending",
      checklist: cloneChecklist(office),
    });
  }

  writeJson(ADMIN_REQUESTS_KEY, [...generated, ...stored]);

  const notifications = readAdminNotifications();
  writeJson(ADMIN_NOTIFICATIONS_KEY, [
    {
      id: crypto.randomUUID(),
      message: `${count} sample clearance requests were generated.`,
      type: "info",
      createdAt: new Date(now).toISOString(),
      read: false,
      href: "/admin/clearance-requests",
    },
    ...notifications,
  ].slice(0, 30));

  return wait(generated, WRITE_DELAY);
}

export function getSavedSignature(userId: string): SavedSignature | null {
  const stored = readJson(`${SAVED_SIGNATURE_PREFIX}.${userId}`, null);
  if (
    !isRecord(stored) ||
    typeof stored.image !== "string" ||
    typeof stored.signerName !== "string" ||
    typeof stored.savedAt !== "string"
  ) {
    return null;
  }

  const method: SignatureMethod =
    stored.method === "draw" || stored.method === "type" || stored.method === "upload"
      ? stored.method
      : "draw";

  return {
    image: stored.image,
    signerName: stored.signerName,
    method,
    savedAt: stored.savedAt,
  };
}

export function saveSignature(userId: string, signature: SavedSignature): void {
  writeJson(`${SAVED_SIGNATURE_PREFIX}.${userId}`, signature);
}

export function clearSavedSignature(userId: string): void {
  removeKey(`${SAVED_SIGNATURE_PREFIX}.${userId}`);
}
