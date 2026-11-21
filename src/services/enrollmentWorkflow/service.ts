import type {
  AuditLogEntry,
  DepartmentCode,
  DepartmentSchedule,
  EnrollmentFormRecord,
  EnrollmentSubjectItem,
  MasterlistRecord,
  QueueOfficeId,
  QueueTicket,
  StudentEnrollmentSession,
  YearGroup,
} from "@/types/enrollmentWorkflow";
import {
  CURRICULUM_CATALOG,
  SEED_DEPARTMENT_SCHEDULES,
  SEED_MASTERLIST,
  SEED_SESSIONS,
} from "./seedData";
import {
  pushWorkflowApplication,
  type WorkflowApplicationPayload,
} from "@/components/features/admin/enrollment/useEnrollmentApplications";
import { recordAdminNotification } from "@/services/admin/notifications";
import { recordAdminActivity } from "@/services/admin/activity";
import {
  recordStudentNotification,
  reconcileAllEnrollmentNotifications,
} from "@/services/notifications/studentNotificationService";

const KEY_MASTERLIST = "cpc:enrollment:masterlist:v1";
const KEY_SESSIONS = "cpc:enrollment:sessions:v1";
const KEY_SCHEDULES = "cpc:enrollment:schedules:v1";
const KEY_QUEUE_TICKETS = "cpc:enrollment:queue_tickets:v1";
const KEY_CORRECTIONS = "cpc:enrollment:corrections:v1";
const KEY_AUDIT_LOG = "cpc:enrollment:audit_log:v1";

const CHANNEL_NAME = "cpc-enrollment-queue";

function getBroadcastChannel(): BroadcastChannel | null {
  if (typeof window !== "undefined" && "BroadcastChannel" in window) {
    return new BroadcastChannel(CHANNEL_NAME);
  }
  return null;
}

export function notifyQueueChange(): void {
  const channel = getBroadcastChannel();
  if (channel) {
    try {
      channel.postMessage({ type: "UPDATE", at: new Date().toISOString() });
      channel.close();
    } catch {}
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new Event("cpc:queue:change"));
  }
}

export function subscribeToEnrollmentQueue(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  const onStorage = (event: StorageEvent) => {
    if (event.key && event.key.startsWith("cpc:enrollment:")) {
      callback();
    }
  };

  const onLocal = () => {
    callback();
  };

  window.addEventListener("storage", onStorage);
  window.addEventListener("cpc:queue:change", onLocal);
  let channel: BroadcastChannel | null = null;
  if ("BroadcastChannel" in window) {
    channel = new BroadcastChannel(CHANNEL_NAME);
    channel.onmessage = () => callback();
  }

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener("cpc:queue:change", onLocal);
    channel?.close();
  };
}

/* ------------------------------------------------------------- Audit trail */

export function recordAuditLog(entry: Omit<AuditLogEntry, "id" | "createdAt">): void {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(KEY_AUDIT_LOG);
    const list: AuditLogEntry[] = raw ? JSON.parse(raw) : [];
    const newEntry: AuditLogEntry = {
      ...entry,
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
    };
    window.localStorage.setItem(KEY_AUDIT_LOG, JSON.stringify([newEntry, ...list].slice(0, 200)));
  } catch {}
}

export function getAuditLog(): AuditLogEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY_AUDIT_LOG);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/* -------------------------------------------------------------- Masterlist */

export function getMasterlist(): MasterlistRecord[] {
  if (typeof window === "undefined") return SEED_MASTERLIST;
  try {
    const raw = window.localStorage.getItem(KEY_MASTERLIST);
    if (!raw) {
      window.localStorage.setItem(KEY_MASTERLIST, JSON.stringify(SEED_MASTERLIST));
      return SEED_MASTERLIST;
    }
    const stored: MasterlistRecord[] = JSON.parse(raw);
    const existingIds = new Set(stored.map((s) => s.studentIdNo.toLowerCase()));
    const missing = SEED_MASTERLIST.filter((s) => !existingIds.has(s.studentIdNo.toLowerCase()));
    if (missing.length > 0) {
      const merged = [...stored, ...missing];
      window.localStorage.setItem(KEY_MASTERLIST, JSON.stringify(merged));
      return merged;
    }
    return stored;
  } catch {
    return SEED_MASTERLIST;
  }
}

/** Adds the registrar-created account to this browser's enrollment cache. */
export function registerContinuingStudent(
  studentId: string,
  name: string,
  section: string,
): MasterlistRecord {
  const existing = getMasterlist().find((item) => item.studentIdNo.toLowerCase() === studentId.toLowerCase());
  if (existing) return existing;

  const normalizedSection = section.trim().toUpperCase();
  const department = (normalizedSection.match(/\b(BSIT|BEED|BSHM)\b/)?.[1] ?? "BSIT") as DepartmentCode;
  const yearLevel = Number(normalizedSection.match(/(?:^|\s|-)([1-4])(?:\s*-\s*[A-Z]|\s*[A-Z])?$/)?.[1] ?? 2);
  const currentYear = new Date().getFullYear() - (new Date().getMonth() < 7 ? 1 : 0);
  const record: MasterlistRecord = {
    studentIdNo: studentId,
    name: name.trim(),
    department,
    course: {
      BSIT: "BS Information Technology",
      BEED: "Bachelor of Elementary Education",
      BSHM: "BS Hospitality Management",
    }[department],
    yearLevel,
    semester: 2,
    standing: "regular",
    lastTermEnrolled: `${currentYear - 1}-${currentYear} 2nd Semester`,
    isEligible: true,
  };
  return cacheContinuingStudentRecord(record);
}

export function cacheContinuingStudentRecord(record: MasterlistRecord): MasterlistRecord {
  if (typeof window === "undefined") return record;
  const list = getMasterlist();
  const next = [record, ...list.filter((item) => item.studentIdNo.toLowerCase() !== record.studentIdNo.toLowerCase())];
  window.localStorage.setItem(KEY_MASTERLIST, JSON.stringify(next));
  notifyQueueChange();
  return record;
}

