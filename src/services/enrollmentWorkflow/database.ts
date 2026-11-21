import { ApiError, apiClient, type NoRefreshConfig } from "@/lib/apiClient";
import { getCsrfToken } from "@/services/auth";
import { clearAdminBackendSession, ensureAdminSession, readAdminRole } from "@/services/complaints/admin-session";
import type { StudentEnrollmentSession } from "@/types/enrollmentWorkflow";
import type { EnrollmentSignatureOffice } from "./service";

type Envelope<T> = { code: number; message?: string; data?: T };

async function withAdminToken<T>(run: (token: string) => Promise<T>): Promise<T> {
  const role = readAdminRole();
  const token = await ensureAdminSession(role);
  try {
    return await run(token);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      clearAdminBackendSession();
      return run(await ensureAdminSession(role));
    }
    throw error;
  }
}

function adminConfig(token: string, csrf?: string): NoRefreshConfig & { headers: Record<string, string> } {
  return { skipAuthRefresh: true, headers: { Authorization: `Bearer ${token}`, ...(csrf ? { "x-csrf-token": csrf } : {}) } };
}

export async function loadMyEnrollmentSession(): Promise<StudentEnrollmentSession | null> {
  try {
    const response = await apiClient.get<Envelope<{ session: StudentEnrollmentSession }>>("/enrollment/v1/sessions/mine");
    return response.data.data?.session ?? null;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function submitEnrollmentToDatabase(session: StudentEnrollmentSession): Promise<StudentEnrollmentSession> {
  const csrf = await getCsrfToken();
  const response = await apiClient.post<Envelope<{ session: StudentEnrollmentSession }>>(
    "/enrollment/v1/sessions/submit",
    { session },
    { headers: { "x-csrf-token": csrf } },
  );
  if (!response.data.data?.session) throw new ApiError(response.data.message || "The Study Load could not be saved.");
  return response.data.data.session;
}

export async function requestSignatureFromDatabase(studentId: string, office: EnrollmentSignatureOffice): Promise<StudentEnrollmentSession> {
  const csrf = await getCsrfToken();
  const response = await apiClient.post<Envelope<{ session: StudentEnrollmentSession }>>(
    `/enrollment/v1/sessions/${encodeURIComponent(studentId)}/request`,
    { office },
    { headers: { "x-csrf-token": csrf } },
  );
  if (!response.data.data?.session) throw new ApiError(response.data.message || "The signature request could not be saved.");
  return response.data.data.session;
}

export async function getOfficeSignatureRequests(office: EnrollmentSignatureOffice): Promise<StudentEnrollmentSession[]> {
  return withAdminToken(async (token) => {
    const response = await apiClient.get<Envelope<{ sessions: StudentEnrollmentSession[] }>>(
      `/enrollment/v1/sessions/requests/${office}`,
      adminConfig(token),
    );
    return response.data.data?.sessions ?? [];
  });
}

export async function signEnrollmentInDatabase(
  studentId: string,
  office: EnrollmentSignatureOffice,
  feePaid = false,
): Promise<StudentEnrollmentSession> {
  const csrf = await getCsrfToken();
  return withAdminToken(async (token) => {
    const response = await apiClient.post<Envelope<{ session: StudentEnrollmentSession }>>(
      `/enrollment/v1/sessions/${encodeURIComponent(studentId)}/sign`,
      { office, feePaid },
      adminConfig(token, csrf),
    );
    if (!response.data.data?.session) throw new ApiError(response.data.message || "The signature could not be saved.");
    return response.data.data.session;
  });
}
