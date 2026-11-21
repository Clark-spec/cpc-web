import type {
  DayCode,
  EntryStatus,
  SectionId,
  SectionSchedule,
  ScheduleEntry,
} from "@/types/schedule";

export const MY_SECTION: SectionId = "BSIT-3A";

/** Department order used by the student section picker. */
export const PROGRAM_IDS = ["BSIT", "BSHM", "BEED", "BSED"] as const;
export type ProgramId = (typeof PROGRAM_IDS)[number];

export const YEAR_LEVELS = [1, 2, 3, 4] as const;
export type YearLevel = (typeof YEAR_LEVELS)[number];

export const YEAR_LEVEL_LABELS: Record<YearLevel, string> = {
  1: "1st Year",
  2: "2nd Year",
  3: "3rd Year",
  4: "4th Year",
};

export type SectionCatalogItem = {
  program: ProgramId;
  year: YearLevel;
  letter: string;
  id: SectionId;
};

/** A–D for every year of every department, in the order the portal shows. */
export const SECTION_CATALOG: SectionCatalogItem[] = PROGRAM_IDS.flatMap((program) =>
  YEAR_LEVELS.flatMap((year) =>
    ["A", "B", "C", "D"].map((letter) => ({
      program,
      year,
      letter,
      id: `${program}-${year}${letter}` as SectionId,
    })),
  ),
);

/** Older published BSIT sections stay selectable even though they are outside A–D. */
const LEGACY_SECTIONS: SectionId[] = ["BSIT-1E", "BSIT-1F", "BSIT-1G", "BSIT-2E"];

export const SECTION_IDS: SectionId[] = Array.from(
  new Set([...SECTION_CATALOG.map((item) => item.id), ...LEGACY_SECTIONS]),
);

export function parseSectionId(
  section: string | null | undefined,
): { program: ProgramId; year: YearLevel; letter: string } | null {
  const match = /^([A-Z]+)-([1-4])([A-Z])$/.exec(String(section ?? "").toUpperCase());
  if (!match) return null;
  const program = PROGRAM_IDS.find((id) => id === match[1]);
  if (!program) return null;
  return { program, year: Number(match[2]) as YearLevel, letter: match[3] };
}

export type SectionGroup = {
  program: ProgramId;
  years: { year: YearLevel; sections: SectionId[] }[];
};

/** Groups any section list into department → year level → sections. */
export function groupSections(sections: SectionId[]): SectionGroup[] {
  const grouped = new Map<ProgramId, Map<YearLevel, Set<string>>>();
  sections.forEach((section) => {
    const parsed = parseSectionId(section);
    if (!parsed) return;
    if (!grouped.has(parsed.program)) grouped.set(parsed.program, new Map());
    const years = grouped.get(parsed.program)!;
    if (!years.has(parsed.year)) years.set(parsed.year, new Set());
    years.get(parsed.year)!.add(parsed.letter);
  });

  return PROGRAM_IDS.map((program) => ({
    program,
    years: YEAR_LEVELS.map((year) => ({
      year,
      sections: Array.from(grouped.get(program)?.get(year) ?? [])
        .sort()
        .map((letter) => `${program}-${year}${letter}` as SectionId),
    })).filter((item) => item.sections.length > 0),
  })).filter((group) => group.years.length > 0);
}

export const SEMESTER = "1st Semester";
export const ACADEMIC_YEAR = "2026-2027";

const MWF: DayCode[] = ["MON", "WED", "FRI"];
const TTH: DayCode[] = ["TUE", "THU"];
const SAT: DayCode[] = ["SAT"];

/** Subject identity (code, title, palette) is shared by every section. */
const SUBJECTS = [
  { code: "HCI 1", title: "Human Computer Interaction 1", colorKey: "blue" },
  { code: "OS", title: "Operating System", colorKey: "emerald" },
  { code: "IT ELEC 2", title: "Object Oriented Programming 2", colorKey: "violet" },
  { code: "SOC SCI 1", title: "Phil Constitution and Government", colorKey: "amber" },
  { code: "IAS 1", title: "Information Assurance and Security 1", colorKey: "rose" },
  { code: "NET 2", title: "Networking 2", colorKey: "sky" },
  { code: "IM 2", title: "Information Management 2", colorKey: "teal" },
  { code: "IT TRACK EL 2", title: "Fundamentals of Business Analytics", colorKey: "orange" },
  { code: "APPSDEV", title: "Application Development", colorKey: "indigo" },
] as const;

type SlotOptions = {
  days: DayCode[];
  /** minutes from midnight */
  start: number;
  end: number;
  roomA: string;
  roomB: string;
  instructor: string;
  status?: EntryStatus;
};

const hm = (hour: number, minute = 0): number => hour * 60 + minute;

