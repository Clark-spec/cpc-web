import { apiClient, ApiError, type NoRefreshConfig } from "@/lib/apiClient";
import { getCsrfToken } from "@/services/auth";
import type { AxiosRequestConfig } from "axios";
import type {
  AdminComplaintRow,
  ComplaintUpdate,
} from "@/components/features/admin/complaints/types";
import type { AdminComplaint, ComplaintStatus } from "./types";
import { clearAdminBackendSession, ensureAdminSession } from "./admin-session";

type ApiEnvelope<T> = {
  code: number;
  status: string;
  message?: string;
  data?: T;
};

function normalizeStatus(value: unknown): ComplaintStatus {
  return value === "in_review" || value === "resolved" ? value : "pending";
}

function toRow(complaint: AdminComplaint): AdminComplaintRow {
  return {
    id: complaint.id,
    referenceNumber: complaint.referenceNumber,
    studentName:
      complaint.studentName || (complaint.anonymous ? "Anonymous" : "—"),
    studentId: complaint.studentId || (complaint.anonymous ? "Hidden" : "—"),
    program: complaint.program ?? "",
    yearLevel: complaint.yearLevel ?? "",
    email: complaint.email ?? "",
    category: complaint.category,
    subject: complaint.subject,
    description: complaint.description,
    filedAt: complaint.filedAt,
    status: normalizeStatus(complaint.status),
    anonymous: complaint.anonymous === true,
    attachmentName: complaint.attachmentName ?? null,
    adminRemarks: complaint.adminRemarks ?? "",
    updatedAt: complaint.updatedAt ?? null,
    updatedByName: complaint.updatedByName ?? null,
  };
}

/**
 * Runs an admin request with the bridge's own bearer token. The admin demo
 * session is separate from the student session; if it expired we sign in again
 * once instead of letting the shared 401 refresh replace the student token.
 */
async function withAdminToken<T>(
  run: (token: string) => Promise<T>,
): Promise<T> {
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

/**
 * Admin queue. The backend strips identity for anonymous records before the
 * response leaves the server, so rows only ever contain placeholders.
 */
export async function getAdminComplaints(): Promise<AdminComplaintRow[]> {
  const response = await withAdminToken((token) =>
    apiClient.get<ApiEnvelope<{ complaints: AdminComplaint[] }>>(
      "/complaints/v1/admin",
      adminConfig(token, { params: { pageSize: 500 } }),
    ),
  );
  const complaints = response.data?.data?.complaints ?? [];
  return complaints.map(toRow);
}

export async function updateAdminComplaint(
  id: string,
  update: ComplaintUpdate,
  expectedUpdatedAt: string | null,
): Promise<AdminComplaintRow> {
  const csrf = await getCsrfToken();
  const response = await withAdminToken((token) =>
    apiClient.patch<ApiEnvelope<{ complaint: AdminComplaint }>>(
      `/complaints/v1/admin/${id}`,
      {
        status: update.status,
        adminRemarks: update.adminRemarks,
        expectedUpdatedAt: expectedUpdatedAt ?? undefined,
      },
      adminConfig(token, { headers: { "x-csrf-token": csrf } }),
    ),
  );

  const complaint = response.data?.data?.complaint;
  if (!complaint) throw new ApiError("The complaint could not be updated.");
  return toRow(complaint);
}
