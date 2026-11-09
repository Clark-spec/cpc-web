/**
 * The shared Class Schedules store contract.
 *
 * Both portals are clients of the same `localStorage` keys and the same
 * BroadcastChannel, so the strings are declared once here (the same rule the
 * clearance keys follow). A key typed differently on one side would silently
 * stop the two tabs from syncing — no type error, no failing build, just a
 * student page that never shows the published schedule.
 *
 * The contract has one direction that matters more than the rest:
 *   admin edits write SCHEDULE_DRAFT_KEY only, publish copies draft -> PUBLISHED.
 * The student page reads PUBLISHED only, so unfinished registrar work can never
 * reach a student.
 */

export const SCHEDULE_PUBLISHED_KEY = "cpc:schedules:published";
export const SCHEDULE_DRAFT_KEY = "cpc:schedules:draft";
export const SCHEDULE_MASTER_KEY = "cpc:schedules:master";
export const SCHEDULE_HISTORY_KEY = "cpc:schedules:history";
export const SCHEDULE_CHANNEL_NAME = "cpc-schedules";

/**
 * The per-student bell feed is one namespace shared by every feature that
 * notifies a student; `config/clearanceStorage.ts` owns the helper so the
 * format cannot drift between features.
 */
export { studentNotificationsKey } from "@/lib/clearanceStorage";
