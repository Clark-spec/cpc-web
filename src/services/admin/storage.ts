export const ADMIN_ACTIVITY_KEY = "cpc.admin.activity.v1";
export const ADMIN_NOTIFICATIONS_KEY = "cpc.admin.notifications.v1";
export const ADMIN_SESSION_KEY = "cpc.admin.session.v1";
export const ADMIN_DEMO_MODE_KEY = "cpc.admin.demo-mode.v1";
export const ADMIN_SIDEBAR_KEY = "cpc.admin.sidebar.collapsed.v1";

export const READ_DELAY = 400;
export const WRITE_DELAY = 400;

export function wait<T>(value: T, ms = READ_DELAY): Promise<T> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(value), ms);
  });
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function readJson(key: string, fallback: unknown): unknown {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as unknown;
  } catch {
    return fallback;
  }
}

export function writeJson(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore quota / private-mode failures; the in-memory UI still works.
  }
}

export function removeKey(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore storage failures.
  }
}