export function checkEligibility(studentId: string): {
  eligible: boolean;
  record?: MasterlistRecord;
  reason?: string;
} {
  const list = getMasterlist();
  const match = list.find((item) => item.studentIdNo === studentId || item.studentIdNo.toLowerCase() === studentId.toLowerCase());
  if (!match) {
    return {
      eligible: false,
      reason:
        "Student record not found in the official Registrar continuing students masterlist. New students and transferees must report to the Registrar in person.",
    };
  }

  if (!match.isEligible) {
    return {
      eligible: false,
      record: match,
      reason:
        match.ineligibleReason ??
        "Student is ineligible for continuing online enrollment. Only students from 1st Year (2nd Semester) to 4th Year enrolled last term are permitted to enroll online.",
    };
  }

  return { eligible: true, record: match };
}

/* --------------------------------------------------------------- Schedules */

export function getDepartmentSchedules(): DepartmentSchedule[] {
  if (typeof window === "undefined") return SEED_DEPARTMENT_SCHEDULES;
  try {
    const raw = window.localStorage.getItem(KEY_SCHEDULES);
    if (!raw) {
      window.localStorage.setItem(KEY_SCHEDULES, JSON.stringify(SEED_DEPARTMENT_SCHEDULES));
      return SEED_DEPARTMENT_SCHEDULES;
    }
    return JSON.parse(raw);
  } catch {
    return SEED_DEPARTMENT_SCHEDULES;
  }
}

export function updateDepartmentSchedule(id: string, patch: Partial<DepartmentSchedule>): void {
  if (typeof window === "undefined") return;
  const list = getDepartmentSchedules();
  const updated = list.map((item) => (item.id === id ? { ...item, ...patch } : item));
  window.localStorage.setItem(KEY_SCHEDULES, JSON.stringify(updated));
  notifyQueueChange();
}

/* ------------------------------------------------------------- Corrections */

export interface VerificationCorrection {
  id: string;
  studentId: string;
  studentName: string;
  department: DepartmentCode;
  field: string;
  requestedValue: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  remarks?: string;
  submittedAt: string;
}

export function submitCorrectionRequest(
  studentId: string,
  details: { field: string; requestedValue: string; reason: string },
): void {
  if (typeof window === "undefined") return;
  const { record } = checkEligibility(studentId);
  const raw = window.localStorage.getItem(KEY_CORRECTIONS);
  const list: VerificationCorrection[] = raw ? JSON.parse(raw) : [];

  const item: VerificationCorrection = {
    id: `corr-${Date.now()}`,
    studentId,
    studentName: record?.name ?? studentId,
    department: record?.department ?? "BSIT",
    field: details.field,
    requestedValue: details.requestedValue,
    reason: details.reason,
    status: "pending",
    submittedAt: new Date().toISOString(),
  };

  window.localStorage.setItem(KEY_CORRECTIONS, JSON.stringify([item, ...list]));
  recordAuditLog({
    actorId: studentId,
    actorName: record?.name ?? studentId,
    actorRole: "student",
    action: "Requested verification correction",
    target: details.field,
    remarks: details.reason,
  });

  recordAdminNotification({
    title: "Detail Correction Request",
    message: `${record?.name ?? studentId} requested to correct ${details.field} to "${details.requestedValue}".`,
    type: "warning",
    href: "/registrar/verification",
    targetRole: "registrar",
  });
  recordAdminActivity({
    type: "enrollment",
    status: "pending",
    message: `${record?.name ?? studentId} requested correction for ${details.field}`,
    actor: record?.name ?? studentId,
    href: "/registrar/verification",
  });

  notifyQueueChange();
}

