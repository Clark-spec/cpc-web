/**
 * Type definitions and master constants for enrollment applications.
 */

export type EnrollmentApplicationStatus =
  | "pending"
  | "for-review"
  | "needs-requirements"
  | "approved"
  | "rejected";

export type EnrollmentProgramCode = "BSIT" | "BSBA" | "BEED" | "BSHM";

export type EnrollmentStatusFilter = "all" | EnrollmentApplicationStatus;

export type EnrollmentRequirement = {
  label: string;
  submitted: boolean;
};

export type EnrollmentApplication = {
  id: string;
  studentName: string;
  studentId: string;
  programCode: EnrollmentProgramCode;
  program: string;
  yearLevel: string;
  email: string;
  /** ISO timestamp the applicant submitted the form. */
  submittedAt: string;
  status: EnrollmentApplicationStatus;
  /** Registrar-facing note; not a student comment. */
  note: string;
  requirements: EnrollmentRequirement[];
  respondedAt?: string;
};

export type EnrollmentActivityEntry = {
  id: string;
  status: EnrollmentApplicationStatus;
  message: string;
  studentName: string;
  studentId: string;
  /** ISO timestamp of the event. */
  at: string;
};

export type EnrollmentTrendPoint = {
  label: string;
  received: number;
  approved: number;
};

export type ProgramBreakdown = {
  code: EnrollmentProgramCode;
  name: string;
  shortName: string;
  count: number;
  share: number;
};

export const ENROLLMENT_PROGRAMS: Array<{
  code: EnrollmentProgramCode;
  name: string;
  shortName: string;
}> = [
  { code: "BSIT", name: "BS Information Technology", shortName: "Information Technology" },
  { code: "BSBA", name: "BS Business Administration", shortName: "Business Administration" },
  { code: "BEED", name: "BE Elementary Education", shortName: "Elementary Education" },
  { code: "BSHM", name: "BS Hospitality Management", shortName: "Hospitality Management" },
];

export const ENROLLMENT_STATUS_LABELS: Record<EnrollmentApplicationStatus, string> = {
  pending: "Pending",
  "for-review": "For Review",
  "needs-requirements": "Needs Requirements",
  approved: "Approved",
  rejected: "Rejected",
};

