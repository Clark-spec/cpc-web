import type { ActivityItem, ActivityStatus } from "@/types/admin";
import { ADMIN_ACTIVITY_KEY, isRecord, readJson, wait, writeJson } from "./storage";

function isActivityStatus(value: unknown): value is ActivityStatus {
  return value === "new" || value === "completed" || value === "pending" || value === "published";
}
function normalizeActivity(value: unknown): ActivityItem | null {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.message !== "string" || typeof value.actor !== "string" || typeof value.createdAt !== "string" || !isActivityStatus(value.status) || !["enrollment", "clearance", "complaint", "announcement"].includes(String(value.type))) return null;
  return {
    id: value.id,
    type: value.type as ActivityItem["type"],
    message: value.message,
    actor: value.actor,
    student: isRecord(value.student) ? {
      id: typeof value.student.id === "string" ? value.student.id : "",
      name: typeof value.student.name === "string" ? value.student.name : "",
      program: typeof value.student.program === "string" ? value.student.program : "",
      section: typeof value.student.section === "string" ? value.student.section : "",
      yearLevel: typeof value.student.yearLevel === "string" ? value.student.yearLevel : "",
      email: typeof value.student.email === "string" ? value.student.email : "",
    } : undefined,
    status: value.status,
    createdAt: value.createdAt,
    href: typeof value.href === "string" ? value.href : undefined,
  };
}
export function readActivity(): ActivityItem[] {
  const stored: unknown = readJson(ADMIN_ACTIVITY_KEY, []);
  if (!Array.isArray(stored)) return [];
  const rows = stored.map(normalizeActivity).filter((row): row is ActivityItem => row !== null && !/^activity-\d+$/.test(row.id));
  if (rows.length !== stored.length) writeJson(ADMIN_ACTIVITY_KEY, rows);
  return rows;
}
export async function getRecentActivity(): Promise<ActivityItem[]> {
  return wait(readActivity().sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 30));
}
/** Store activity caused by an actual authenticated staff action. */
export function recordAdminActivity(item: Omit<ActivityItem, "id" | "createdAt">): void {
  const entry: ActivityItem = { ...item, id: `act-${Date.now()}-${Math.floor(Math.random() * 1000)}`, createdAt: new Date().toISOString() };
  writeJson(ADMIN_ACTIVITY_KEY, [entry, ...readActivity()].slice(0, 50));
}
