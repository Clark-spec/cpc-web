import { useMemo, useSyncExternalStore } from "react";
import {
  activityMessageFor,
  buildInitialActivity,
  buildSampleApplications,
  getNewThisWeek,
  getProgramBreakdown,
  getStatusCounts,
  getWeeklyTrend,
  type EnrollmentActivityEntry,
  type EnrollmentApplication,
  type EnrollmentApplicationStatus,
  type EnrollmentProgramCode,
} from "@/services/enrollmentAdmin";

type EnrollmentStore = {
  applications: EnrollmentApplication[];
  activity: EnrollmentActivityEntry[];
};

/**
 * One in-memory store shared by every enrollment page, so a decision made on
 * "For Review" is still reflected when the user opens "Approved". The seed is
 * deterministic sample data; real continuing-student workflow submissions are
 * injected via `pushWorkflowApplication` when Guidance approves them.
 */
let store: EnrollmentStore | null = null;
const listeners = new Set<() => void>();

function getStore(): EnrollmentStore {
  if (!store) {
    const applications = buildSampleApplications();
    store = { applications, activity: buildInitialActivity(applications) };
  }
  return store;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function setStore(next: EnrollmentStore) {
  store = next;
  listeners.forEach((listener) => listener());
}

function decide(id: string, status: EnrollmentApplicationStatus) {
  const current = getStore();
  const target = current.applications.find((application) => application.id === id);
  if (!target || target.status === status) return;

  const at = new Date().toISOString();

  setStore({
    applications: current.applications.map((application) =>
      application.id === id ? { ...application, status, respondedAt: at } : application,
    ),
    activity: [
      {
        id: `local-${id}-${status}-${at}`,
        status,
        message: activityMessageFor(status),
        studentName: target.studentName,
        studentId: target.studentId,
        at,
      },
      ...current.activity,
    ].slice(0, 10),
  });
}

const approve = (id: string) => decide(id, "approved");
const reject = (id: string) => decide(id, "rejected");

// ── Workflow bridge ─────────────────────────────────────────────────────────
// Called by the enrollment workflow service when a real continuing student
// reaches a milestone. This keeps the two pipelines in sync without coupling
// the student-facing UI to the admin store.

export type WorkflowApplicationPayload = {
  studentId: string;
  studentName: string;
  programCode: EnrollmentProgramCode;
  program: string;
  yearLevel: string;
  email: string;
  status: EnrollmentApplicationStatus;
  note: string;
};

/**
 * Injects or updates a real workflow student in the admin applications store.
 * Safe to call multiple times with the same `studentId` — subsequent calls
 * update the existing record instead of adding a duplicate.
 */
export function pushWorkflowApplication(payload: WorkflowApplicationPayload): void {
  const current = getStore();
  const existingIndex = current.applications.findIndex(
    (app) => app.studentId === payload.studentId,
  );
  const at = new Date().toISOString();

  const application: EnrollmentApplication = {
    id: `WF-${payload.studentId}`,
    studentName: payload.studentName,
    studentId: payload.studentId,
    programCode: payload.programCode,
    program: payload.program,
    yearLevel: payload.yearLevel,
    email: payload.email,
    submittedAt: existingIndex >= 0
      ? current.applications[existingIndex].submittedAt
      : at,
    status: payload.status,
    note: payload.note,
    requirements: [
      { label: "Masterlist Verification", submitted: true },
      { label: "Online Clearance (6 offices)", submitted: true },
      { label: "Enrollment Form", submitted: true },
      { label: "Screening Committee Approval", submitted: true },
      { label: "Guidance Counselor Approval", submitted: payload.status !== "pending" },
    ],
    respondedAt: payload.status === "approved" ? at : undefined,
  };

  const nextApplications =
    existingIndex >= 0
      ? current.applications.map((app, i) => (i === existingIndex ? application : app))
      : [application, ...current.applications];

  setStore({
    applications: nextApplications,
    activity: [
      {
        id: `wf-activity-${payload.studentId}-${payload.status}-${at}`,
        status: payload.status,
        message: activityMessageFor(payload.status),
        studentName: payload.studentName,
        studentId: payload.studentId,
        at,
      },
      ...current.activity,
    ].slice(0, 10),
  });
}

/**
 * Local state for the enrollment pages.
 *
 * Derived counts, charts and the activity feed are recomputed from the same
 * array, so every surface stays in sync.
 */
export function useEnrollmentApplications() {
  const snapshot = useSyncExternalStore(subscribe, getStore, getStore);

  const counts = useMemo(() => getStatusCounts(snapshot.applications), [snapshot.applications]);
  const newThisWeek = useMemo(
    () => getNewThisWeek(snapshot.applications),
    [snapshot.applications],
  );
  const programs = useMemo(
    () => getProgramBreakdown(snapshot.applications),
    [snapshot.applications],
  );
  const trend = useMemo(() => getWeeklyTrend(snapshot.applications), [snapshot.applications]);

  return {
    applications: snapshot.applications,
    activity: snapshot.activity.slice(0, 5),
    counts,
    newThisWeek,
    programs,
    trend,
    total: snapshot.applications.length,
    approve,
    reject,
  };
}
