import type { ActivityItem, ActivityStatus } from "@/types/admin";
import { ADMIN_ACTIVITY_KEY, isRecord, readJson, wait, writeJson } from "./storage";

export const FIRST_NAMES = [
  "Alyssa", "John Paul", "Maria", "Kyla", "Joshua", "Angela", "Mark", "Nicole",
  "Christian", "Patricia", "Rafael", "Jasmine", "Daniel", "Bea", "Miguel", "Camille",
  "Jose", "Liza", "Ramon", "Ana", "Paolo", "Sofia", "Gabriel", "Isabel",
  "Marco", "Andrea", "Luis", "Erika", "Carlo", "Hannah", "Nathan", "Mika",
];

export const LAST_NAMES = [
  "Dela Cruz", "Santos", "Reyes", "Villanueva", "Cruz", "Garcia", "Mendoza",
  "Bautista", "Navarro", "Aquino", "Ramos", "Castillo", "Flores", "Gonzales",
  "Torres", "Rivera", "Domingo", "Salazar", "Fernandez", "Pascual",
];

export const PROGRAM_SECTIONS = [
  { program: "BS Information Technology", section: "BSIT 3-A", yearLevel: "3rd Year" },
  { program: "BS Education", section: "BSED 2-B", yearLevel: "2nd Year" },
  { program: "BS Hospitality Management", section: "BSHM 4-A", yearLevel: "4th Year" },
  { program: "BE Elementary Education", section: "BEED 1-C", yearLevel: "1st Year" },
  { program: "BS Business Administration", section: "BSBA 2-A", yearLevel: "2nd Year" },
  { program: "BS Computer Science", section: "BSCS 3-B", yearLevel: "3rd Year" },
];

export type SeedStudent = {
  studentName: string;
  studentId: string;
  program: string;
  section: string;
  yearLevel: string;
  email: string;
};

export function makeStudent(index: number): SeedStudent {
  const program = PROGRAM_SECTIONS[index % PROGRAM_SECTIONS.length];
  const first = FIRST_NAMES[(index * 7 + 3) % FIRST_NAMES.length];
  const last = LAST_NAMES[(index * 11 + 5) % LAST_NAMES.length];

  return {
    studentName: `${first} ${last}`,
    studentId: `STU-2026-${String(100 + index).padStart(4, "0")}`,
    program: program.program,
    section: program.section,
    yearLevel: program.yearLevel,
    email: `${first.toLowerCase().replace(/\s+/g, ".")}.${last
      .toLowerCase()
      .replace(/\s+/g, "")}@cpc.edu.ph`,
  };
}

export function seedActivity(): ActivityItem[] {
  const now = Date.now();
  const alyssa = makeStudent(0);
  const john = makeStudent(7);
  const maria = makeStudent(14);

  return [
    {
      id: "activity-1",
      type: "enrollment",
      message: "New enrollment application submitted",
      actor: alyssa.studentName,
      student: {
        id: alyssa.studentId,
        name: alyssa.studentName,
        program: alyssa.program,
        section: alyssa.section,
        yearLevel: alyssa.yearLevel,
        email: alyssa.email,
      },
      status: "new",
      createdAt: new Date(now - 12 * 60 * 1000).toISOString(),
      href: "/admin/enrollment/applications",
    },
    {
      id: "activity-2",
      type: "clearance",
      message: "Registrar signed a clearance request",
      actor: "Mrs. Liza Reyes",
      student: {
        id: john.studentId,
        name: john.studentName,
        program: john.program,
        section: john.section,
        yearLevel: john.yearLevel,
        email: john.email,
      },
      status: "completed",
      createdAt: new Date(now - 38 * 60 * 1000).toISOString(),
      href: "/admin/clearance-requests",
    },
    {
      id: "activity-3",
      type: "complaint",
      message: "Complaint assigned to the SAO",
      actor: "Prof. Lorna Fernandez",
      student: {
        id: maria.studentId,
        name: maria.studentName,
        program: maria.program,
        section: maria.section,
        yearLevel: maria.yearLevel,
        email: maria.email,
      },
      status: "pending",
      createdAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
      href: "/admin/support/complaints",
    },
    {
      id: "activity-4",
      type: "announcement",
      message: "Published: 2nd semester enrollment schedule",
      actor: "Maria Santos",
      status: "published",
      createdAt: new Date(now - 5 * 60 * 60 * 1000).toISOString(),
      href: "/admin/news/announcements",
    },
    {
      id: "activity-5",
      type: "enrollment",
      message: "Application moved to For Review",
      actor: "Registrar Staff",
      student: {
        id: alyssa.studentId,
        name: alyssa.studentName,
        program: alyssa.program,
        section: alyssa.section,
        yearLevel: alyssa.yearLevel,
        email: alyssa.email,
      },
      status: "pending",
      createdAt: new Date(now - 9 * 60 * 60 * 1000).toISOString(),
      href: "/admin/enrollment/for-review",
    },
  ];
}

export function isActivityStatus(value: unknown): value is ActivityStatus {
  return value === "new" || value === "completed" || value === "pending" || value === "published";
}

export function normalizeActivity(value: unknown): ActivityItem | null {
  if (!isRecord(value)) return null;
  if (
    typeof value.id !== "string" ||
    typeof value.message !== "string" ||
    typeof value.actor !== "string" ||
    typeof value.createdAt !== "string" ||
    !isActivityStatus(value.status) ||
    (value.type !== "enrollment" &&
      value.type !== "clearance" &&
      value.type !== "complaint" &&
      value.type !== "announcement")
  ) {
    return null;
  }

  return {
    id: value.id,
    type: value.type,
    message: value.message,
    actor: value.actor,
    student: isRecord(value.student)
      ? {
          id: typeof value.student.id === "string" ? value.student.id : "",
          name: typeof value.student.name === "string" ? value.student.name : "",
          program: typeof value.student.program === "string" ? value.student.program : "",
          section: typeof value.student.section === "string" ? value.student.section : "",
          yearLevel:
            typeof value.student.yearLevel === "string" ? value.student.yearLevel : "",
          email: typeof value.student.email === "string" ? value.student.email : "",
        }
      : undefined,
    status: value.status,
    createdAt: value.createdAt,
    href: typeof value.href === "string" ? value.href : undefined,
  };
}

export function readActivity(): ActivityItem[] {
  const stored = readJson(ADMIN_ACTIVITY_KEY, null);

  if (Array.isArray(stored)) {
    const normalized = stored
      .map(normalizeActivity)
      .filter((item): item is ActivityItem => item !== null);
    if (normalized.length > 0) return normalized;
  }

  const seeded = seedActivity();
  writeJson(ADMIN_ACTIVITY_KEY, seeded);
  return seeded;
}

export async function getRecentActivity(): Promise<ActivityItem[]> {
  const activity = readActivity().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return wait(activity.slice(0, 30));
}