export function getCorrectionRequests(): VerificationCorrection[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY_CORRECTIONS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function resolveCorrectionRequest(id: string, action: "approved" | "rejected", remarks: string, actor: string): void {
  if (typeof window === "undefined") return;
  const list = getCorrectionRequests();
  const target = list.find((item) => item.id === id);
  if (!target) return;

  const updated = list.map((item) => (item.id === id ? { ...item, status: action, remarks } : item));
  window.localStorage.setItem(KEY_CORRECTIONS, JSON.stringify(updated));

  // If approved and it affects masterlist, update masterlist and student session
  if (action === "approved") {
    const ml = getMasterlist();
    const updatedMl = ml.map((st) => {
      if (st.studentIdNo === target.studentId) {
        if (target.field.toLowerCase().includes("year")) {
          const y = parseInt(target.requestedValue, 10);
          if (!isNaN(y)) return { ...st, yearLevel: y };
        }
        if (target.field.toLowerCase().includes("standing")) {
          const std = target.requestedValue.toLowerCase().includes("irreg") ? "irregular" : "regular";
          return { ...st, standing: std as "regular" | "irregular" };
        }
        if (target.field.toLowerCase().includes("department")) {
          return { ...st, department: target.requestedValue.toUpperCase() as DepartmentCode };
        }
      }
      return st;
    });
    window.localStorage.setItem(KEY_MASTERLIST, JSON.stringify(updatedMl));

    // Update active student session if exists
    try {
      const sessions = getAllSessions();
      if (sessions[target.studentId]) {
        const updatedStudent = updatedMl.find((s) => s.studentIdNo === target.studentId);
        if (updatedStudent) {
          sessions[target.studentId].student = updatedStudent;
          saveStudentSession(sessions[target.studentId]);
        }
      }
    } catch {}
  }

  recordAuditLog({
    actorId: actor,
    actorName: actor,
    actorRole: "registrar",
    action: `${action === "approved" ? "Approved" : "Rejected"} verification correction`,
    target: `${target.studentName} (${target.field})`,
    remarks,
  });
  notifyQueueChange();
}

/* -------------------------------------------------------- Student Sessions */

function buildInitialSession(student: MasterlistRecord): StudentEnrollmentSession {
  const subjects =
    CURRICULUM_CATALOG[student.department]?.[student.yearLevel] ??
    CURRICULUM_CATALOG.BSIT[2];

  const totalUnits = subjects.reduce((sum, item) => sum + item.units, 0);

  return {
    student,
    steps: {
      verification: {
        id: "step-0",
        stepName: "verification",
        label: "Verification & Standing",
        office: "Registrar",
        status: "PENDING",
      },
      clearance: {
        id: "step-1",
        stepName: "clearance",
        label: "Online Clearance Check",
        office: "Online Clearance",
        status: "LOCKED",
      },
      enrollment_form: {
        id: "step-2",
        stepName: "enrollment_form",
        label: "Enrollment Form",
        office: "Student",
        status: "LOCKED",
      },
      screening: {
        id: "step-3",
        stepName: "screening",
        label: "Screening Committee Approval",
        office: "Department Dean",
        status: "LOCKED",
      },
      guidance: {
        id: "step-4",
        stepName: "guidance",
        label: "Guidance Office Approval",
        office: "Guidance",
        status: "LOCKED",
      },
      queue_ticket: {
        id: "step-5",
        stepName: "queue_ticket",
        label: "Department Queue Number",
        office: "Registrar / Automated",
        status: "LOCKED",
      },
      clinic: {
        id: "step-6",
        stepName: "clinic",
        label: "Clinic Health Assessment",
        office: "Clinic",
        status: "LOCKED",
      },
      accounting: {
        id: "step-7",
        stepName: "accounting",
        label: "Accounting Fee Assessment",
        office: "Accounting",
        status: "LOCKED",
      },
      registrar: {
        id: "step-8",
        stepName: "registrar",
        label: "Registrar Final Registration",
        office: "Registrar",
        status: "LOCKED",
      },
    },
    form: {
      id: `form-${student.studentIdNo}`,
      studentId: student.studentIdNo,
      studentName: student.name,
      department: student.department,
      course: student.course,
      yearLevel: student.yearLevel,
      term: "2nd Semester 2025-2026",
      type: student.standing === "regular" ? "preprinted" : "blank",
      standing: student.standing,
      subjects: student.standing === "regular" ? subjects : [],
      totalUnits: student.standing === "regular" ? totalUnits : 0,
      status: "DRAFT",
    },
  };
}

export function getAllSessions(): Record<string, StudentEnrollmentSession> {
  if (typeof window === "undefined") return { ...SEED_SESSIONS };
  try {
    const raw = window.localStorage.getItem(KEY_SESSIONS);
    if (!raw) {
      window.localStorage.setItem(KEY_SESSIONS, JSON.stringify(SEED_SESSIONS));
      return { ...SEED_SESSIONS };
    }
    const stored: Record<string, StudentEnrollmentSession> = JSON.parse(raw);
    let changed = false;
    for (const [id, session] of Object.entries(SEED_SESSIONS)) {
      if (!stored[id]) {
        stored[id] = session;
        changed = true;
      }
    }
    if (changed) {
      window.localStorage.setItem(KEY_SESSIONS, JSON.stringify(stored));
    }
    return stored;
  } catch {
    return { ...SEED_SESSIONS };
  }
}

export function getStudentSession(studentId: string): StudentEnrollmentSession {
  const sessions = getAllSessions();
  if (sessions[studentId]) {
    const record = checkEligibility(studentId).record;
    if (record && JSON.stringify(sessions[studentId].student) !== JSON.stringify(record)) {
      const current = sessions[studentId];
      const prescribedSubjects = CURRICULUM_CATALOG[record.department]?.[record.yearLevel] ?? [];
      const refreshed = {
        ...current,
        student: record,
        form: {
          ...current.form,
          studentName: record.name,
          department: record.department,
          course: record.course,
          yearLevel: record.yearLevel,
          term: "2nd Semester 2025-2026",
          ...(current.form.status === "DRAFT" && record.standing === "regular"
            ? { subjects: prescribedSubjects, totalUnits: prescribedSubjects.reduce((sum, item) => sum + item.units, 0) }
            : {}),
        },
      };
      saveStudentSession(refreshed);
      return refreshed;
    }
    if (sessions[studentId].form.status === "SUBMITTED" || sessions[studentId].form.status === "APPROVED") {
      reconcileAllEnrollmentNotifications();
    }
    return sessions[studentId];
  }

  const { record } = checkEligibility(studentId);
  const student = record ?? {
    studentIdNo: studentId,
    name: /^\d{8}$/.test(studentId) ? "Student record unavailable" : "Maria Santos",
    department: "BSIT" as DepartmentCode,
    course: "BS Information Technology",
    yearLevel: /^\d{8}$/.test(studentId) ? 1 : 2,
    semester: 2,
    standing: "regular" as const,
    lastTermEnrolled: "2025-2026 2nd Semester",
    isEligible: !/^\d{8}$/.test(studentId),
  };

  const initial = buildInitialSession(student);
  if (typeof window !== "undefined") {
    sessions[studentId] = initial;
    window.localStorage.setItem(KEY_SESSIONS, JSON.stringify(sessions));
  }
  return initial;
}

export function saveStudentSession(session: StudentEnrollmentSession): void {
  if (typeof window === "undefined") return;
  const sessions = getAllSessions();
  sessions[session.student.studentIdNo] = session;
  window.localStorage.setItem(KEY_SESSIONS, JSON.stringify(sessions));
  notifyQueueChange();
}

/* ---------------------------------------------------- Step Transitions */

export function confirmVerification(studentId: string): StudentEnrollmentSession {
  const session = getStudentSession(studentId);
  session.steps.verification.status = "APPROVED";
  session.steps.verification.updatedAt = new Date().toISOString();

  // Unlock Step 1: Clearance
  session.steps.clearance.status = "PENDING";
  saveStudentSession(session);

  recordAuditLog({
    actorId: studentId,
    actorName: session.student.name,
    actorRole: "student",
    action: "Confirmed student details and standing",
    target: "Verification Step 0",
  });

  return session;
}

export function checkClearanceStatus(studentId: string): {
  cleared: boolean;
  offices: Array<{ office: string; label: string; status: string; signer?: string }>;
} {
  const requiredOffices = [
    { office: "instructor", label: "Program Adviser" },
    { office: "dean", label: "Dean" },
    { office: "library", label: "College Library" },
    { office: "accounting", label: "Accounting Office" },
    { office: "sao", label: "Student Affairs Office" },
    { office: "registrar", label: "Registrar's Office" },
  ];

  // Read the student's own Online Clearance record. A missing record or
  // unsigned office must remain pending; never assume a demo clearance is signed.
  if (typeof window !== "undefined") {
    try {
      const clearanceRaw = window.localStorage.getItem("cpc:clearance:records");
      if (clearanceRaw) {
        const records = JSON.parse(clearanceRaw);
        const myRecord = Array.isArray(records)
          ? records.find((r: { studentId?: string; studentIdNo?: string }) => r.studentId === studentId || r.studentIdNo === studentId)
          : null;

        if (myRecord && Array.isArray(myRecord.offices)) {
          const offices = requiredOffices.map((required) => {
            const saved = myRecord.offices.find((office: { office?: string }) => office?.office === required.office);
            return {
              ...required,
              status: saved?.status ?? "not_requested",
              signer: saved?.signerName,
            };
          });
          return { cleared: offices.every((office) => office.status === "signed"), offices };
        }
      }
    } catch {}
  }

  return {
    cleared: false,
    offices: requiredOffices.map((office) => ({ ...office, status: "not_requested" })),
  };
}

export function approveClearanceStep(studentId: string): StudentEnrollmentSession {
  const session = getStudentSession(studentId);
  session.steps.clearance.status = "APPROVED";
  session.steps.clearance.updatedAt = new Date().toISOString();

  // Unlock Step 2: Enrollment Form
  session.steps.enrollment_form.status = "PENDING";
  saveStudentSession(session);

  recordAuditLog({
    actorId: studentId,
    actorName: session.student.name,
    actorRole: "student",
    action: "Attached verified e-signed clearance",
    target: "Clearance Step 1",
  });

  return session;
}

export function saveEnrollmentFormSubjects(
  studentId: string,
  subjects: EnrollmentSubjectItem[],
): StudentEnrollmentSession {
  const session = getStudentSession(studentId);
  session.form.subjects = subjects;
  session.form.totalUnits = subjects.reduce((sum, item) => sum + item.units, 0);
  saveStudentSession(session);
  return session;
}

export function submitEnrollmentForm(studentId: string): StudentEnrollmentSession {
  const session = getStudentSession(studentId);
  session.steps.enrollment_form.status = "APPROVED";
  session.steps.enrollment_form.updatedAt = new Date().toISOString();

  session.form.status = "SUBMITTED";
  session.form.submittedAt = new Date().toISOString();
  if (session.signatureRequests) delete session.signatureRequests.screening;

  // Unlock Step 3: Screening Committee
  session.steps.screening.status = "PENDING";
  saveStudentSession(session);

  recordAuditLog({
    actorId: studentId,
    actorName: session.student.name,
    actorRole: "student",
    action: "Submitted enrollment form for Screening Committee review",
    target: `Form ${session.form.id} (${session.form.totalUnits} units)`,
  });

  // Notify Student
  recordStudentNotification(studentId, {
    id: `enrollment-submitted-${session.form.id || studentId}`,
    title: "Enrollment Form Submitted",
    message: `Your subjects for ${session.form.term} (${session.form.totalUnits} units) have been submitted and are queued for Screening Committee review.`,
    type: "info",
    href: "/student/queue",
  });

  // Notify Admin & Screening Committee
  {
    const _dept = session.student.department as string;
    const _targetRole =
      _dept === "BSIT" ? "dean_cs" : _dept === "BEED" ? "dean_edu" : "dean_hm";
    recordAdminNotification({
      id: `admin-screening-new-${session.form.id || studentId}`,
      title: "New Enrollment Form Submitted",
      message: `${session.student.name} (${session.student.department}) submitted their enrollment form (${session.form.totalUnits} units). Queued for Screening Committee review.`,
      type: "info",
      href: "/committee/screening",
      department: _dept,
      targetRole: _targetRole,
    });
  }
  recordAdminActivity({
    type: "enrollment",
    status: "new",
    message: `${session.student.name} submitted enrollment form for screening (${session.student.course})`,
    actor: session.student.name,
    href: "/committee/screening",
  });

  // Immediately bridge into the Admin Applications table as "for-review"
  const dept = session.student.department;
  const programMap: Record<string, { name: string; code: "BSIT" | "BSBA" | "BEED" | "BSHM" }> = {
    BSIT: { name: "BS Information Technology", code: "BSIT" },
    BEED: { name: "Bachelor of Elementary Education", code: "BEED" },
    BSHM: { name: "BS Hospitality Management", code: "BSHM" },
  };
  const prog = programMap[dept] ?? { name: dept, code: "BSIT" as const };
  const yearSuffix = ["", "1st", "2nd", "3rd", "4th"];
  const yearLabel = `${yearSuffix[session.student.yearLevel] ?? session.student.yearLevel} Year`;
  pushWorkflowApplication({
    studentId: session.student.studentIdNo,
    studentName: session.student.name,
    programCode: prog.code,
    program: prog.name,
    yearLevel: yearLabel,
    email: session.student.email ?? `${session.student.studentIdNo}@student.cpc.edu.ph`,
    status: "for-review",
    note: `Submitted online form (${session.form.totalUnits} units). Queued for Dean review.`,
  });

  return session;
}

/* --------------------------------------------------- Screening & Guidance */

export function normalizeDepartment(dept?: string): DepartmentCode {
  if (!dept) return "BSIT";
  const d = dept.toUpperCase();
  if (d.includes("COMPUTER") || d.includes("BSIT") || d.includes("CCS") || d.includes("IT")) return "BSIT";
  if (d.includes("TEACHER") || d.includes("EDUCATION") || d.includes("BEED") || d.includes("BSED")) return "BEED";
  if (d.includes("HOSPITALITY") || d.includes("BSHM") || d.includes("CHM") || d.includes("HM")) return "BSHM";
  if (dept === "BSIT" || dept === "BEED" || dept === "BSHM") return dept;
  return "BSIT";
}

export function getScreeningQueue(deanDepartment?: DepartmentCode | string): EnrollmentFormRecord[] {
  const sessions = getAllSessions();
  const forms: EnrollmentFormRecord[] = [];
  for (const session of Object.values(sessions)) {
    if (!session || !session.student) continue;

    const screeningStatus = session.steps?.screening?.status;
    const formStatus = session.form?.status;

    // Qualifies for screening if screening is explicitly PENDING or form submitted without final screening decision
    const isPendingScreening =
      screeningStatus === "PENDING" ||
      (formStatus === "SUBMITTED" && screeningStatus !== "APPROVED" && screeningStatus !== "RESUBMIT");

    if (isPendingScreening) {
      const studentDept = normalizeDepartment(session.student.department || session.form?.department);
      const targetDept =
        deanDepartment && deanDepartment !== "all" ? normalizeDepartment(deanDepartment) : undefined;

      if (!targetDept || studentDept === targetDept) {
        const defaultSubjects =
          CURRICULUM_CATALOG[studentDept]?.[session.student.yearLevel] || CURRICULUM_CATALOG.BSIT[2];
        const subjects = session.form?.subjects?.length ? session.form.subjects : defaultSubjects;
        const totalUnits =
          session.form?.totalUnits || subjects.reduce((sum, item) => sum + item.units, 0);

        const formRecord: EnrollmentFormRecord = {
          ...session.form,
          id: session.form?.id || `form-${session.student.studentIdNo}`,
          studentId: session.student.studentIdNo,
          studentName: session.student.name,
          department: studentDept,
          course: session.student.course,
          yearLevel: session.student.yearLevel,
          term: session.form?.term || "2nd Semester 2025-2026",
          type: session.student.standing === "regular" ? "preprinted" : "blank",
          standing: session.student.standing,
          subjects,
          totalUnits,
          status: "SUBMITTED",
        };
        forms.push(formRecord);
      }
    }
  }
  return forms;
}

export function approveScreening(
  studentId: string,
  actor: string,
  actorRole?: string,
  feePaidVerified = false,
): StudentEnrollmentSession {
  if (!feePaidVerified) {
    throw new Error("Confirm the ₱100 department fee was paid before approving the Dean & Screening signature.");
  }
  const session = getStudentSession(studentId);
  const studentDept = normalizeDepartment(session.student.department || session.form?.department);

  if (actorRole === "dean_cs" && studentDept !== "BSIT") {
    throw new Error("Unauthorized: Dean of Computer Studies can only approve BSIT students.");
  }
  if (actorRole === "dean_edu" && studentDept !== "BEED") {
    throw new Error("Unauthorized: Dean of Teacher Education can only approve BEED students.");
  }
  if (actorRole === "dean_hm" && studentDept !== "BSHM") {
    throw new Error("Unauthorized: Dean of Hospitality Management can only approve BSHM students.");
  }

  session.steps.screening.status = "APPROVED";
  session.steps.screening.updatedBy = actor;
  session.steps.screening.updatedAt = new Date().toISOString();
  session.screeningFeePaidAt = session.steps.screening.updatedAt;
  session.screeningFeeVerifiedBy = actor;

  // Unlock Step 4: Guidance
  session.steps.guidance.status = "PENDING";
  saveStudentSession(session);

  recordAuditLog({
    actorId: actor,
    actorName: actor,
    actorRole: "screening_committee",
    action: "Approved student enrollment form subjects",
    target: `Student ${session.student.name} (${studentId})`,
  });

  // Notify Student
  recordStudentNotification(studentId, {
    id: `screening-approved-${session.form.id || studentId}`,
    title: "Screening Review Approved",
    message: `Your enrollment subjects have been verified and approved by the Screening Committee. Forwarded for Guidance review.`,
    type: "success",
    href: "/student/queue",
  });

  recordAdminNotification({
    title: "Screening Approved",
    message: `${actor} approved subjects for ${session.student.name} (${session.student.department}). Queued for Guidance review.`,
    type: "success",
    href: "/guidance/queue",
    targetRole: "guidance",
  });
  recordAdminActivity({
    type: "enrollment",
    status: "pending",
    message: `${actor} approved course load for ${session.student.name}`,
    actor,
    href: "/guidance/queue",
  });

  return session;
}

export function referScreening(
  studentId: string,
  remarks: string,
  actor: string,
  actorRole?: string,
): StudentEnrollmentSession {
  const session = getStudentSession(studentId);
  const studentDept = normalizeDepartment(session.student.department || session.form?.department);

  if (actorRole === "dean_cs" && studentDept !== "BSIT") {
    throw new Error("Unauthorized: Dean of Computer Studies can only refer BSIT students.");
  }
  if (actorRole === "dean_edu" && studentDept !== "BEED") {
    throw new Error("Unauthorized: Dean of Teacher Education can only refer BEED students.");
  }
  if (actorRole === "dean_hm" && studentDept !== "BSHM") {
    throw new Error("Unauthorized: Dean of Hospitality Management can only refer BSHM students.");
  }

  session.steps.screening.status = "RESUBMIT";
  session.steps.screening.remarks = remarks;
  session.steps.screening.updatedBy = actor;
  session.steps.screening.updatedAt = new Date().toISOString();

  // Return to student for resubmission
  session.steps.enrollment_form.status = "RESUBMIT";
  session.form.status = "RESUBMIT";
  session.form.screeningRemarks = remarks;
  saveStudentSession(session);

  recordAuditLog({
    actorId: actor,
    actorName: actor,
    actorRole: "screening_committee",
    action: "Referred enrollment form back to student",
    target: `Student ${session.student.name} (${studentId})`,
    remarks,
  });

  // Notify Student
  recordStudentNotification(studentId, {
    title: "Enrollment Form Returned",
    message: `Screening Committee requested changes: "${remarks}". Please review and update your enrollment form.`,
    type: "warning",
    href: "/student/enrollment-form",
  });

  {
    const _dept2 = session.student.department as string;
    const _targetRole2 =
      _dept2 === "BSIT" ? "dean_cs" : _dept2 === "BEED" ? "dean_edu" : "dean_hm";
    recordAdminNotification({
      title: "Enrollment Form Referred",
      message: `${actor} referred enrollment form back to ${session.student.name}: "${remarks}".`,
      type: "warning",
      href: "/committee/screening",
      department: _dept2,
      targetRole: _targetRole2,
    });
  }
  recordAdminActivity({
    type: "enrollment",
    status: "pending",
    message: `${actor} referred ${session.student.name}'s form: "${remarks}"`,
    actor,
    href: "/committee/screening",
  });

  return session;
}

export function getGuidanceQueue(): EnrollmentFormRecord[] {
  const sessions = getAllSessions();
  const forms: EnrollmentFormRecord[] = [];
  for (const session of Object.values(sessions)) {
    if (session.steps.guidance.status === "PENDING") {
      forms.push(session.form);
    }
  }
  return forms;
}

export function approveGuidance(studentId: string, actor: string): QueueTicket {
  const session = getStudentSession(studentId);
  session.steps.guidance.status = "APPROVED";
  session.steps.guidance.updatedBy = actor;
  session.steps.guidance.updatedAt = new Date().toISOString();
  session.form.status = "APPROVED";

  // Automatically issue Queue Ticket (Step 5)
  const ticket = issueQueueTicket(session);
  session.steps.queue_ticket.status = "APPROVED";
  session.steps.queue_ticket.updatedAt = new Date().toISOString();
  session.ticket = ticket;

  // Unlock Clinic step
  session.steps.clinic.status = "PENDING";
  saveStudentSession(session);

  recordAuditLog({
    actorId: actor,
    actorName: actor,
    actorRole: "guidance",
    action: "Approved clearance and enrollment; issued queue ticket",
    target: `Ticket ${ticket.number} for ${session.student.name}`,
  });

  // Notify Student
  recordStudentNotification(studentId, {
    id: `ticket-issued-${ticket.number}`,
    title: "Queue Ticket Issued",
    message: `Guidance approved your enrollment! Physical Queue Ticket #${ticket.number} issued. Proceed to Clinic (Station 1).`,
    type: "info",
    href: "/student/queue",
  });

  recordAdminNotification({
    title: "Queue Ticket Issued",
    message: `Guidance issued ticket ${ticket.number} for ${session.student.name} (${session.student.department}). Scheduled on ${ticket.scheduleDate} (${ticket.timeBlock}).`,
    type: "info",
    href: "/clinic/queue",
    targetRole: "clinic",
  });
  recordAdminActivity({
    type: "enrollment",
    status: "pending",
    message: `Queue ticket ${ticket.number} minted for ${session.student.name}`,
    actor,
    href: "/clinic/queue",
  });

  // ── Bridge: inject into Admin Enrollment Applications table ────────────
  // The admin's /enrollment/applications table is seeded with sample data.
  // Real workflow submissions appear there once Guidance approves so the
  // Registrar can see them in the pipeline. Status "for-review" because the
  // student still has F2F steps (Clinic → Accounting → Registrar) to clear.
  const dept = session.student.department;
  const programMap: Record<string, { name: string; code: "BSIT" | "BSBA" | "BEED" | "BSHM" }> = {
    BSIT: { name: "BS Information Technology", code: "BSIT" },
    BEED: { name: "Bachelor of Elementary Education", code: "BEED" },
    BSHM: { name: "BS Hospitality Management", code: "BSHM" },
  };
  const prog = programMap[dept] ?? { name: dept, code: "BSIT" as const };
  const yearSuffix = ["", "1st", "2nd", "3rd", "4th"];
  const yearLabel = `${yearSuffix[session.student.yearLevel] ?? session.student.yearLevel} Year`;

  const payload: WorkflowApplicationPayload = {
    studentId: session.student.studentIdNo,
    studentName: session.student.name,
    programCode: prog.code,
    program: prog.name,
    yearLevel: yearLabel,
    email: session.student.email ?? `${session.student.studentIdNo}@student.cpc.edu.ph`,
    status: "for-review",
    note: `Continuing student — Guidance approved. Queue ticket ${ticket.number} issued. F2F steps pending.`,
  };
  pushWorkflowApplication(payload);

  return ticket;
}

export type EnrollmentSignatureOffice = "screening" | "guidance" | "clinic" | "registrar" | "accounting";

/** Sends a student signature request to the office that owns the current step. */
export function requestEnrollmentSignature(
  studentId: string,
  office: EnrollmentSignatureOffice,
): StudentEnrollmentSession {
  const session = getStudentSession(studentId);
  const canRequest: Record<EnrollmentSignatureOffice, boolean> = {
    screening: session.form.status === "SUBMITTED" && session.steps.screening.status !== "APPROVED",
    guidance: session.steps.screening.status === "APPROVED" && session.steps.guidance.status !== "APPROVED",
    clinic: session.steps.guidance.status === "APPROVED" && session.steps.clinic.status !== "APPROVED",
    registrar: session.steps.screening.status === "APPROVED" && session.steps.guidance.status === "APPROVED" && session.steps.clinic.status === "APPROVED" && session.steps.registrar.status !== "APPROVED",
    accounting: session.steps.screening.status === "APPROVED" && session.steps.guidance.status === "APPROVED" && session.steps.clinic.status === "APPROVED" && session.steps.accounting.status !== "APPROVED",
  };

  if (!canRequest[office]) {
    throw new Error("This signature request is not available yet. Complete the previous enrollment steps first.");
  }
  if (session.signatureRequests?.[office] && session.steps[office].status !== "RESUBMIT") {
    throw new Error("Your request has already been sent to this office.");
  }

  const officeDetails: Record<EnrollmentSignatureOffice, { label: string; targetRole: string; href: string }> = {
    screening: {
      label: "Dean & Screening Committee",
      targetRole: session.student.department === "BSIT" ? "dean_cs" : session.student.department === "BEED" ? "dean_edu" : "dean_hm",
      href: "/committee/screening",
    },
    guidance: { label: "Guidance Office", targetRole: "guidance", href: "/guidance/queue" },
    clinic: { label: "Clinic", targetRole: "clinic", href: "/clinic/queue" },
    registrar: { label: "Registrar", targetRole: "registrar", href: "/registrar/queue" },
    accounting: { label: "Accounting", targetRole: "accounting", href: "/accounting/queue" },
  };
  const details = officeDetails[office];
  const requestedAt = new Date().toISOString();
  session.signatureRequests = { ...session.signatureRequests, [office]: requestedAt };
  saveStudentSession(session);

  recordAdminNotification({
    title: `Signature Requested: ${details.label}`,
    message: `${session.student.name} (${session.student.studentIdNo}) requested an enrollment signature from ${details.label}.`,
    type: "info",
    href: details.href,
    department: session.student.department,
    targetRole: details.targetRole,
  });
  recordStudentNotification(studentId, {
    id: `enrollment-signature-${office}-${studentId}-${requestedAt}`,
    title: `Request sent to ${details.label}`,
    message: `Your signature request was sent to ${details.label}.`,
    type: "success",
    href: "/student/queue",
  });

  return session;
}

/* ------------------------------------------------------------- Queue System */

export function getQueueTickets(): QueueTicket[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY_QUEUE_TICKETS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveQueueTickets(tickets: QueueTicket[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY_QUEUE_TICKETS, JSON.stringify(tickets));
  notifyQueueChange();
}

function issueQueueTicket(session: StudentEnrollmentSession): QueueTicket {
  const tickets = getQueueTickets();
  const dept = session.student.department;
  const yearGroup: YearGroup = session.student.yearLevel <= 2 ? "1-2" : "3-4";

  // Find department schedule
  const schedules = getDepartmentSchedules();
  const sched =
    schedules.find((s) => s.department === dept && s.yearGroup === yearGroup) ??
    schedules[0];

  // Count existing tickets for department today
  const existingForDept = tickets.filter((t) => t.department === dept).length;
  const nextNum = String(existingForDept + 1).padStart(3, "0");
  const ticketNumber = `${dept}-${nextNum}`;

  const ticket: QueueTicket = {
    id: `ticket-${Date.now()}`,
    studentId: session.student.studentIdNo,
    studentName: session.student.name,
    department: dept,
    yearLevel: session.student.yearLevel,
    yearGroup,
    number: ticketNumber,
    issuedAt: new Date().toISOString(),
    scheduleId: sched.id,
    scheduleDate: sched.date,
    timeBlock: `${sched.startTime} - ${sched.endTime}`,
    qrPayload: JSON.stringify({
      t: ticketNumber,
      id: session.student.studentIdNo,
      dept,
      date: sched.date,
    }),
    clinic: {
      office: "clinic",
      status: "WAITING",
      recalls: 0,
      position: tickets.filter((t) => t.clinic.status === "WAITING").length + 1,
    },
    accounting: {
      office: "accounting",
      status: "WAITING",
      recalls: 0,
      position: tickets.filter((t) => t.accounting.status === "WAITING").length + 1,
    },
    registrar: {
      office: "registrar",
      status: "WAITING",
      recalls: 0,
      position: tickets.filter((t) => t.registrar.status === "WAITING").length + 1,
    },
  };

  saveQueueTickets([...tickets, ticket]);
  return ticket;
}

export function callNextTicket(office: QueueOfficeId, ticketId?: string, actor?: string): QueueTicket | null {
  const tickets = getQueueTickets();
  let targetIndex = -1;

  if (ticketId) {
    targetIndex = tickets.findIndex((t) => t.id === ticketId);
  } else {
    // Find first WAITING or MOVED_TO_LAST ticket
    targetIndex = tickets.findIndex(
      (t) => t[office].status === "WAITING" || t[office].status === "MOVED_TO_LAST",
    );
  }

  if (targetIndex < 0) return null;

  // Mark currently SERVING as DONE or WAITING
  tickets.forEach((t) => {
    if (t[office].status === "SERVING") {
      t[office].status = "DONE";
      t[office].doneAt = new Date().toISOString();
    }
  });

  const ticket = tickets[targetIndex];
  ticket[office].status = "SERVING";
  ticket[office].calledAt = new Date().toISOString();
  ticket[office].servedBy = actor;

  saveQueueTickets(tickets);

  recordAuditLog({
    actorId: actor ?? office,
    actorName: actor ?? office,
    actorRole: office,
    action: `Called ticket ${ticket.number} to counter`,
    target: `${ticket.studentName} (${office.toUpperCase()})`,
  });

  return ticket;
}

export function recallTicket(office: QueueOfficeId, ticketId: string, actor?: string): QueueTicket | null {
  const tickets = getQueueTickets();
  const ticket = tickets.find((t) => t.id === ticketId);
  if (!ticket) return null;

  ticket[office].recalls = (ticket[office].recalls || 0) + 1;
  ticket[office].calledAt = new Date().toISOString();

  // If called more than 3 times, auto move to last
  if (ticket[office].recalls >= 3 && ticket[office].status !== "MOVED_TO_LAST") {
    ticket[office].status = "MOVED_TO_LAST";
  } else {
    ticket[office].status = "CALLED";
  }

  saveQueueTickets(tickets);

  recordAuditLog({
    actorId: actor ?? office,
    actorName: actor ?? office,
    actorRole: office,
    action: `Recalled ticket ${ticket.number} (Recall #${ticket[office].recalls})`,
    target: `${ticket.studentName} (${office.toUpperCase()})`,
  });

  return ticket;
}

export function moveToLast(office: QueueOfficeId, ticketId: string, actor?: string): QueueTicket | null {
  const tickets = getQueueTickets();
  const ticket = tickets.find((t) => t.id === ticketId);
  if (!ticket) return null;

  ticket[office].status = "MOVED_TO_LAST";
  saveQueueTickets(tickets);

  recordAuditLog({
    actorId: actor ?? office,
    actorName: actor ?? office,
    actorRole: office,
    action: `Moved ticket ${ticket.number} to end of queue line`,
    target: `${ticket.studentName} (${office.toUpperCase()})`,
  });

  return ticket;
}

export function markDone(office: QueueOfficeId, ticketId: string, actor?: string): QueueTicket | null {
  const tickets = getQueueTickets();
  const ticket = tickets.find((t) => t.id === ticketId);
  if (!ticket) return null;

  ticket[office].status = "DONE";
  ticket[office].doneAt = new Date().toISOString();
  ticket[office].servedBy = actor;

  // Also update session steps
  const session = getStudentSession(ticket.studentId);
  session.steps[office].status = "APPROVED";
  session.steps[office].updatedBy = actor;
  session.steps[office].updatedAt = new Date().toISOString();

  // If Clinic done, unlock Accounting; if Accounting done, unlock Registrar
  if (office === "clinic") {
    session.steps.accounting.status = "PENDING";
    session.steps.registrar.status = "PENDING";
  }
  if (office === "accounting") session.steps.registrar.status = "PENDING";

  saveStudentSession(session);
  saveQueueTickets(tickets);

  recordAuditLog({
    actorId: actor ?? office,
    actorName: actor ?? office,
    actorRole: office,
    action: `Completed ${office.toUpperCase()} verification and sign-off`,
    target: `${ticket.studentName} (${ticket.number})`,
  });

  if (office === "clinic") {
    // Notify Student
    recordStudentNotification(ticket.studentId, {
      title: "Clinic Health Assessment Cleared",
      message: "Health check completed. Next station: Accounting (Station 2).",
      type: "success",
      href: "/student/queue",
    });

    recordAdminNotification({
      title: "Clinic Health Assessment Cleared",
      message: `${ticket.studentName} (${ticket.number}) cleared health check. Next station: Accounting.`,
      type: "info",
      href: "/accounting/queue",
      targetRole: "accounting",
    });
    recordAdminActivity({
      type: "enrollment",
      status: "pending",
      message: `${ticket.studentName} cleared Clinic health assessment`,
      actor: actor ?? "Clinic Officer",
      href: "/accounting/queue",
    });
  } else if (office === "accounting") {
    // Notify Student
    recordStudentNotification(ticket.studentId, {
      title: "Accounting Payment Validated",
      message: "Tuition & fees validated. Next station: Registrar for COR (Station 3).",
      type: "success",
      href: "/student/queue",
    });

    recordAdminNotification({
      title: "Accounting Payment Validated",
      message: `${ticket.studentName} (${ticket.number}) tuition & fees validated. Next station: Registrar for COR.`,
      type: "info",
      href: "/registrar/queue",
      targetRole: "registrar",
    });
    recordAdminActivity({
      type: "enrollment",
      status: "pending",
      message: `${ticket.studentName} cleared Accounting fee validation`,
      actor: actor ?? "Accounting Officer",
      href: "/registrar/queue",
    });
  } else if (office === "registrar") {
    // Notify Student
    recordStudentNotification(ticket.studentId, {
      id: `official-enrolled-${ticket.studentId}`,
      title: "Official Enrollment Confirmed!",
      message: `Congratulations ${ticket.studentName}! You are officially enrolled for ${session.form.term}. Your Certificate of Registration (COR) is ready.`,
      type: "success",
      href: "/student/queue",
    });

    recordAdminNotification({
      title: "Enrollment Finalized (COR Issued)",
      message: `${ticket.studentName} (${ticket.number}) has completed enrollment! Certificate of Registration issued.`,
      type: "success",
      href: "/admin/enrollment/approved",
      targetRole: "registrar",
    });
    recordAdminActivity({
      type: "enrollment",
      status: "completed",
      message: `COR issued for ${ticket.studentName} (${ticket.number})`,
      actor: actor ?? "Registrar",
      href: "/admin/enrollment/approved",
    });
  }

  // ── Bridge: flip admin enrollment status when Registrar completes Step 8 ──
  // When the Registrar marks the student Done, the enrollment is fully complete.
  // Update the admin applications table to "approved" so the Registrar dashboard
  // reflects the real completion rather than keeping it in "for-review".
  if (office === "registrar") {
    const dept = session.student.department;
    const programMap: Record<string, { name: string; code: "BSIT" | "BSBA" | "BEED" | "BSHM" }> = {
      BSIT: { name: "BS Information Technology", code: "BSIT" },
      BEED: { name: "Bachelor of Elementary Education", code: "BEED" },
      BSHM: { name: "BS Hospitality Management", code: "BSHM" },
    };
    const prog = programMap[dept] ?? { name: dept, code: "BSIT" as const };
    const yearSuffix = ["", "1st", "2nd", "3rd", "4th"];
    const yearLabel = `${yearSuffix[session.student.yearLevel] ?? session.student.yearLevel} Year`;
    pushWorkflowApplication({
      studentId: session.student.studentIdNo,
      studentName: session.student.name,
      programCode: prog.code,
      program: prog.name,
      yearLevel: yearLabel,
      email: session.student.email ?? `${session.student.studentIdNo}@student.cpc.edu.ph`,
      status: "approved",
      note: "Continuing student — All F2F stations cleared. COR issued by Registrar.",
    });
  }

  return ticket;
}

export function getQueueDisplay(): {
  clinic: { nowServing: QueueTicket | null; next: QueueTicket[] };
  accounting: { nowServing: QueueTicket | null; next: QueueTicket[] };
  registrar: { nowServing: QueueTicket | null; next: QueueTicket[] };
} {
  const tickets = getQueueTickets();

  const getOfficeQueue = (office: QueueOfficeId) => {
    const nowServing = tickets.find((t) => t[office].status === "SERVING" || t[office].status === "CALLED") ?? null;
    const next = tickets.filter(
      (t) => (t[office].status === "WAITING" || t[office].status === "MOVED_TO_LAST") && t.id !== nowServing?.id,
    );
    return { nowServing, next };
  };

  return {
    clinic: getOfficeQueue("clinic"),
    accounting: getOfficeQueue("accounting"),
    registrar: getOfficeQueue("registrar"),
  };
}
