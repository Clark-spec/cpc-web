export type ComplaintStatus = "pending" | "in_review" | "resolved";

export type Complaint = {
  id: string;
  referenceNumber: string;
  subject: string;
  category: string;
  filedAt: string;
  status: ComplaintStatus;
  anonymous: boolean;
};

export type ComplaintFormValues = {
  fullName: string;
  studentId: string;
  courseYearLevel: string;
  email: string;
  contactNumber: string;
  category: string;
  subject: string;
  description: string;
  attachment: File | null;
  anonymous: boolean;
};