/** Builds one row, keeping the subject metadata and color token consistent. */
function slot(
  section: SectionId,
  subjectIndex: number,
  options: SlotOptions,
): ScheduleEntry {
  const subject = SUBJECTS[subjectIndex];
  return {
    id: `${section}-${subject.code.replace(/\s+/g, "-").toLowerCase()}`,
    subjectCode: subject.code,
    title: subject.title,
    days: options.days,
    startMin: options.start,
    endMin: options.end,
    roomSetA: options.roomA,
    roomSetB: options.roomB,
    units: 3,
    instructor: options.instructor,
    status: options.status ?? "active",
    colorKey: subject.colorKey,
  };
}

/**
 * Section BSIT-3A uses the exact registrar data supplied for the page.
 * The three remaining sections follow the same nine subjects with different
 * slots, rooms and teachers; no two live classes share a teacher or a room.
 */
const BSIT_3A: ScheduleEntry[] = [
  slot("BSIT-3A", 0, { days: MWF, start: hm(10), end: hm(11), roomA: "LAB 2", roomB: "ONLINE", instructor: "I. Eda" }),
  slot("BSIT-3A", 1, { days: MWF, start: hm(12), end: hm(13), roomA: "LAB 2", roomB: "ONLINE", instructor: "T. Comayas", status: "not_active" }),
  slot("BSIT-3A", 2, { days: MWF, start: hm(13), end: hm(14), roomA: "LAB 1", roomB: "ONLINE", instructor: "I. Eda" }),
  slot("BSIT-3A", 3, { days: TTH, start: hm(13, 30), end: hm(15), roomA: "302", roomB: "ONLINE", instructor: "J. Cadungog" }),
  slot("BSIT-3A", 4, { days: TTH, start: hm(15), end: hm(16, 30), roomA: "LAB 3", roomB: "ONLINE", instructor: "B. Empaces" }),
  slot("BSIT-3A", 5, { days: TTH, start: hm(16, 30), end: hm(18), roomA: "LAB 2", roomB: "ONLINE", instructor: "T. Comayas" }),
  slot("BSIT-3A", 6, { days: SAT, start: hm(7), end: hm(10), roomA: "LAB 1", roomB: "LAB 1", instructor: "E. Tajanlangit" }),
  slot("BSIT-3A", 7, { days: SAT, start: hm(10), end: hm(13), roomA: "TENT 2", roomB: "ONLINE", instructor: "A. Entrena" }),
  slot("BSIT-3A", 8, { days: SAT, start: hm(16), end: hm(19), roomA: "LAB 1", roomB: "LAB 1", instructor: "A. Batoon" }),
];

const BSIT_3B: ScheduleEntry[] = [
  slot("BSIT-3B", 0, { days: MWF, start: hm(8), end: hm(9), roomA: "LAB 3", roomB: "ONLINE", instructor: "I. Eda" }),
  slot("BSIT-3B", 1, { days: MWF, start: hm(9), end: hm(10), roomA: "LAB 3", roomB: "ONLINE", instructor: "T. Comayas" }),
  slot("BSIT-3B", 2, { days: MWF, start: hm(11), end: hm(12), roomA: "LAB 1", roomB: "ONLINE", instructor: "R. Dela Cruz" }),
  slot("BSIT-3B", 3, { days: TTH, start: hm(9), end: hm(10, 30), roomA: "301", roomB: "ONLINE", instructor: "J. Cadungog" }),
  slot("BSIT-3B", 4, { days: TTH, start: hm(10, 30), end: hm(12), roomA: "LAB 2", roomB: "ONLINE", instructor: "B. Empaces" }),
  slot("BSIT-3B", 5, { days: TTH, start: hm(14), end: hm(15, 30), roomA: "LAB 2", roomB: "ONLINE", instructor: "M. Santos" }),
  slot("BSIT-3B", 6, { days: SAT, start: hm(10), end: hm(13), roomA: "LAB 2", roomB: "LAB 2", instructor: "E. Tajanlangit" }),
  slot("BSIT-3B", 7, { days: SAT, start: hm(10), end: hm(13), roomA: "TENT 1", roomB: "ONLINE", instructor: "A. Entrena", status: "not_active" }),
  slot("BSIT-3B", 8, { days: SAT, start: hm(13), end: hm(16), roomA: "LAB 3", roomB: "LAB 3", instructor: "A. Batoon" }),
];

