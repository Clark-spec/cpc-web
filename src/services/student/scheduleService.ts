/**
 * Mock read layer for the student Class Schedules page.
 *
 * (1) SHARED-STORAGE CONTRACT: the staff portal owns every write, this file
 * only reads. Students see `cpc:schedules:published` and nothing else — the
 * draft, the master data and the audit trail stay behind the admin login, so
 * an unfinished registrar edit can never reach a student by accident.
 *
 * (2) FIRST RUN: a student who opens the page before any staff member has
 * signed in finds the key missing. Rather than an empty timetable, the store
 * is seeded from the same data module the admin service seeds from, so both
 * portals start from the identical version 7 record and the student page
 * behaves exactly as it did while it read its own mock file.
 *
 * (3) LIVE SYNC: `storage` fires in other tabs only, so the BroadcastChannel
 * the staff portal announces on is what wakes this tab. Either way the page
 * re-reads PUBLISHED and the new times appear without a refresh, which is also
 * the moment the "Your schedule was updated" banner becomes true information.
 */
import {
  SCHEDULE_CHANNEL_NAME,
  SCHEDULE_DRAFT_KEY,
  SCHEDULE_HISTORY_KEY,
  SCHEDULE_MASTER_KEY,
  SCHEDULE_PUBLISHED_KEY,
} from "@/config/scheduleStorage";
import { seedPublishedSchedule } from "@/data/mockScheduleAdmin";
import type { PublishedSchedule } from "@/types/scheduleAdmin";

/** Every key whose change means the student's timetable may have moved. */
const SCHEDULE_KEYS: string[] = [
  SCHEDULE_PUBLISHED_KEY,
  SCHEDULE_DRAFT_KEY,
  SCHEDULE_MASTER_KEY,
  SCHEDULE_HISTORY_KEY,
];

function isPublishedSchedule(value: unknown): value is PublishedSchedule {
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
  // The other three keys belong to the staff portal; leaving them absent means
  // an admin tab simply seeds its own copy on first load.
  return seeded;
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
