import type {
  AdminUser,
  ClearanceRequest,
  DashboardStat,
  DashboardStats,
  EnrollmentOverviewRow,
} from "@/types/admin";
import {
  resetClearanceDemo,
  simulateStudentRequest,
} from "@/services/clearanceAdmin";
import {
  ADMIN_ACTIVITY_KEY,
  ADMIN_NOTIFICATIONS_KEY,
  WRITE_DELAY,
  removeKey,
  wait,
  writeJson,
} from "./storage";
import { readAdminRequests, visibleRequests } from "./clearanceAdapter";
import { readAdminNotifications } from "./notifications";

export function isToday(value: string | undefined): boolean {
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

export function sparklineFor(value: number, offsets: number[]): number[] {
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
  writeJson(
    ADMIN_NOTIFICATIONS_KEY,
    [
      {
        id: crypto.randomUUID(),
        message: `${generated.length} sample clearance requests were generated.`,
        type: "info",
        createdAt: new Date().toISOString(),
        read: false,
        href: "/admin/clearance-requests",
      },
      ...notifications,
    ].slice(0, 30),
  );

  return wait(generated, WRITE_DELAY);
}

