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

  let stats: DashboardStat[] = [];

  if (user.role === "admin") {
    stats = [
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
  } else if (user.role === "registrar") {
    stats = [
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
        label: "Registrar Clearance",
        value: pendingClearance,
        change: 4,
        trend: "up",
        href: "/admin/clearance-requests",
        sparkline: sparklineFor(pendingClearance, [12, 10, 9, 8, 6, 2, 0]),
      },
      {
        id: "requests",
        label: "Service Requests",
        value: openRequests,
        change: 0,
        trend: "flat",
        href: "/admin/service-requests",
        sparkline: [42, 41, 43, 40, 39, 39, openRequests],
      },
      {
        id: "corrections",
        label: "Profile Corrections",
        value: 8,
        change: -2,
        trend: "down",
        href: "/admin/students/profile-corrections",
        sparkline: [14, 12, 11, 10, 9, 8, 8],
      },
    ];
  } else if (user.role === "dean_cs" || user.role === "dean_edu" || user.role === "dean_hm") {
    const programPrefix =
      user.role === "dean_cs" ? "BSIT" : user.role === "dean_edu" ? "BEED" : "BSHM";

    stats = [
      {
        id: "clearance",
        label: `${programPrefix} Clearance`,
        value: pendingClearance,
        change: 5,
        trend: "up",
        href: "/admin/clearance-requests",
        sparkline: sparklineFor(pendingClearance, [10, 8, 7, 5, 4, 1, 0]),
      },
      {
        id: "schedules",
        label: `${programPrefix} Sections`,
        value: 4,
        change: 0,
        trend: "flat",
        href: "/admin/academics/class-schedules",
        sparkline: [4, 4, 4, 4, 4, 4, 4],
      },
      {
        id: "complaints",
        label: "Department Concerns",
        value: 3,
        change: -1,
        trend: "down",
        href: "/admin/support/complaints",
        sparkline: [5, 4, 4, 3, 3, 3, 3],
      },
      {
        id: "requests",
        label: "Service Requests",
        value: openRequests,
        change: 0,
        trend: "flat",
        href: "/admin/service-requests",
        sparkline: [42, 41, 43, 40, 39, 39, openRequests],
      },
    ];
  } else if (user.role === "instructor") {
    stats = [
      {
        id: "clearance",
        label: "Adviser Clearance",
        value: pendingClearance,
        change: 2,
        trend: "up",
        href: "/admin/clearance-requests",
        sparkline: sparklineFor(pendingClearance, [6, 5, 4, 3, 2, 1, 0]),
      },
      {
        id: "signed",
        label: "Signed Today",
        value: signedToday,
        change: 8,
        trend: "up",
        href: "/admin/clearance-requests",
        sparkline: sparklineFor(signedToday, [2, 3, 4, 5, 6, 7, 0]),
      },
      {
        id: "schedules",
        label: "Assigned Classes",
        value: 2,
        change: 0,
        trend: "flat",
        href: "/admin/academics/class-schedules",
        sparkline: [2, 2, 2, 2, 2, 2, 2],
      },
      {
        id: "loads",
        label: "Teaching Load Units",
        value: 18,
        change: 0,
        trend: "flat",
        href: "/admin/academics/class-schedules",
        sparkline: [18, 18, 18, 18, 18, 18, 18],
      },
    ];
  } else if (user.role === "sao") {
    stats = [
      {
        id: "clearance",
        label: "SAO Clearance",
        value: pendingClearance,
        change: 4,
        trend: "up",
        href: "/admin/clearance-requests",
        sparkline: sparklineFor(pendingClearance, [12, 11, 9, 7, 5, 2, 0]),
      },
      {
        id: "complaints",
        label: "Student Complaints",
        value: activeComplaints,
        change: -3,
        trend: "down",
        href: "/admin/support/complaints",
        sparkline: [18, 17, 16, 15, 14, 13, activeComplaints],
      },
      {
        id: "requests",
        label: "Service Requests",
        value: openRequests,
        change: 0,
        trend: "flat",
        href: "/admin/service-requests",
        sparkline: [42, 41, 43, 40, 39, 39, openRequests],
      },
      {
        id: "signed",
        label: "Signed Today",
        value: signedToday,
        change: 6,
        trend: "up",
        href: "/admin/clearance-requests",
        sparkline: sparklineFor(signedToday, [4, 5, 5, 6, 7, 8, 0]),
      },
    ];
  } else {
    // Library and Accounting office staff
    const officeName = user.role === "library" ? "Library" : "Accounting";
    const totalProcessed = signedToday + rejectedClearance;
    stats = [
      {
        id: "clearance",
        label: `${officeName} Clearance`,
        value: pendingClearance,
        change: 3,
        trend: "up",
        href: "/admin/clearance-requests",
        sparkline: sparklineFor(pendingClearance, [10, 8, 7, 5, 3, 1, 0]),
      },
      {
        id: "signed",
        label: "Signed Today",
        value: signedToday,
        change: 5,
        trend: "up",
        href: "/admin/clearance-requests",
        sparkline: sparklineFor(signedToday, [2, 3, 4, 5, 5, 6, 0]),
      },
      {
        id: "rejected",
        label: "Office Holds",
        value: rejectedClearance,
        change: 0,
        trend: "flat",
        href: "/admin/clearance-requests",
        sparkline: sparklineFor(rejectedClearance, [1, 1, 1, 0, 0, 0, 0]),
      },
      {
        id: "requests",
        label: "Total Processed",
        value: totalProcessed,
        change: 4,
        trend: "up",
        href: "/admin/clearance-requests",
        sparkline: sparklineFor(totalProcessed, [3, 4, 5, 5, 6, 7, 0]),
      },
    ];
  }

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

