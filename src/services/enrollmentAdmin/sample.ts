/**
 * Deterministic sample dataset generator for enrollment applications.
 */

import type {
  EnrollmentApplication,
  EnrollmentApplicationStatus,
  EnrollmentProgramCode,
  EnrollmentRequirement,
} from "./types";
import { ENROLLMENT_PROGRAMS } from "./types";

const FIRST_NAMES = [
  "Alyssa",
  "John Paul",
  "Maria",
  "Kyla",
  "Joshua",
  "Angela",
  "Mark",
  "Nicole",
  "Christian",
  "Patricia",
  "Rafael",
  "Jasmine",
  "Daniel",
  "Bea",
  "Miguel",
  "Camille",
  "Jose",
  "Liza",
  "Ramon",
  "Ana",
  "Paolo",
  "Sofia",
  "Gabriel",
  "Isabel",
  "Marco",
  "Andrea",
  "Luis",
  "Erika",
  "Carlo",
  "Hannah",
  "Nathan",
  "Mika",
];

const LAST_NAMES = [
  "Dela Cruz",
  "Santos",
  "Reyes",
  "Villanueva",
  "Cruz",
  "Garcia",
  "Mendoza",
  "Bautista",
  "Navarro",
  "Aquino",
  "Ramos",
  "Castillo",
  "Flores",
  "Gonzales",
  "Torres",
  "Rivera",
  "Domingo",
  "Salazar",
  "Fernandez",
  "Pascual",
  "Mercado",
  "Lim",
  "Ocampo",
  "Velasco",
  "Padilla",
  "Rosales",
  "Santiago",
  "Cortez",
  "Alvarez",
  "Yu",
];

const YEAR_LEVELS = ["1st Year", "2nd Year", "3rd Year", "4th Year"] as const;

const REQUIREMENT_CATALOG = [
  "Form 138 (Report Card)",
  "PSA Birth Certificate",
  "Good Moral Certificate",
  "2x2 ID Photo",
  "Honorable Dismissal",
  "Medical Certificate",
];

/** Distribution matches the existing dashboard KPI totals. */
const STATUS_PLAN: Array<[EnrollmentApplicationStatus, number]> = [
  ["pending", 126],
  ["for-review", 42],
  ["needs-requirements", 21],
  ["approved", 78],
  ["rejected", 5],
];

/** Weekly intake ending with the current week; sums to the status plan total. */
const WEEK_VOLUMES = [24, 31, 28, 36, 33, 41, 38, 41];

/** Realistic program mix; also sums to the status plan total. */
const PROGRAM_PLAN: Array<[EnrollmentProgramCode, number]> = [
  ["BSIT", 96],
  ["BSBA", 62],
  ["BEED", 55],
  ["BSHM", 59],
];

export const ENROLLMENT_DAY_MS = 24 * 60 * 60 * 1000;

function createRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
}

function buildStatusPool(): EnrollmentApplicationStatus[] {
  return STATUS_PLAN.flatMap(([status, count]) =>
    Array.from({ length: count }, () => status),
  );
}

function pickRequirements(
  status: EnrollmentApplicationStatus,
  random: () => number,
): EnrollmentRequirement[] {
  const start = Math.floor(random() * REQUIREMENT_CATALOG.length);
  const labels = Array.from(
    { length: 4 },
    (_, index) => REQUIREMENT_CATALOG[(start + index) % REQUIREMENT_CATALOG.length],
  );

  const missing = status === "needs-requirements" ? 2 : status === "rejected" ? 1 : 0;
  const submittedFlags = labels.map(() => true);

  for (let index = 0; index < missing; index += 1) {
    submittedFlags[(Math.floor(random() * labels.length) + index) % labels.length] = false;
  }

  return labels.map((label, index) => ({ label, submitted: submittedFlags[index] }));
}

function noteFor(
  status: EnrollmentApplicationStatus,
  requirements: EnrollmentRequirement[],
): string {
  const missing = requirements.find((item) => !item.submitted);

  switch (status) {
    case "approved":
      return "Credentials verified. Applicant cleared for the current term.";
    case "needs-requirements":
      return missing
        ? `Missing requirement: ${missing.label}. Applicant notified.`
        : "Additional documents are required before review continues.";
    case "rejected":
      return "Application returned. Applicant advised to reapply in the next enrollment period.";
    case "for-review":
      return "Documents complete. Queued for registrar verification.";
    default:
      return "Submitted online. Awaiting document verification.";
  }
}

/**
 * Builds the demo applications deterministically so counts, charts and the
 * table always agree with each other on a fresh load.
 */
export function buildSampleApplications(now = Date.now()): EnrollmentApplication[] {
  const random = createRandom(20261105);
  const total = WEEK_VOLUMES.reduce((sum, value) => sum + value, 0);
  const statuses = shuffle(buildStatusPool(), random);
  const programPool = shuffle(
    PROGRAM_PLAN.flatMap(([code, count]) => Array.from({ length: count }, () => code)),
    random,
  );
  const programByCode = new Map(
    ENROLLMENT_PROGRAMS.map((program) => [program.code, program]),
  );

  // Assign every record to a week so the trend chart has a natural shape.
  const weekForIndex: number[] = [];
  WEEK_VOLUMES.forEach((count, week) => {
    for (let index = 0; index < count; index += 1) weekForIndex.push(week);
  });

  const seenThisWeek = new Map<number, number>();
  const weekCount = WEEK_VOLUMES.length;

  return Array.from({ length: total }, (_, index) => {
    const week = weekForIndex[index] ?? weekCount - 1;
    const position = seenThisWeek.get(week) ?? 0;
    seenThisWeek.set(week, position + 1);

    const daysAgo = (weekCount - 1 - week) * 7 + (position % 7);
    const hoursAgo = (position % 9) * 2 + 1;
    const submittedAt = new Date(now - daysAgo * ENROLLMENT_DAY_MS - hoursAgo * 60 * 60 * 1000).toISOString();

    const program = programByCode.get(programPool[index] ?? "BSIT") ?? ENROLLMENT_PROGRAMS[0];
    const status = statuses[index] ?? "pending";
    const first = FIRST_NAMES[(index * 7 + 3) % FIRST_NAMES.length];
    const last = LAST_NAMES[(index * 11 + 5) % LAST_NAMES.length];
    const studentId = `STU-2026-${String(1000 + index).padStart(4, "0")}`;
    const requirements = pickRequirements(status, random);

    const respondedAt =
      status === "approved" || status === "rejected"
        ? new Date(
            now - Math.max(0, daysAgo - 2) * ENROLLMENT_DAY_MS - ((position % 5) + 1) * 60 * 60 * 1000,
          ).toISOString()
        : undefined;

    return {
      id: `APP-2026-${String(index + 1).padStart(4, "0")}`,
      studentName: `${first} ${last}`,
      studentId,
      programCode: program.code,
      program: program.name,
      yearLevel: YEAR_LEVELS[index % YEAR_LEVELS.length],
      email: `${first.toLowerCase().replace(/\s+/g, ".")}.${last
        .toLowerCase()
        .replace(/\s+/g, "")}${index % 97}@cpc.edu.ph`,
      submittedAt,
      status,
      note: noteFor(status, requirements),
      requirements,
      respondedAt,
    };
  });
}

