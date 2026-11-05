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
} from "@/data/enrollmentApplications";

type EnrollmentStore = {
  applications: EnrollmentApplication[];
  activity: EnrollmentActivityEntry[];
};

/**
 * One in-memory store shared by every enrollment page, so a decision made on
 * "For Review" is still reflected when the user opens "Approved". The seed is
 * deterministic sample data; nothing is written to a server or storage.
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
