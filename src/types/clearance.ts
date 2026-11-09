/**
 * Domain types for Online Clearance, shared by the student page and the staff
 * portal.
 *
 * SHARED-STORAGE CONTRACT: the student portal and the admin portal read and
 * write the same localStorage records (`cpc:clearance:records`, one
 * ClearanceRecord per studentId, always six offices). A student request flips
 * an office to "requested"; a staff decision writes status, signerName,
 * signatureImage, remarks and respondedAt back onto the same office, and the
 * other portal picks the change up from the `storage` event.
 */

export type OfficeId =
  | "instructor"
  | "dean"
  | "library"
  | "registrar"
  | "accounting"
  | "sao";

/** Lifecycle of a single office's signature request. */
export type RequestStatus = "not_requested" | "requested" | "signed" | "rejected";

export interface OfficeSignature {
  office: OfficeId;
  label: string;
  status: RequestStatus;
  /** ISO date-time the student sent the request. */
  requestedAt?: string;
  /** ISO date-time the office approved or rejected. */
  respondedAt?: string;
  /** Staff member who signed, e.g. "Prof. Dela Cruz". */
  signerName?: string;
  /** base64 / SVG / URL supplied by staff — display only. */
  signatureImage?: string;
  /** Optional message the student attached to the request. */
  studentNote?: string;
  /** Why the request was rejected / what is still missing. */
  remarks?: string;
}

/** The portal-wide notification shape, re-exported for clearance consumers. */
export type {
  AppNotification,
  NotificationType,
} from "@/components/context/NotificationContext";

export interface Subject {
  name: string;
  units: number;
  instructor: string;
}

export interface SaoEvent {
  title: string;
  attended: boolean;
  /** Explanation shown in the popover when `attended` is false. */
  note?: string;
}

export interface ClearanceHistoryItem {
  academicYear: string;
  semester: string;
  status: "Cleared";
  dateCleared: string;
  signatures: OfficeSignature[];
}

/** Demo student shown on Form 3 and the confirmation slip. */
export interface StudentProfile {
  name: string;
  studentId: string;
  yearLevel: string;
  course: string;
  program: string;
  academicYear: string;
  semester: string;
  term: "1st" | "2nd";
  graduating: boolean;
  /** Date printed on Form 3 (ISO date). */
  date: string;
  referenceNumber: string;
}

/** Everything the service persists for the clearance itself. */
export interface ClearanceState {
  offices: OfficeSignature[];
  history: ClearanceHistoryItem[];
  /** ISO date-time the clearance was completed, or null while in progress. */
  dateCleared: string | null;
  /** From the shared record once all six offices have signed. */
  referenceNumber?: string;
  /** False while the registrar keeps the clearance period closed. */
  periodOpen?: boolean;
}

/**
 * The durable, per-student clearance record. This is the unit both portals
 * share: the student page renders `offices` for its own `studentId`, and the
 * staff queue derives one row per student + office from it.
 */
export interface ClearanceRecord {
  studentId: string;
  studentName: string;
  section: string;
  program: string;
  yearLevel: string;
  term: string;
  academicYear: string;
  /** Always six entries, in Form 3 order. */
  offices: OfficeSignature[];
  subjects: Subject[];
  saoEvents: SaoEvent[];
  /** Generated once every office has signed. */
  referenceNumber?: string;
  completedAt?: string;
}

/** A single office's outstanding request for one student. */
export interface ClearanceRequestRow {
  /** `${studentId}:${office}` — stable across both portals. */
  id: string;
  studentId: string;
  studentName: string;
  section: string;
  program: string;
  yearLevel: string;
  term: string;
  academicYear: string;
  office: OfficeId;
  /** "requested" | "signed" | "rejected"; rows are never "not_requested". */
  status: RequestStatus;
  requestedAt?: string;
  respondedAt?: string;
  studentNote?: string;
  remarks?: string;
  signerName?: string;
  signatureImage?: string;
  isOverdue: boolean;
  ageHours: number;
}

/** Audit trail entry for one request. */
export interface TimelineEvent {
  id: string;
  requestId: string;
  at: string;
  actor: string;
  type:
    | "requested"
    | "cancelled"
    | "signed"
    | "rejected"
    | "revoked"
    | "reopened"
    | "note";
  detail?: string;
}

/** A staff member's stored signature, never visible to other staff. */
export interface SavedSignature {
  id: string;
  staffId: string;
  imageBase64: string;
  method: "draw" | "type" | "upload";
  label: string;
  isDefault: boolean;
  createdAt: string;
}

/** One office-specific verification shown in the review checklist. */
export interface OfficeCheckItem {
  id: string;
  label: string;
  result: "ok" | "issue" | "unknown";
  detail?: string;
  verifiedByStaff: boolean;
}

/** Admin-controlled clearance window and SLA settings. */
export interface ClearancePeriod {
  academicYear: string;
  term: string;
  opensAt: string;
  closesAt: string;
  /** When false the student side stops accepting new requests. */
  open: boolean;
  /** Requests older than this many days are overdue. */
  overdueDays: number;
}
