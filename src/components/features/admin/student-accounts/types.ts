/** Programs offered in the sample student directory. */
export type CourseCode = "BSIT" | "BEED" | "BSED" | "BSHM";

export type YearLevel = 1 | 2 | 3 | 4;

export type StudentStatus = "active" | "inactive";

/** Directory row: the identity fields the registrar keeps on file. */
export type StudentRecord = {
  id: string;
  studentId: string;
  fullName: string;
  course: CourseCode;
  year: YearLevel;
  section: string;
  email: string;
  status: StudentStatus;
  contactNumber: string;
  address: string;
  guardianName: string;
  birthDate: string;
  enrolledAt: string;
};

export type CorrectionStatus = "pending" | "approved" | "rejected";

/** A student-submitted profile change waiting for the registrar. */
export type ProfileCorrectionRequest = {
  id: string;
  referenceNumber: string;
  studentId: string;
  studentName: string;
  course: CourseCode;
  year: YearLevel;
  section: string;
  email: string;
  field: string;
  currentValue: string;
  requestedValue: string;
  reason: string;
  attachmentName: string | null;
  submittedAt: string;
  status: CorrectionStatus;
  adminRemarks: string;
  reviewedAt: string | null;
};

export type AccountStatus = "active" | "disabled" | "locked";

/** Login record shown on the Account Settings page. */
export type StudentAccount = {
  id: string;
  studentId: string;
  name: string;
  email: string;
  course: CourseCode;
  year: YearLevel;
  section: string;
  status: AccountStatus;
  lastLogin: string;
};

export type StudentsFilters = {
  query: string;
  course: CourseCode | "all";
  year: YearLevel | "all";
  section: string;
  page: number;
  pageSize: number;
};

export type CorrectionStatusFilter = CorrectionStatus | "all";

export type CorrectionFilters = {
  query: string;
  status: CorrectionStatusFilter;
  course: CourseCode | "all";
  from: string;
  to: string;
  page: number;
  pageSize: number;
};

export type AccountStatusFilter = AccountStatus | "all";

export type AccountFilters = {
  query: string;
  status: AccountStatusFilter;
  course: CourseCode | "all";
  page: number;
  pageSize: number;
};

/** Payload the correction modal hands back to the page. */
export type CorrectionDecision = {
  status: "approved" | "rejected";
  adminRemarks: string;
};

/** The three row actions that ask for confirmation. */
export type AccountActionKind = "reset" | "toggle" | "unlock";
