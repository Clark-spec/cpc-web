/**
 * Admin HTTP access for Student Services > Service Requests.
 *
 * The admin portal authenticates with demo roles, so every call runs through
 * `ensureAdminSession` (the same bridge Complaints uses) and carries its own
 * bearer token. PATCH requests also send the CSRF double-submit header.
 *
 * Contract:
 *   GET   /service-requests/v1/admin          (page, pageSize, search, status, serviceId, from, to)
 *   GET   /service-requests/v1/admin/:id
 *   PATCH /service-requests/v1/admin/:id      ({ status?, remarks?, expectedUpdatedAt })
 *   GET   /service-requests/v1/admin/:id/document (binary)
 */
import { ApiError, apiClient, type NoRefreshConfig } from "@/lib/apiClient";
import type { AxiosRequestConfig } from "axios";
import { getCsrfToken } from "@/services/auth";
import { clearAdminBackendSession, ensureAdminSession } from "@/services/complaints/admin-session";
import type {
  AdminServiceRequestDetail,
  AdminServiceRequestFilters,
  AdminServiceRequestListResult,
  AdminServiceRequestRow,
  AdminServiceRequestStatus,
  AdminServiceRequestSummary,
  AdminServiceRequestUpdate,
} from "./admin";
import { normalizeHistoryEntry, normalizeStatus, normalizeTimelineStage } from "./shared";

type ApiEnvelope<T> = {
  code: number;
  status: string;
  message?: string;
  data?: T;
};

type Json = Record<string, unknown>;

function asRecord(value: unknown): Json {
  return value && typeof value === "object" ? (value as Json) : {};
}

function readString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value;
  }
  return undefined;
}

function readNumber(...values: unknown[]): number | undefined {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) {
      return Number(value);
    }
  }
  return undefined;
}

function normalizeRow(value: unknown): AdminServiceRequestRow {
  const raw = asRecord(value);
  const serviceRaw = asRecord(raw.service);
  const studentRaw = asRecord(raw.student);
  const status = normalizeStatus(raw.status);
  const documentRaw = asRecord(raw.document);
  const hasDocument = Boolean(readString(documentRaw.name));
  const submittedAt =
    readString(raw.submittedAt, raw.submitted_at, raw.createdAt) ?? new Date().toISOString();

  return {
    id: String(raw.id ?? ""),
    referenceNumber: readString(raw.referenceNumber, raw.reference_number) ?? "",
    service: {
      id: readNumber(serviceRaw.id) ?? 0,
      name: readString(serviceRaw.name) ?? "Service",
      code: readString(serviceRaw.code) ?? "",
      fee: readNumber(serviceRaw.fee) ?? 0,
    },
    copies: readNumber(raw.copies) ?? 1,
    purpose: readString(raw.purpose) ?? "",
    notes: readString(raw.notes) ?? "",
    remarks: readString(raw.remarks) ?? "",
    status,
    statusLabel: readString(raw.statusLabel, raw.status_label) ?? "",
    submittedAt,
    updatedAt: readString(raw.updatedAt, raw.updated_at) ?? submittedAt,
    document: hasDocument
      ? {
          name: documentRaw.name as string,
          size: readNumber(documentRaw.size) ?? 0,
          mime: readString(documentRaw.mime) ?? "",
        }
      : null,
    lastUpdatedByRole: readString(raw.lastUpdatedByRole) ?? null,
    lastUpdatedByName: readString(raw.lastUpdatedByName) ?? null,
    student: {
      name: readString(studentRaw.name) ?? "",
      studentNumber: readString(studentRaw.studentNumber) ?? "",
      course: readString(studentRaw.course) ?? "",
      yearLevel: readNumber(studentRaw.yearLevel)?.toString() ?? null,
      email: readString(studentRaw.email) ?? "",
    },
  };
}

function normalizeDetail(value: unknown): AdminServiceRequestDetail {
  const raw = asRecord(value);
  return {
    ...normalizeRow(raw),
    timeline: Array.isArray(raw.timeline) ? raw.timeline.map(normalizeTimelineStage) : [],
    history: Array.isArray(raw.history) ? raw.history.map(normalizeHistoryEntry) : [],
  };
}

