/**
 * Read layer for the student Class Schedules page.
 *
 * (1) SHARED-STORAGE CONTRACT: the staff portal owns every write, this file
 * only reads. Students see `cpc:schedules:published` and nothing else — the
 * draft, the master data and the audit trail stay behind the admin login.
 *
 * (2) FIRST RUN & API SYNC: Attempts to fetch the published schedule from the
 * backend API `/api/schedules/v1/published`. If offline, falls back to the
 * cached or seeded record.
 *
 * (3) LIVE SYNC: `storage` fires in other tabs, and BroadcastChannel wakes tabs
 * when published data moves.
 */
import {
  SCHEDULE_CHANNEL_NAME,
  SCHEDULE_DRAFT_KEY,
  SCHEDULE_HISTORY_KEY,
  SCHEDULE_MASTER_KEY,
  SCHEDULE_PUBLISHED_KEY,
} from "@/lib/scheduleStorage";
import { apiClient } from "@/lib/apiClient";
import { seedPublishedSchedule } from "./mockAdmin";
import type { PublishedSchedule } from "@/types/scheduleAdmin";

/** Every key whose change means the student's timetable may have moved. */
const SCHEDULE_KEYS: string[] = [
  SCHEDULE_PUBLISHED_KEY,
  SCHEDULE_DRAFT_KEY,
  SCHEDULE_MASTER_KEY,
  SCHEDULE_HISTORY_KEY,
];

export function isPublishedSchedule(value: unknown): value is PublishedSchedule {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Partial<PublishedSchedule>;
  return typeof record.version === "number" && Array.isArray(record.schedules);
}

/** The published record, seeding it first when this student ran ahead of staff. */
export function readPublishedSchedule(): PublishedSchedule {
  const stored = localStorage.getItem(SCHEDULE_PUBLISHED_KEY);
  if (stored !== null) {
    try {
      const parsed: unknown = JSON.parse(stored);
      if (isPublishedSchedule(parsed)) return parsed;
    } catch {
      // Corrupted JSON falls through to the seed, same as a missing key.
    }
  }

  const seeded = seedPublishedSchedule();
  localStorage.setItem(SCHEDULE_PUBLISHED_KEY, JSON.stringify(seeded));
  return seeded;
}

/** Fetches published schedule from the real backend API. */
export async function fetchPublishedScheduleApi(): Promise<PublishedSchedule> {
  try {
    const response = await apiClient.get("/schedules/v1/published");
    const data = response.data?.data?.schedule;
    if (data && isPublishedSchedule(data)) {
      localStorage.setItem(SCHEDULE_PUBLISHED_KEY, JSON.stringify(data));
      return data;
    }
  } catch {
    // Fall back to storage or seed
  }
  return readPublishedSchedule();
}

/**
 * Calls `onChange` when another tab — or this one, through the channel — moves
 * the store. Returns the unsubscribe, so the provider can drop both listeners.
 */
export function subscribeToPublishedSchedule(onChange: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || SCHEDULE_KEYS.includes(event.key)) onChange();
  };

  let channel: BroadcastChannel | null = null;
  if ("BroadcastChannel" in window) {
    channel = new BroadcastChannel(SCHEDULE_CHANNEL_NAME);
    channel.onmessage = () => onChange();
  }

  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener("storage", onStorage);
    channel?.close();
  };
}

/** "Updated Oct 04, 2026 · v7" — the caption under the semester line. */
export function formatPublishedCaption(published: PublishedSchedule): string {
  const date = new Date(published.publishedAt);
  const label = Number.isNaN(date.getTime())
    ? "date unavailable"
    : date.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
  return `Updated ${label} · v${published.version}`;
}
