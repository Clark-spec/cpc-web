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
  key: Exclude<RequestStatus, "rejected">;
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

/** The API uses UUID strings; the local demo adapter uses numbers. */
export type RequestId = string | number;

export type ServiceRequest = {
  id: RequestId;
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
  /** Remarks from the handling office, when the backend exposes them. */
  remarks?: string;
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
  id: RequestId;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  requestId: RequestId | null;
  referenceNumber: string | null;
};

export type RequestFormValues = {
  serviceId: number | null;
  copies: number;
  purpose: string;
  notes: string;
  documents: File[];
};

export const MIN_DOCUMENT_PHOTOS = 1;
export const MAX_DOCUMENT_PHOTOS = 2;
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

