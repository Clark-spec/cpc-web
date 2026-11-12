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
import type { DayCode, SectionId, SectionSchedule, ScheduleEntry } from "@/types/schedule";

/** Every key whose change means the student's timetable may have moved. */
const SCHEDULE_KEYS: string[] = [
  SCHEDULE_PUBLISHED_KEY,
  SCHEDULE_DRAFT_KEY,
  SCHEDULE_MASTER_KEY,
  SCHEDULE_HISTORY_KEY,
];

function isSectionSchedule(value: unknown): value is SectionSchedule {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Partial<SectionSchedule>;
  return typeof record.section === "string" && Array.isArray(record.entries);
}

export function isPublishedSchedule(value: unknown): value is PublishedSchedule {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Partial<PublishedSchedule>;
  return (
    typeof record.version === "number" &&
    Array.isArray(record.schedules) &&
    record.schedules.every(isSectionSchedule)
  );
}

// ── API payload adapter ─────────────────────────────────────────────────────
// `/schedules/v1/published` sends a flat list of class rows. The pages expect
// one SectionSchedule per section, so the payload is grouped and normalised
// here instead of teaching every component the backend's vocabulary.

const SECTION_ALIASES: Record<string, SectionId> = {
  "bsit-3a": "BSIT-3A",
  "bsit 3-a": "BSIT-3A",
  "bsit-3b": "BSIT-3B",
  "bsit 3-b": "BSIT-3B",
  "bsit-3c": "BSIT-3C",
  "bsit 3-c": "BSIT-3C",
  "bsit-3d": "BSIT-3D",
  "bsit 3-d": "BSIT-3D",
};

const DAY_ALIASES: Record<string, DayCode> = {
  mon: "MON",
  monday: "MON",
  tue: "TUE",
  tues: "TUE",
  tuesday: "TUE",
  wed: "WED",
  wednesday: "WED",
  thu: "THU",
  thur: "THU",
  thursday: "THU",
  fri: "FRI",
  friday: "FRI",
  sat: "SAT",
  saturday: "SAT",
};

const COLOR_KEYS = [
  "blue",
  "emerald",
  "violet",
  "amber",
  "rose",
  "sky",
  "teal",
  "orange",
  "indigo",
];

const DEFAULT_SEMESTER = "1st Semester";
const DEFAULT_ACADEMIC_YEAR = "2026-2027";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function readText(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function toSection(value: unknown): SectionId | null {
  const text = readText(value);
  if (!text) return null;
  return SECTION_ALIASES[text.toLowerCase()] ?? null;
}

function toDay(value: unknown): DayCode | null {
  const text = readText(value);
  if (!text) return null;
  return DAY_ALIASES[text.toLowerCase()] ?? null;
}

/** "07:30" -> 450 minutes from midnight. */
function toMinutes(value: unknown): number | null {
  const text = readText(value);
  if (!text) return null;
  const match = /^(\d{1,2}):(\d{2})/.exec(text);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

/** "1st Semester, A.Y. 2026-2027" -> { semester, academicYear }. */
function parseTerm(label: unknown): { semester: string; academicYear: string } {
  const text = readText(label) ?? "";
  const [semesterPart, yearPart] = text.split(/,\s*A\.?Y\.?\s*/i);
  return {
    semester: semesterPart?.trim() || DEFAULT_SEMESTER,
    academicYear: yearPart?.trim() || DEFAULT_ACADEMIC_YEAR,
  };
}

function toEntry(value: unknown, index: number): ScheduleEntry | null {
  const raw = asRecord(value);
  const days = Array.isArray(raw.days)
    ? Array.from(new Set(raw.days.map(toDay).filter((day): day is DayCode => day !== null)))
    : [];
  if (days.length === 0) return null;

  const startMin = toMinutes(raw.startTime) ?? 0;
  const endMin = toMinutes(raw.endTime) ?? startMin + 60;
  const code = readText(raw.code, raw.subjectCode) ?? "";
  const room = readText(raw.room, raw.roomSetA) ?? "";

  return {
    id: readText(raw.id) ?? `api-${index}`,
    subjectCode: code,
    title: readText(raw.subject, raw.title) ?? code,
    days,
    startMin,
    endMin,
    roomSetA: room,
    roomSetB: readText(raw.roomSetB) ?? room,
    units: typeof raw.units === "number" ? raw.units : 0,
    instructor: readText(raw.instructor) ?? "",
    status: raw.status === "not_active" ? "not_active" : "active",
    colorKey: COLOR_KEYS[index % COLOR_KEYS.length],
  };
}

function mapApiSchedule(value: unknown): PublishedSchedule | null {
  const payload = asRecord(value);
  if (typeof payload.version !== "number" || !Array.isArray(payload.schedules)) {
    return null;
  }

  const publishedAt = readText(payload.publishedAt) ?? new Date().toISOString();
  const publishedBy = readText(payload.publishedBy) ?? "Registrar";

  // Already grouped in the portal's own shape.
  if (payload.schedules.every(isSectionSchedule)) {
    return {
      version: payload.version,
      publishedAt,
      publishedBy,
      schedules: payload.schedules as SectionSchedule[],
    };
  }

  const { semester, academicYear } = parseTerm(payload.semesterLabel);
  const grouped = new Map<SectionId, ScheduleEntry[]>();

  payload.schedules.forEach((row, index) => {
    const raw = asRecord(row);
    const section = toSection(raw.section);
    const entry = toEntry(raw, index);
    if (!section || !entry) return;
    const entries = grouped.get(section) ?? [];
    entries.push(entry);
    grouped.set(section, entries);
  });

  return {
    version: payload.version,
    publishedAt,
    publishedBy,
    schedules: Array.from(grouped, ([section, entries]) => ({
      section,
      semester,
      academicYear,
      entries,
    })),
  };
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
    const mapped = mapApiSchedule(response.data?.data?.schedule);
    if (mapped) {
      localStorage.setItem(SCHEDULE_PUBLISHED_KEY, JSON.stringify(mapped));
      return mapped;
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
