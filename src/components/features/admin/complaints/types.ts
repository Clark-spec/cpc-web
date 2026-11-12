import type { ComplaintStatus } from "@/components/features/student/complaints/types";

/** Status vocabulary is shared with the student portal so both sides agree. */
export type { ComplaintStatus };

/**
 * Staff-side row: the student's complaint plus the identity and review fields
 * only the complaint desk sees. Mocks mirror the student `Complaint` shape and
 * add what the admin table and details modal need.
 */
export type AdminComplaintRow = {
  id: string;
  referenceNumber: string;
  studentName: string;
  studentId: string;
  program: string;
  yearLevel: string;
  email: string;
  category: string;
  subject: string;
  description: string;
  filedAt: string;
  status: ComplaintStatus;
  /** Anonymous records arrive without identity; the UI shows placeholders. */
  anonymous: boolean;
  attachmentName: string | null;
  adminRemarks: string;
  updatedAt: string | null;
  /** Staff member who last changed the status or remarks. */
  updatedByName?: string | null;
};

export type ComplaintStatusFilter = ComplaintStatus | "all";

export type ComplaintFilters = {
  query: string;
  status: ComplaintStatusFilter;
  category: string;
  from: string;
  to: string;
  page: number;
  pageSize: number;
};

/** What the details modal hands back to the page on save. */
export type ComplaintUpdate = {
  status: ComplaintStatus;
  adminRemarks: string;
};
