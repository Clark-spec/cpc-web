import type { AppNotification } from "@/components/context/NotificationContext";

/**
 * Returns notifications from only the requested student's browser cache.
 */
export function getStoredStudentNotifications(studentId: string): AppNotification[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(`cpc:notifications:${studentId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Records a student notification only in that student's browser cache.
 */
export function recordStudentNotification(
  studentId: string,
  notification: Omit<AppNotification, "id" | "createdAt" | "read"> & {
    id?: string;
    createdAt?: string;
    read?: boolean;
  },
): void {
  if (typeof window === "undefined") return;

  const entry: AppNotification = {
    id: notification.id || `notif-stu-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    title: notification.title,
    message: notification.message,
    type: notification.type ?? "info",
    createdAt: notification.createdAt || new Date().toISOString(),
    read: notification.read ?? false,
    officeId: notification.officeId,
    href: notification.href,
    local: true,
  };

  const keys = [`cpc:notifications:${studentId}`];

  for (const key of keys) {
    try {
      const raw = window.localStorage.getItem(key);
      const existing: AppNotification[] = raw ? JSON.parse(raw) : [];
      // Deduplicate by ID or identical title + message
      const alreadyExists = existing.some(
        (n) => n.id === entry.id || (n.title === entry.title && n.message === entry.message),
      );
      if (!alreadyExists) {
        const next = [entry, ...existing].slice(0, 50);
        window.localStorage.setItem(key, JSON.stringify(next));
      }
    } catch {
      // Ignore storage errors
    }
  }

  // Broadcast to other tabs and current window
  window.dispatchEvent(new Event("storage"));
  window.dispatchEvent(new Event("cpc:student:notification"));
}

