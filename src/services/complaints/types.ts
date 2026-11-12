export type ComplaintStatus = "pending" | "in_review" | "resolved";

export type StudentComplaint = {
  id: string;
  referenceNumber: string;
  subject: string;
  category: string;
  description: string;
  filedAt: string;
  updatedAt: string;
  status: ComplaintStatus;
  anonymous: boolean;
  attachmentName: string | null;
  adminRemarks: string;
};

export type MyComplaintsResponse = {
  complaints: StudentComplaint[];
  canSubmit: boolean;
  nextAllowedAt: string | null;
  cooldownHours: number;
  serverTime: string;
};

export type AdminComplaint = {
  id: string;
  referenceNumber: string;
  subject: string;
  category: string;
  description: string;
  status: ComplaintStatus;
  anonymous: boolean;
  attachmentName: string | null;
  adminRemarks: string;
  filedAt: string;
  updatedAt: string;
  updatedByName: string | null;
  updatedByRole: string | null;
  studentName: string;
  studentId: string;
  program: string;
  yearLevel: string;
  email: string;
  attachmentUrl?: string | null;
};

export type AdminComplaintsResponse = {
  complaints: AdminComplaint[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  summary: {
    total: number;
    pending: number;
    in_review: number;
    resolved: number;
  };
  serverTime: string;
};

export type ComplaintSubmitInput = {
  subject: string;
  category: string;
  description: string;
  isAnonymous: boolean;
  attachment: File | null;
};