function normalizeSummary(value: unknown): AdminServiceRequestSummary {
  const raw = asRecord(value);
  const status = (key: AdminServiceRequestStatus) => Math.max(0, readNumber(raw[key]) ?? 0);
  const total = Math.max(0, readNumber(raw.total) ?? 0);

  return {
    total,
    submitted: status("submitted"),
    under_review: status("under_review"),
    processing: status("processing"),
    ready_for_release: status("ready_for_release"),
    released: status("released"),
    rejected: status("rejected"),
  };
}

/**
 * Runs an admin request with the bridge's own bearer token. The demo session is
 * separate from the student session; on 401 we sign in again once instead of
 * letting the shared refresh replace the student token.
 */
async function withAdminToken<T>(run: (token: string) => Promise<T>): Promise<T> {
  const token = await ensureAdminSession();
  try {
    return await run(token);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      clearAdminBackendSession();
      return run(await ensureAdminSession());
    }
    throw error;
  }
}

function adminConfig(token: string, extra?: AxiosRequestConfig): AxiosRequestConfig & NoRefreshConfig {
  return {
    ...extra,
    headers: { ...extra?.headers, Authorization: `Bearer ${token}` },
    skipAuthRefresh: true,
  };
}

export async function listAdminServiceRequests(
  filters: AdminServiceRequestFilters,
): Promise<AdminServiceRequestListResult> {
  const params: Record<string, string | number> = {
    page: filters.page,
    pageSize: filters.pageSize,
  };
  if (filters.search.trim()) params.search = filters.search.trim();
  if (filters.status !== "all") params.status = filters.status;
  if (filters.serviceId) params.serviceId = filters.serviceId;
  if (filters.from) params.from = filters.from;
  if (filters.to) params.to = filters.to;

  const response = await withAdminToken((token) =>
    apiClient.get<ApiEnvelope<{ requests: unknown[]; pagination: unknown; summary: unknown }>>(
      "/service-requests/v1/admin",
      adminConfig(token, { params }),
    ),
  );

  const data = response.data?.data;
  if (!data) throw new ApiError("Could not load service requests.");

  const paginationRaw = asRecord(data.pagination);
  const page = Math.max(1, readNumber(paginationRaw.page) ?? filters.page);
  const pageSize = Math.max(1, readNumber(paginationRaw.pageSize) ?? filters.pageSize);
  const total = Math.max(0, readNumber(paginationRaw.total) ?? 0);

  return {
    requests: Array.isArray(data.requests) ? data.requests.map(normalizeRow) : [],
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, readNumber(paginationRaw.totalPages) ?? Math.ceil(total / pageSize)),
    },
    summary: normalizeSummary(data.summary),
    serverTime: readString(asRecord(data).serverTime) ?? new Date().toISOString(),
  };
}

export async function getAdminServiceRequest(id: string): Promise<AdminServiceRequestDetail> {
  const response = await withAdminToken((token) =>
    apiClient.get<ApiEnvelope<{ request: unknown }>>(
      `/service-requests/v1/admin/${encodeURIComponent(id)}`,
      adminConfig(token),
    ),
  );

  const request = response.data?.data?.request;
  if (!request) throw new ApiError("The service request could not be found.", 404);
  return normalizeDetail(request);
}

export async function updateAdminServiceRequest(
  id: string,
  update: AdminServiceRequestUpdate,
  expectedUpdatedAt: string,
): Promise<AdminServiceRequestDetail> {
  const csrf = await getCsrfToken();
  const response = await withAdminToken((token) =>
    apiClient.patch<ApiEnvelope<{ request: unknown }>>(
      `/service-requests/v1/admin/${encodeURIComponent(id)}`,
      {
        status: update.status,
        remarks: update.remarks,
        expectedUpdatedAt,
      },
      adminConfig(token, { headers: { "x-csrf-token": csrf } }),
    ),
  );

  const request = response.data?.data?.request;
  if (!request) throw new ApiError("The service request could not be updated.");
  return normalizeDetail(request);
}

export async function downloadAdminServiceDocument(id: string, fileName: string): Promise<void> {
  const response = await withAdminToken((token) =>
    apiClient.get(
      `/service-requests/v1/admin/${encodeURIComponent(id)}/document`,
      adminConfig(token, { responseType: "blob" }),
    ),
  );

  const blob = response.data as Blob;
  const disposition = String(response.headers["content-disposition"] ?? "");
  const headerName = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition)?.[1];

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = headerName ? decodeURIComponent(headerName) : fileName || "student-id";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
