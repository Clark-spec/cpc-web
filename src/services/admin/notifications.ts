import type { AdminNotification } from "@/types/admin";
import { ADMIN_NOTIFICATIONS_KEY, isRecord, readJson, wait, writeJson } from "./storage";

export function seedAdminNotifications(): AdminNotification[] {
  return [];
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

/** Removes a single admin notification by id from local storage. */
export function deleteAdminNotification(id: string): void {
  const notifications = readAdminNotifications();
  const next = notifications.filter((n) => n.id !== id);
  writeJson(ADMIN_NOTIFICATIONS_KEY, next);
}

/** Removes all admin notifications from local storage. */
export function deleteAllAdminNotifications(): void {
  writeJson(ADMIN_NOTIFICATIONS_KEY, []);
}


