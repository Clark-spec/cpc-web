import { SCHEDULE_CHANNEL_NAME } from "@/lib/scheduleStorage";
import type { SectionId } from "@/types/schedule";

export const READ_DELAY = 400;
export const WRITE_DELAY = 400;
export const MAX_HISTORY = 120;
export const MAX_PUBLISHED_ARCHIVE = 8;
export const MAX_FEED = 30;

/** The demo learner whose bell this portal writes into; a real session supplies the id. */
export const DEMO_STUDENT_ID = "12345678";
export const DEMO_STUDENT_SECTION: SectionId = "BSIT-3A";
export const STUDENT_PROFILE_KEY = "cpc.student-profile.v1";

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

/** Tells the other open tabs (and the other hooks in this tab) to re-read. */
export function announceScheduleChange(reason: string): void {
  if (typeof BroadcastChannel === "undefined") return;
  try {
    const channel = new BroadcastChannel(SCHEDULE_CHANNEL_NAME);
    channel.postMessage({ reason, at: new Date().toISOString() });
    channel.close();
  } catch {
    // BroadcastChannel is unavailable in some privacy modes.
  }
}

export function nowIso(): string {
  return new Date().toISOString();
}

