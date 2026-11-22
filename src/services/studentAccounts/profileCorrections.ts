import type { AdminRole } from "@/types/admin";
import type {
  CorrectionDecision,
  ProfileCorrectionRequest,
} from "@/components/features/admin/student-accounts/types";
import { apiClient, ApiError, type NoRefreshConfig } from "@/lib/apiClient";
import { ensureAdminSession, clearAdminBackendSession } from "@/services/complaints/admin-session";
import { getCsrfToken } from "@/services/auth";
import type { AxiosRequestConfig } from "axios";

type Envelope<T> = { data?: T; message?: string };

function adminConfig(token: string, extra?: AxiosRequestConfig): AxiosRequestConfig & NoRefreshConfig {
  return {
    ...extra,
    headers: { ...extra?.headers, Authorization: `Bearer ${token}` },
    skipAuthRefresh: true,
  };
}

async function withAdminToken<T>(role: AdminRole, run: (token: string) => Promise<T>): Promise<T> {
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

export async function listProfileCorrectionRequests(role: AdminRole): Promise<ProfileCorrectionRequest[]> {
  const response = await withAdminToken(role, (token) =>
    apiClient.get<Envelope<{ requests: ProfileCorrectionRequest[] }>>(
      "/students/v1/profile/corrections",
      adminConfig(token),
    ),
  );
  return response.data?.data?.requests ?? [];
}

export async function decideProfileCorrectionRequest(
  role: AdminRole,
  id: string,
  decision: CorrectionDecision,
): Promise<ProfileCorrectionRequest> {
  const csrf = await getCsrfToken();
  const response = await withAdminToken(role, (token) =>
    apiClient.patch<Envelope<{ request: ProfileCorrectionRequest }>>(
      `/students/v1/profile/corrections/${encodeURIComponent(id)}`,
      decision,
      adminConfig(token, { headers: { "x-csrf-token": csrf } }),
    ),
  );
  const request = response.data?.data?.request;
  if (!request) throw new Error(response.data?.message ?? "Could not update the correction request.");
  return request;
}
