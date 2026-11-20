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
    title: typeof value.title === "string" ? value.title : undefined,
    message: value.message,
    type: value.type,
    createdAt: value.createdAt,
    read: value.read,
    href: typeof value.href === "string" ? value.href : undefined,
    department: typeof value.department === "string" ? value.department : undefined,
    targetRole: typeof value.targetRole === "string" ? value.targetRole : undefined,
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

/** Pushes a new admin notification (e.g. from enrollment workflows, queue calls, etc.). */
export function recordAdminNotification(
  notification: Omit<AdminNotification, "id" | "createdAt" | "read"> & {
    id?: string;
  },
): void {
  const notifications = readAdminNotifications();
  // Prevent duplicate unread notifications with identical title and message
  const exists = notifications.some(
    (n) =>
      !n.read &&
      (n.id === notification.id ||
        (n.title === notification.title && n.message === notification.message)),
  );
  if (exists) return;

  const entry: AdminNotification = {
    ...notification,
    id: notification.id || `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    createdAt: new Date().toISOString(),
    read: false,
  };
  writeJson(ADMIN_NOTIFICATIONS_KEY, [entry, ...notifications].slice(0, 50));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new Event("cpc:admin:notification"));
  }
}


