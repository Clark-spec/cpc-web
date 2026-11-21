/**
 * Online Enrollment System (Continuing Students) Types
 * Based on the Continuing Students Implementation Spec:
 * - 1st Year (2nd sem) to 4th Year, Regular & Irregular
 * - Steps:
 *    0. Verification (masterlist check)
 *    1. Clearance (e-signed clearance check)
 *    2. Enrollment form (Regular: preprinted; Irregular: blank form)
 *    3. Screening Committee / Dean approval
 *    4. Guidance approval
 *    5. Queue ticket issuance ([DEPT]-001)
 *    6. Clinic (F2F queue)
 *    7. Accounting (F2F queue)
 *    8. Registrar (F2F queue)
 */

export type DepartmentCode = "BSIT" | "BEED" | "BSHM";

export type YearGroup = "1-2" | "3-4";

export type StudentStanding = "regular" | "irregular";

export interface MasterlistRecord {
  studentIdNo: string;
  section?: string;
  name: string;
  department: DepartmentCode;
  course: string;
  yearLevel: number;
  semester: number;
  standing: StudentStanding;
  lastTermEnrolled: string; // e.g. "2025-2026 2nd Semester"
  isEligible: boolean; // continuing student: 1st yr 2nd sem to 4th yr, enrolled last term
  ineligibleReason?: string;
  email?: string;
  contactNumber?: string;
}

export type WorkflowStepName =
  | "verification"
  | "clearance"
  | "enrollment_form"
  | "screening"
  | "guidance"
  | "queue_ticket"
  | "clinic"
  | "accounting"
  | "registrar";

export type StepStatus =
  | "LOCKED"
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "RESUBMIT"
  | "SKIPPED";

export interface WorkflowStep {
  id: string;
  stepName: WorkflowStepName;
  label: string;
  office: string;
  status: StepStatus;
  updatedBy?: string;
  updatedAt?: string;
  remarks?: string;
  signatureImage?: string;
  signatureMethod?: "draw" | "type" | "upload";
  signatureLabel?: string;
}

export interface EnrollmentSubjectItem {
  id: string;
  code: string;
  title: string;
  units: number;
  schedule: string;
  room?: string;
  days?: string;
  roomSetA?: string;
  roomSetB?: string;
  active?: boolean;
  instructor?: string;
  status?: "enrolled" | "dropped";
}

export interface EnrollmentFormRecord {
  id: string;
  studentId: string;
  studentName: string;
  department: DepartmentCode;
  course: string;
  yearLevel: number;
  term: string; // e.g. "1st Semester 2026-2027"
  type: "preprinted" | "blank";
  standing: StudentStanding;
  subjects: EnrollmentSubjectItem[];
  totalUnits: number;
  status: "DRAFT" | "SUBMITTED" | "APPROVED" | "RESUBMIT";
  submittedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  screeningRemarks?: string;
  guidanceRemarks?: string;
}

export interface DepartmentSchedule {
  id: string;
  department: DepartmentCode;
  departmentName: string;
  term: string;
  date: string; // YYYY-MM-DD
  dayLabel: string; // e.g. "Monday, Nov 24, 2026"
  yearGroup: YearGroup;
  startTime: string; // e.g. "08:00 AM"
  endTime: string; // e.g. "12:00 PM"
  slots: number;
  remainingSlots: number;
}

export type QueueOfficeId = "clinic" | "accounting" | "registrar";

export type QueueTicketStatus =
  | "WAITING"
  | "CALLED"
  | "SERVING"
  | "DONE"
  | "MOVED_TO_LAST";

export interface QueueOfficeStatus {
  office: QueueOfficeId;
  status: QueueTicketStatus;
  recalls: number;
  calledAt?: string;
  doneAt?: string;
  position: number;
  servedBy?: string;
}

export interface QueueTicket {
  id: string;
  studentId: string;
  studentName: string;
  department: DepartmentCode;
  yearLevel: number;
  yearGroup: YearGroup;
  number: string; // e.g. "BSIT-001"
  issuedAt: string;
  scheduleId: string;
  scheduleDate: string;
  timeBlock: string;
  qrPayload: string;
  clinic: QueueOfficeStatus;
  accounting: QueueOfficeStatus;
  registrar: QueueOfficeStatus;
}

export interface AuditLogEntry {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: string;
  target: string;
  remarks?: string;
  createdAt: string;
}

export interface StudentEnrollmentSession {
  student: MasterlistRecord;
  steps: Record<WorkflowStepName, WorkflowStep>;
  form: EnrollmentFormRecord;
  ticket?: QueueTicket;
  signatureRequests?: Partial<Record<"screening" | "guidance" | "clinic" | "registrar" | "accounting", string>>;
  screeningFeePaidAt?: string;
  screeningFeeVerifiedBy?: string;
  clearance?: { offices: Array<{ office: string; status: string }> };
}
