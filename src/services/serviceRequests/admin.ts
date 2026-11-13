/**
 * Shared admin model and constants for Student Services > Service Requests.
 * HTTP access lives in `./adminApi`.
 */
import {
  STATUS_LABELS,
  type RequestHistoryEntry,
  type RequestStatus,
  type TimelineStage,
} from "./types";

export type AdminServiceRequestStatus = RequestStatus;

export const SERVICE_STATUS_LABELS = STATUS_LABELS;

export const SERVICE_STATUS_ORDER: AdminServiceRequestStatus[] = [
  "submitted",
  "under_review",
  "processing",
  "ready_for_release",
  "released",
  "rejected",
];

export type AdminServiceDocument = {
  name: string;
  size: number;
  mime: string;
};

export type AdminServiceStudent = {
  name: string;
  studentNumber: string;
  course: string;
  yearLevel: string | null;
  email: string;
};

/** One row from the shared admin queue. */
export type AdminServiceRequestRow = {
  id: string;
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
  remarks: string;
  status: AdminServiceRequestStatus;
  statusLabel: string;
  submittedAt: string;
  updatedAt: string;
  document: AdminServiceDocument | null;
  lastUpdatedByRole: string | null;
  lastUpdatedByName: string | null;
  student: AdminServiceStudent;
};

/** Detail responses add the derived timeline and the stored history rows. */
export type AdminServiceRequestDetail = AdminServiceRequestRow & {
  timeline: TimelineStage[];
  history: RequestHistoryEntry[];
};

export type AdminServiceRequestSummary = {
  total: number;
  submitted: number;
  under_review: number;
  processing: number;
  ready_for_release: number;
  released: number;
  rejected: number;
};

export type AdminServiceRequestPagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type AdminServiceRequestFilters = {
  page: number;
  pageSize: number;
  search: string;
  status: "all" | AdminServiceRequestStatus;
  serviceId: number | null;
  from: string;
  to: string;
};

export type AdminServiceRequestListResult = {
  requests: AdminServiceRequestRow[];
  pagination: AdminServiceRequestPagination;
  summary: AdminServiceRequestSummary;
  serverTime: string;
};

export type AdminServiceRequestUpdate = {
  status?: AdminServiceRequestStatus;
  remarks?: string;
};

export const EMPTY_ADMIN_SERVICE_SUMMARY: AdminServiceRequestSummary = {
  total: 0,
  submitted: 0,
  under_review: 0,
  processing: 0,
  ready_for_release: 0,
  released: 0,
  rejected: 0,
};

export const EMPTY_ADMIN_SERVICE_PAGINATION: AdminServiceRequestPagination = {
  page: 1,
  pageSize: 10,
  total: 0,
  totalPages: 1,
};

export const DEFAULT_ADMIN_SERVICE_FILTERS: AdminServiceRequestFilters = {
  page: 1,
  pageSize: 10,
  search: "",
  status: "all",
  serviceId: null,
  from: "",
  to: "",
};

/** Requests still in the queue (not released or rejected). */
export function countActiveServiceRequests(summary: AdminServiceRequestSummary): number {
  return Math.max(0, summary.total - summary.released - summary.rejected);
}
