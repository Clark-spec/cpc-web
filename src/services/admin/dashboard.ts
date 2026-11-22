import type { AdminUser, DashboardStat, DashboardStats, EnrollmentOverviewRow } from "@/types/admin";
import { getClearanceRequests } from "./clearanceAdapter";
import { getOfficeSignatureRequests } from "@/services/enrollmentWorkflow/database";
import { getAdminComplaints } from "@/services/complaints/admin";
import { listAdminServiceRequests } from "@/services/serviceRequests/adminApi";
import type { EnrollmentSignatureOffice } from "@/services/enrollmentWorkflow/service";

const ENROLLMENT_OFFICES: EnrollmentSignatureOffice[] = ["screening", "guidance", "clinic", "registrar", "accounting"];

function enrollmentOfficesForRole(role: AdminUser["role"]): EnrollmentSignatureOffice[] {
  if (role === "admin") return ENROLLMENT_OFFICES;
  if (role === "dean_cs" || role === "dean_edu" || role === "dean_hm") return ["screening"];
  if (role === "guidance" || role === "clinic" || role === "registrar" || role === "accounting") return [role];
  return [];
}

/** Count only pending Study Load signature requests assigned to this role. */
export async function getPendingEnrollmentSignatureCount(user: AdminUser): Promise<number> {
  const offices = enrollmentOfficesForRole(user.role);
  if (offices.length === 0) return 0;
  const results = await Promise.allSettled(offices.map((office) => getOfficeSignatureRequests(office)));
  return results.reduce((total, result, index) => {
    if (result.status !== "fulfilled") return total;
    const office = offices[index];
    return total + result.value.filter((session) => session.steps?.[office]?.status === "PENDING").length;
  }, 0);
}

export function isToday(value: string | undefined): boolean {
  if (!value) return false;
  const date = new Date(value);
  const now = new Date();
  return !Number.isNaN(date.getTime()) && date.toDateString() === now.toDateString();
}
export function sparklineFor(value: number): number[] { return Array(7).fill(value) as number[]; }
const stat = (id: DashboardStat["id"], label: string, value: number, href: string): DashboardStat => ({ id, label, value, change: 0, trend: "flat", href, sparkline: sparklineFor(value) });

export async function getDashboardStats(user: AdminUser): Promise<DashboardStats> {
  const [clearanceResult, serviceResult, complaintResult, enrollmentResult] = await Promise.allSettled([
    getClearanceRequests(user),
    listAdminServiceRequests({ page: 1, pageSize: 1, search: "", status: "all", serviceId: null, from: "", to: "" }),
    getAdminComplaints(),
    getPendingEnrollmentSignatureCount(user),
  ]);
  const requests = clearanceResult.status === "fulfilled" ? clearanceResult.value : [];
  const pendingClearance = requests.filter((request) => request.status === "pending").length;
  const signedToday = requests.filter((request) => request.status === "signed" && isToday(request.respondedAt)).length;
  const rejectedClearance = requests.filter((request) => request.status === "rejected").length;
  const pendingEnrollments = enrollmentResult.status === "fulfilled" ? enrollmentResult.value : 0;
  const openRequests = serviceResult.status === "fulfilled" ? serviceResult.value.summary.submitted + serviceResult.value.summary.under_review + serviceResult.value.summary.processing + serviceResult.value.summary.ready_for_release : 0;
  const activeComplaints = complaintResult.status === "fulfilled" ? complaintResult.value.filter((item) => item.status !== "resolved").length : 0;
  const cards: DashboardStat[] = [];
  if (["admin", "registrar"].includes(user.role)) {
    cards.push(stat("enrollments", "Enrollment Signature Queue", pendingEnrollments, "/admin/enrollment/applications"));
    cards.push(stat("clearance", "Pending Clearance", pendingClearance, "/admin/clearance-requests"));
    cards.push(stat("requests", "Open Service Requests", openRequests, "/admin/service-requests"));
    cards.push(stat("complaints", "Active Complaints", activeComplaints, "/admin/support/complaints"));
  } else {
    cards.push(stat("clearance", "Pending Clearance", pendingClearance, "/admin/clearance-requests"));
    if (["dean_cs", "dean_edu", "dean_hm", "guidance", "clinic"].includes(user.role)) cards.push(stat("enrollments", "Enrollment Signature Queue", pendingEnrollments, user.role === "guidance" ? "/guidance/queue" : user.role === "clinic" ? "/clinic/queue" : "/committee/screening"));
    cards.push(stat("signed", "Signed Today", signedToday, "/admin/clearance-requests"));
    cards.push(stat("rejected", "Returned Requests", rejectedClearance, "/admin/clearance-requests"));
  }
  return { pendingEnrollments, pendingClearance, openRequests, activeComplaints, signedToday, rejectedClearance, stats: cards, lastUpdated: new Date().toISOString() };
}

/** The application overview is empty until backed by saved enrollment records. */
export async function getEnrollmentOverview(): Promise<EnrollmentOverviewRow[]> { return []; }
