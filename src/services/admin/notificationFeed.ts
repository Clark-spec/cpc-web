import { apiClient, ApiError, type NoRefreshConfig } from "@/lib/apiClient";
import { getCsrfToken } from "@/services/auth";
import type { AxiosRequestConfig } from "axios";
import type { AdminNotification } from "@/types/admin";
import {
  clearAdminBackendSession,
  ensureAdminSession,
} from "@/services/complaints/admin-session";

type ApiEnvelope<T> = {
  status: string;
  message?: string;
  data?: T;
};

type NotificationRow = {
  id: string;
  title?: string | null;
  message: string;
  type: "info" | "success" | "warning";
  createdAt: string;
  read: boolean;
  href?: string | null;
};

function adminConfig(
  token: string,
  extra?: AxiosRequestConfig,
): AxiosRequestConfig & NoRefreshConfig {
  return {
    ...extra,
    headers: { ...extra?.headers, Authorization: `Bearer ${token}` },
    skipAuthRefresh: true,
  };
}

/** Same bearer bridge as the complaint queue; retries once after a 401. */
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

/**
 * Staff bell feed. New-complaint notifications are faned out by the backend to
 * every complaint-handling role without any student identity.
 */
export async function fetchAdminNotificationFeed(): Promise<AdminNotification[]> {
  const response = await withAdminToken((token) =>
    apiClient.get<ApiEnvelope<{ notifications: NotificationRow[] }>>(
      "/notifications/v1",
      adminConfig(token, { params: { limit: 50 } }),
    ),
  );

  const rows = response.data?.data?.notifications ?? [];
  return rows.map((row) => ({
    id: row.id,
    title: row.title ?? undefined,
    message: row.message,
    type: row.type ?? "info",
    createdAt: row.createdAt,
    read: Boolean(row.read),
    href: row.href ?? undefined,
  }));
}

export async function markAdminNotificationsReadApi(ids?: string[]): Promise<void> {
  const csrf = await getCsrfToken();
  const headers = { "x-csrf-token": csrf };

  if (!ids) {
    await withAdminToken((token) =>
      apiClient.patch("/notifications/v1/read-all", {}, adminConfig(token, { headers })),
    );
    return;
  }

  await withAdminToken((token) =>
    Promise.all(
      ids.map((id) =>
        apiClient.patch(
          `/notifications/v1/${encodeURIComponent(id)}/read`,
          {},
          adminConfig(token, { headers }),
        ),
      ),
    ),
  );
}

export async function deleteAdminNotificationApi(id: string): Promise<void> {
  const csrf = await getCsrfToken();
  await withAdminToken((token) =>
    apiClient.delete(
      `/notifications/v1/${encodeURIComponent(id)}`,
      adminConfig(token, { headers: { "x-csrf-token": csrf } }),
    ),
  );
}
