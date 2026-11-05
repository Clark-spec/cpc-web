/**
 * The shared clearance store contract.
 *
 * Both portals are clients of the same `localStorage` keys and the same
 * BroadcastChannel, so the strings are declared once here rather than once per
 * service. A key edited on one side only would silently stop the two tabs from
 * syncing — no type error, no failing build, just a queue that never updates.
 *
 * `studentNotificationsKey` is the per-student feed the staff portal writes
 * into and the student bell reads from.
 */
import { mockStudent } from "@/data/mockClearance";

export const CLEARANCE_RECORDS_KEY = "cpc:clearance:records";
export const CLEARANCE_TIMELINE_KEY = "cpc:clearance:timeline";
export const CLEARANCE_PERIOD_KEY = "cpc:clearance:period";
export const CLEARANCE_CHANNEL_NAME = "cpc-clearance";

/** Kept for existing listeners: the records array is what changes remotely. */
export const CLEARANCE_STORAGE_KEY = CLEARANCE_RECORDS_KEY;

export function studentNotificationsKey(studentId: string): string {
  return `cpc:notifications:${studentId}`;
}

export const CLEARANCE_NOTIFICATIONS_KEY = studentNotificationsKey(mockStudent.studentId);
