import { CLEARANCE_CHANNEL_NAME } from "@/lib/clearanceStorage";
import type { ClearancePeriod } from "@/types/clearance";

export const ADMIN_FEED_KEY = "cpc.admin.notifications.v1";
export const ADMIN_ACTIVITY_KEY = "cpc.admin.activity.v1";

export const READ_DELAY = 400;
export const WRITE_DELAY = 400;
export const MAX_TIMELINE = 240;
export const MAX_FEED = 30;
export const MAX_ACTIVITY = 40;

export const DEFAULT_PERIOD: ClearancePeriod = {
  academicYear: "2026-2027",
  term: "1st Semester",
  opensAt: "2026-08-03T00:00:00.000Z",
  closesAt: "2026-12-15T23:59:59.000Z",
  open: true,
  overdueDays: 3,
};

export function wait<T>(value: T, ms = READ_DELAY): Promise<T> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(value), ms);
  });
}

export function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJson(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota or private mode: this tab's in-memory state still works.
  }
}

/** Tells the other open tabs (and other hooks in this tab) to re-read. */
export function announceClearanceChange(reason: string): void {
  if (typeof BroadcastChannel === "undefined") return;
  try {
    const channel = new BroadcastChannel(CLEARANCE_CHANNEL_NAME);
    channel.postMessage({ reason, at: new Date().toISOString() });
    channel.close();
  } catch {
    // BroadcastChannel is unavailable in some privacy modes.
  }
}

