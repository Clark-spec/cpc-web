/**
 * Shared types for the admin / staff portal.
 *
 * The clearance types intentionally reuse the student feature's `OfficeId` and
 * `NotificationType` so both sides of the product speak exactly the same
 * vocabulary (and the same localStorage records).
 */
import type { NotificationType, OfficeId } from "@/types/clearance";

export type AdminRole =
  | "admin"
  | "registrar"
  | "dean_cs"   // Dean of Computer Studies (BSIT)
  | "dean_edu"  // Dean of Teacher Education (BEED)
  | "dean_hm"   // Dean of Hospitality Management (BSHM)
  | "library"
  | "accounting"
  | "sao"
  | "instructor";

export type AdminUser = {
  /** Stable mock id; also used to namespace the saved signature. */
  id: string;
  name: string;
  role: AdminRole;
  /** `null` for the admin, who sees every office. */
  office: OfficeId | null;
  initials: string;
  title: string;
  /**
   * Program names this dean is responsible for.
   * Only set for `dean_cs`, `dean_edu`, `dean_hm` roles.
   * `null` / undefined for all other roles.
   */
  homePrograms?: string[] | null;
};

export type ClearanceRequestStatus = "pending" | "signed" | "rejected";

export type ChecklistItem = {
  label: string;
  done: boolean;
  note?: string;
};

export type ClearanceRequest = {
  id: string;
  studentName: string;
  studentId: string;
  program: string;
  section: string;
  yearLevel: string;
  email: string;
  office: OfficeId;
  /** ISO date-time the student sent the request. */
  requestedAt: string;
  studentNote?: string;
  status: ClearanceRequestStatus;
  respondedAt?: string;
  signerName?: string;
  signatureImage?: string;
  remarks?: string;
  /** Context shown in the review modal (e.g. a missing attendance sheet). */
  checklist: ChecklistItem[];
  /** True when the row is backed by the live student clearance record. */
  live?: boolean;
};

export type TrendDirection = "up" | "down" | "flat";

export type DashboardStatId = "enrollments" | "clearance" | "requests" | "complaints";

export type DashboardStat = {
  id: DashboardStatId;
  label: string;
  value: number;
  change: number;
  trend: TrendDirection;
  href: string;
  sparkline: number[];
};

export type DashboardStats = {
  pendingEnrollments: number;
  pendingClearance: number;
  openRequests: number;
  activeComplaints: number;
  signedToday: number;
  rejectedClearance: number;
  stats: DashboardStat[];
  lastUpdated: string;
};

export type EnrollmentStatus =
  | "submitted"
  | "for-review"
  | "approved"
  | "needs-requirements";

export type EnrollmentOverviewRow = {
  status: EnrollmentStatus;
  label: string;
  count: number;
  /** Net change over the last 7 days (can be negative). */
  last7Days: number;
  href: string;
};

export type ActivityType = "enrollment" | "clearance" | "complaint" | "announcement";

export type ActivityStatus = "new" | "completed" | "pending" | "published";

export type ActivityStudent = {
  id: string;
  name: string;
  program: string;
  section: string;
  yearLevel: string;
  email: string;
};

export type ActivityItem = {
  id: string;
  type: ActivityType;
  message: string;
  actor: string;
  student?: ActivityStudent;
  status: ActivityStatus;
  createdAt: string;
  href?: string;
};

export type AdminNotification = {
  id: string;
  title?: string;
  message: string;
  type: NotificationType;
  createdAt: string;
  read: boolean;
  href?: string;
};

export type SignatureMethod = "draw" | "type" | "upload";

export type SignaturePayload = {
  image: string;
  signerName: string;
  office: OfficeId;
  signedAt: string;
};

export type SavedSignature = {
  image: string;
  signerName: string;
  method: SignatureMethod;
  savedAt: string;
};

export type RejectPayload = {
  remarks: string;
  signerName: string;
  office: OfficeId;
  respondedAt: string;
};

export type AdminBadgeKey =
  | "enrollment"
  | "clearance"
  | "complaints"
  | "profileCorrections";

export type AdminBadgeCounts = Record<AdminBadgeKey, number>;

export type AdminStatus =
  | ClearanceRequestStatus
  | EnrollmentStatus
  | ActivityStatus;
