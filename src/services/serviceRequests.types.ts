/** Shared types and constants for the student Service Requests module. */

export type RequestStatus =
  | "submitted"
  | "under_review"
  | "processing"
  | "ready_for_release"
  | "released"
  | "rejected";

export type StageState = "completed" | "active" | "pending";

export type TimelineStage = {
  key: Exclude<RequestStatus, "released" | "rejected">;
  label: string;
  description: string;
  state: StageState;
  timestamp: string | null;
};

export type RequestDocument = {
  name: string;
  size: number;
  mime: string;
};

export type ServiceRequest = {
  id: number;
  referenceNumber: string;
  service: {
    id: number;
    name: string;
    code: string;
    fee: number;
  };
  copies: number;
  purpose: string;
  notes: string;
  status: RequestStatus;
  statusLabel: string;
  submittedAt: string;
  updatedAt: string;
  document: RequestDocument;
  timeline: TimelineStage[];
};

export type ServiceOption = {
  id: number;
  code: string;
  name: string;
  description: string;
  fee: number;
};

export type PurposeOption = {
  id: number;
  label: string;
};

export type ServiceRequestDraft = {
  serviceId: number | null;
  copies: number;
  purpose: string;
  notes: string;
  hasDocument: boolean;
  document: RequestDocument | null;
  updatedAt: string;
};

export type ServiceRequestNotification = {
  id: number;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  requestId: number | null;
  referenceNumber: string | null;
};

export type RequestFormValues = {
  serviceId: number | null;
  copies: number;
  purpose: string;
  notes: string;
  document: File | null;
};

export const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_DOCUMENT_TYPES = ["application/pdf", "image/png", "image/jpeg"];
export const ACCEPTED_DOCUMENT_LABEL = "PDF, PNG, or JPG up to 5 MB";

export const STATUS_LABELS: Record<RequestStatus, string> = {
  submitted: "Submitted",
  under_review: "Under Review",
  processing: "Processing",
  ready_for_release: "Ready for Release",
  released: "Released",
  rejected: "Rejected",
};