const BSIT_3C: ScheduleEntry[] = [
  slot("BSIT-3C", 0, { days: TTH, start: hm(7), end: hm(8, 30), roomA: "LAB 1", roomB: "ONLINE", instructor: "R. Dela Cruz" }),
  slot("BSIT-3C", 1, { days: TTH, start: hm(8, 30), end: hm(10), roomA: "LAB 1", roomB: "ONLINE", instructor: "T. Comayas", status: "not_active" }),
  slot("BSIT-3C", 2, { days: MWF, start: hm(14), end: hm(15), roomA: "LAB 2", roomB: "ONLINE", instructor: "I. Eda" }),
  slot("BSIT-3C", 3, { days: MWF, start: hm(15), end: hm(16), roomA: "303", roomB: "ONLINE", instructor: "J. Cadungog" }),
  slot("BSIT-3C", 4, { days: MWF, start: hm(16), end: hm(17), roomA: "LAB 3", roomB: "ONLINE", instructor: "B. Empaces" }),
  slot("BSIT-3C", 5, { days: SAT, start: hm(7), end: hm(10), roomA: "LAB 3", roomB: "LAB 3", instructor: "M. Santos" }),
  slot("BSIT-3C", 6, { days: SAT, start: hm(13), end: hm(16), roomA: "LAB 2", roomB: "LAB 2", instructor: "E. Tajanlangit" }),
  slot("BSIT-3C", 7, { days: SAT, start: hm(16), end: hm(19), roomA: "TENT 2", roomB: "ONLINE", instructor: "A. Entrena" }),
  slot("BSIT-3C", 8, { days: TTH, start: hm(13), end: hm(16), roomA: "LAB 1", roomB: "LAB 1", instructor: "A. Batoon" }),
];

const BSIT_3D: ScheduleEntry[] = [
  slot("BSIT-3D", 0, { days: MWF, start: hm(7), end: hm(8), roomA: "LAB 2", roomB: "ONLINE", instructor: "I. Eda" }),
  slot("BSIT-3D", 1, { days: MWF, start: hm(8), end: hm(9), roomA: "LAB 2", roomB: "ONLINE", instructor: "M. Santos" }),
  slot("BSIT-3D", 2, { days: TTH, start: hm(10), end: hm(11, 30), roomA: "LAB 3", roomB: "ONLINE", instructor: "R. Dela Cruz" }),
  slot("BSIT-3D", 3, { days: TTH, start: hm(11, 30), end: hm(13), roomA: "304", roomB: "ONLINE", instructor: "J. Cadungog" }),
  slot("BSIT-3D", 4, { days: TTH, start: hm(13), end: hm(14, 30), roomA: "LAB 3", roomB: "ONLINE", instructor: "B. Empaces" }),
  slot("BSIT-3D", 5, { days: MWF, start: hm(14), end: hm(15), roomA: "LAB 1", roomB: "ONLINE", instructor: "T. Comayas" }),
  slot("BSIT-3D", 6, { days: SAT, start: hm(16), end: hm(19), roomA: "LAB 3", roomB: "LAB 3", instructor: "E. Tajanlangit" }),
  slot("BSIT-3D", 7, { days: SAT, start: hm(13), end: hm(16), roomA: "TENT 1", roomB: "ONLINE", instructor: "A. Entrena" }),
  slot("BSIT-3D", 8, { days: SAT, start: hm(16), end: hm(19), roomA: "LAB 2", roomB: "LAB 2", instructor: "A. Batoon", status: "not_active" }),
];

const BEED_2A: ScheduleEntry[] = [
  slot("BEED-2A", 3, { days: MWF, start: hm(8), end: hm(9), roomA: "301", roomB: "ONLINE", instructor: "J. Cadungog" }),
  slot("BEED-2A", 0, { days: MWF, start: hm(9), end: hm(10), roomA: "301", roomB: "ONLINE", instructor: "M. Santos" }),
  slot("BEED-2A", 5, { days: TTH, start: hm(10), end: hm(11, 30), roomA: "302", roomB: "ONLINE", instructor: "J. Cadungog" }),
];

const BSHM_1A: ScheduleEntry[] = [
  slot("BSHM-1A", 7, { days: MWF, start: hm(10), end: hm(11), roomA: "TENT 1", roomB: "ONLINE", instructor: "A. Entrena" }),
  slot("BSHM-1A", 1, { days: TTH, start: hm(13), end: hm(14, 30), roomA: "303", roomB: "ONLINE", instructor: "A. Entrena" }),
  slot("BSHM-1A", 3, { days: SAT, start: hm(8), end: hm(11), roomA: "304", roomB: "ONLINE", instructor: "M. Santos" }),
];

export const SCHEDULES: SectionSchedule[] = [
  { section: "BSIT-3A", semester: SEMESTER, academicYear: ACADEMIC_YEAR, entries: BSIT_3A },
  { section: "BSIT-3B", semester: SEMESTER, academicYear: ACADEMIC_YEAR, entries: BSIT_3B },
  { section: "BSIT-3C", semester: SEMESTER, academicYear: ACADEMIC_YEAR, entries: BSIT_3C },
  { section: "BSIT-3D", semester: SEMESTER, academicYear: ACADEMIC_YEAR, entries: BSIT_3D },
  { section: "BEED-2A", semester: SEMESTER, academicYear: ACADEMIC_YEAR, entries: BEED_2A },
  { section: "BSHM-1A", semester: SEMESTER, academicYear: ACADEMIC_YEAR, entries: BSHM_1A },
];

export function isSectionId(value: string | null | undefined): value is SectionId {
  return value !== null && value !== undefined && (SECTION_IDS as string[]).includes(value);
}

export function getSchedule(section: SectionId): SectionSchedule {
  return SCHEDULES.find((item) => item.section === section) ?? SCHEDULES[0];
}

