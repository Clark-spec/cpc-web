/**
 * Domain types for the student-side Online Clearance page.
 *
 * The staff/admin side is out of scope: offices sign through the mock service
 * (or a real API later), and the student only ever requests signatures.
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

export interface AppNotification {
  id: string;
  message: string;
  type: "info" | "success" | "warning";
  /** ISO date-time. */
  createdAt: string;
  read: boolean;
  /** Lets the bell scroll to (and highlight) the related office card. */
  officeId?: OfficeId;
}

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
}
