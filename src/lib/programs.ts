/**
 * Canonical program names shared by the student and staff clearance portals.
 *
 * A student session supplies a short course code (`BSIT`, `BEED`, `BSHM`),
 * while dean accounts scope requests by the full program name. Normalizing in
 * one place keeps both sides comparing the same value without duplicating the
 * aliases in every service.
 */
import type { OfficeId } from "@/types/clearance";

export const PROGRAM_NAMES = {
  BSIT: "BS Information Technology",
  BEED: "Bachelor of Elementary Education",
  BSHM: "BS Hospitality Management",
} as const;

export type ProgramCode = keyof typeof PROGRAM_NAMES;

export type ClearanceNotificationTarget = {
  /** The only staff role that should receive the notification. */
  targetRole:
    | "dean_cs"
    | "dean_edu"
    | "dean_hm"
    | "instructor"
    | "library"
    | "registrar"
    | "accounting"
    | "sao";
  /** Set for dean requests so the dean check also validates the program. */
  department?: ProgramCode;
};

const DEAN_ROLE_BY_PROGRAM: Record<ProgramCode, ClearanceNotificationTarget["targetRole"]> = {
  BSIT: "dean_cs",
  BEED: "dean_edu",
  BSHM: "dean_hm",
};

const OFFICE_ROLE: Record<Exclude<OfficeId, "dean">, ClearanceNotificationTarget["targetRole"]> = {
  instructor: "instructor",
  library: "library",
  registrar: "registrar",
  accounting: "accounting",
  sao: "sao",
};

const PROGRAM_CODES: Record<string, string> = {
  BSIT: PROGRAM_NAMES.BSIT,
  BEED: PROGRAM_NAMES.BEED,
  BSHM: PROGRAM_NAMES.BSHM,
};

/** Maps course codes and the backend's full course names to one canonical name. */
export function canonicalProgram(program: string | null | undefined): string {
  const value = (program ?? "").trim();
  const normalized = value.toUpperCase().replace(/[^A-Z]/g, "");

  if (normalized.includes("INFORMATIONTECHNOLOGY")) return PROGRAM_NAMES.BSIT;
  if (normalized.includes("HOSPITALITYMANAGEMENT")) return PROGRAM_NAMES.BSHM;
  if (normalized.includes("ELEMENTARYEDUCATION")) return PROGRAM_NAMES.BEED;

  return PROGRAM_CODES[normalized] ?? value;
}

/** Compares programs after canonicalization, including legacy stored values. */
export function programMatches(
  left: string | null | undefined,
  right: string | null | undefined,
): boolean {
  const a = canonicalProgram(left).toLowerCase();
  const b = canonicalProgram(right).toLowerCase();
  return a.length > 0 && b.length > 0 && (a === b || a.includes(b) || b.includes(a));
}

/** Resolves the one canonical program code for a stored course value. */
export function programCode(program: string | null | undefined): ProgramCode | null {
  const canonical = canonicalProgram(program);
  const found = (Object.keys(PROGRAM_NAMES) as ProgramCode[]).find(
    (code) => PROGRAM_NAMES[code] === canonical,
  );
  return found ?? null;
}

/**
 * Routes a clearance notification to exactly one intended staff account.
 * Dean requests go to the dean of the student's own program; every other
 * office goes to that office only.
 */
export function clearanceNotificationTarget(
  office: OfficeId,
  program?: string | null,
): ClearanceNotificationTarget | null {
  if (office === "dean") {
    const department = programCode(program);
    return department ? { targetRole: DEAN_ROLE_BY_PROGRAM[department], department } : null;
  }
  return { targetRole: OFFICE_ROLE[office] };
}
