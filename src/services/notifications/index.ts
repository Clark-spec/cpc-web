import { apiClient } from "@/lib/apiClient";
import { getCsrfToken } from "@/services/auth";
import type { AppNotification } from "@/components/context/NotificationContext";

export type NotificationsApiResponse = {
  notifications: AppNotification[];
  unread: number;
  total: number;
  hasMore: boolean;
};

type NotificationQuery = {
  limit?: number;
  offset?: number;
};

export async function fetchNotificationsApi(
  query: NotificationQuery = {},
): Promise<NotificationsApiResponse> {
  const response = await apiClient.get<{
    status: string;
    data: {
      notifications: Array<{
        id: string;
        title?: string | null;
        message: string;
        type: "info" | "success" | "warning";
        createdAt: string;
        read: boolean;
        officeId?: string | null;
        href?: string | null;
      }>;
      unread: number;
      total?: number;
      hasMore?: boolean;
    };
  }>("/notifications/v1", {
    params: {
      ...(query.limit !== undefined ? { limit: query.limit } : {}),
      ...(query.offset !== undefined ? { offset: query.offset } : {}),
    },
  });

  const payload = response.data?.data;
  const rawList = payload?.notifications ?? [];
  const notifications: AppNotification[] = rawList.map((n) => ({
    id: n.id,
    title: n.title ?? undefined,
    message: n.message,
    type: n.type ?? "info",
    createdAt: n.createdAt,
    read: Boolean(n.read),
    officeId: n.officeId ?? undefined,
    href: n.href ?? undefined,
  }));

  return {
    notifications,
    unread: payload?.unread ?? notifications.filter((n) => !n.read).length,
    total: payload?.total ?? notifications.length,
    hasMore: Boolean(payload?.hasMore),
  };
}

export async function markNotificationReadApi(id: string): Promise<void> {
  const csrf = await getCsrfToken();
  await apiClient.patch(
    `/notifications/v1/${encodeURIComponent(id)}/read`,
    {},
    {
      headers: { "x-csrf-token": csrf },
    }
  );
}

export async function markAllNotificationsReadApi(): Promise<void> {
  const csrf = await getCsrfToken();
  await apiClient.patch(
    "/notifications/v1/read-all",
    {},
    {
      headers: { "x-csrf-token": csrf },
    }
  );
}

export async function deleteNotificationApi(id: string): Promise<void> {
  const csrf = await getCsrfToken();
  await apiClient.delete(`/notifications/v1/${encodeURIComponent(id)}`, {
    headers: { "x-csrf-token": csrf },
  });
}

export async function deleteAllNotificationsApi(): Promise<void> {
  const csrf = await getCsrfToken();
  await apiClient.delete("/notifications/v1", {
    headers: { "x-csrf-token": csrf },
  });
}
