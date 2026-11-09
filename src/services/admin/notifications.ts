import type { AdminNotification } from "@/types/admin";
import { ADMIN_NOTIFICATIONS_KEY, isRecord, readJson, wait, writeJson } from "./storage";

export function seedAdminNotifications(): AdminNotification[] {
  const now = Date.now();

  return [
    {
      id: "notif-1",
      message: "3 clearance requests are waiting for your signature.",
      type: "info",
      createdAt: new Date(now - 8 * 60 * 1000).toISOString(),
      read: false,
      href: "/admin/clearance-requests",
    },
    {
      id: "notif-2",
      message: "A new enrollment application needs review.",
      type: "warning",
      createdAt: new Date(now - 35 * 60 * 1000).toISOString(),
      read: false,
      href: "/admin/enrollment/for-review",
    },
    {
      id: "notif-3",
      message: "Registrar signed 5 clearance requests today.",
      type: "success",
      createdAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
      read: false,
      href: "/admin/clearance-requests",
    },
    {
      id: "notif-4",
      message: "Weekly enrollment summary is ready.",
      type: "info",
      createdAt: new Date(now - 26 * 60 * 60 * 1000).toISOString(),
      read: true,
      href: "/admin/dashboard",
    },
  ];
}

export function normalizeAdminNotification(value: unknown): AdminNotification | null {
  if (!isRecord(value)) return null;
  if (
    typeof value.id !== "string" ||
    typeof value.message !== "string" ||
    typeof value.createdAt !== "string" ||
    typeof value.read !== "boolean" ||
    (value.type !== "info" && value.type !== "success" && value.type !== "warning")
  ) {
    return null;
  }

  return {
    id: value.id,
    message: value.message,
    type: value.type,
    createdAt: value.createdAt,
    read: value.read,
    href: typeof value.href === "string" ? value.href : undefined,
  };
}

export function readAdminNotifications(): AdminNotification[] {
  const stored = readJson(ADMIN_NOTIFICATIONS_KEY, null);

  if (Array.isArray(stored)) {
    const normalized = stored
      .map(normalizeAdminNotification)
      .filter((item): item is AdminNotification => item !== null);
    if (normalized.length > 0) return normalized;
  }

  const seeded = seedAdminNotifications();
  writeJson(ADMIN_NOTIFICATIONS_KEY, seeded);
  return seeded;
}

export async function getAdminNotifications(): Promise<AdminNotification[]> {
  const notifications = readAdminNotifications().sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
  return wait(notifications.slice(0, 30));
}

export async function markNotificationsRead(ids?: string[]): Promise<void> {
  const notifications = readAdminNotifications();
  const next = notifications.map((notification) =>
    ids === undefined || ids.includes(notification.id)
      ? { ...notification, read: true }
      : notification,
  );
  writeJson(ADMIN_NOTIFICATIONS_KEY, next);
  return wait(undefined, 200);
}

