/**
 * Seed data for the ADMIN Class Schedules module.
 *
 * The four sections themselves are NOT duplicated here: `./mockSchedules`
 * is the one list both portals use, so a seed schedule published from this file
 * is byte-identical to what the student page already renders. What the seed
 * adds is the master data the staff portal needs (subject / instructor / room
 * records with stable ids) and the link pass that stamps those ids onto the
 * shared entries, because renaming master data must propagate by id instead of
 * rewriting every entry.
 */
import { SCHEDULES, SEMESTER, ACADEMIC_YEAR } from "./mockSchedules";
import type { SectionId, SectionSchedule, ScheduleEntry } from "@/types/schedule";
import type {
  Instructor,
  PublishedSchedule,
  Room,
  ScheduleChange,
  ScheduleMasterData,
  SectionMeta,
  Subject,
} from "@/types/scheduleAdmin";

/* ---------------------------------------------------------------- subjects */

const SUBJECT_SEED: Array<Omit<Subject, "id">> = [
  { code: "HCI 1", title: "Human Computer Interaction 1", units: 3, colorKey: "blue", active: true },
  { code: "OS", title: "Operating System", units: 3, colorKey: "emerald", active: true },
  { code: "IT ELEC 2", title: "Object Oriented Programming 2", units: 3, colorKey: "violet", active: true },
  { code: "SOC SCI 1", title: "Phil Constitution and Government", units: 3, colorKey: "amber", active: true },
  { code: "IAS 1", title: "Information Assurance and Security 1", units: 3, colorKey: "rose", active: true },
  { code: "NET 2", title: "Networking 2", units: 3, colorKey: "sky", active: true },
  { code: "IM 2", title: "Information Management 2", units: 3, colorKey: "teal", active: true },
  { code: "IT TRACK EL 2", title: "Fundamentals of Business Analytics", units: 3, colorKey: "orange", active: true },
  { code: "APPSDEV", title: "Application Development", units: 3, colorKey: "indigo", active: true },
];

/* ------------------------------------------------------------- instructors */

const INSTRUCTOR_SEED: Array<Omit<Instructor, "id">> = [
  { displayName: "I. Eda", fullName: "Isagani M. Eda", department: "Computer Science", maxUnits: 21, active: true },
  { displayName: "T. Comayas", fullName: "Teodolfo R. Comayas", department: "Computer Science", maxUnits: 21, active: true },
  { displayName: "J. Cadungog", fullName: "Josephine A. Cadungog", department: "General Education", maxUnits: 21, active: true },
  { displayName: "B. Empaces", fullName: "Bryon C. Empaces", department: "Information Technology", maxUnits: 21, active: true },
  { displayName: "E. Tajanlangit", fullName: "Emmanuel V. Tajanlangit", department: "Information Technology", maxUnits: 18, active: true },
  { displayName: "A. Entrena", fullName: "Arlyn D. Entrena", department: "Business Administration", maxUnits: 18, active: true },
  { displayName: "A. Batoon", fullName: "Adrian P. Batoon", department: "Computer Science", maxUnits: 18, active: true },
  { displayName: "R. Dela Cruz", fullName: "Rowena T. Dela Cruz", department: "Information Technology", maxUnits: 18, active: true },
  { displayName: "M. Santos", fullName: "Marco L. Santos", department: "General Education", maxUnits: 18, active: true },
];

/* ------------------------------------------------------------------- rooms */

const ROOM_SEED: Array<Omit<Room, "id">> = [
  { name: "LAB 1", type: "lab", capacity: 40, active: true },
  { name: "LAB 2", type: "lab", capacity: 40, active: true },
  { name: "LAB 3", type: "lab", capacity: 35, active: true },
  { name: "301", type: "lecture", capacity: 45, active: true },
  { name: "302", type: "lecture", capacity: 45, active: true },
  { name: "303", type: "lecture", capacity: 45, active: true },
  { name: "304", type: "lecture", capacity: 40, active: true },
  { name: "TENT 1", type: "tent", active: true },
  { name: "TENT 2", type: "tent", active: true },
  { name: "ONLINE", type: "online", active: true },
];

const SECTION_META_SEED: Array<Omit<SectionMeta, "section">> = [
  { semester: SEMESTER, academicYear: ACADEMIC_YEAR, adviser: "I. Eda", studentCount: 42 },
  { semester: SEMESTER, academicYear: ACADEMIC_YEAR, adviser: "T. Comayas", studentCount: 39 },
  { semester: SEMESTER, academicYear: ACADEMIC_YEAR, adviser: "B. Empaces", studentCount: 44 },
  { semester: SEMESTER, academicYear: ACADEMIC_YEAR, adviser: "R. Dela Cruz", studentCount: 41 },
];

const SECTION_ORDER: SectionId[] = ["BSIT-3A", "BSIT-3B", "BSIT-3C", "BSIT-3D"];

/** "HCI 1" -> "subj-hci-1"; keeps ids readable in the change history. */
export function slugId(prefix: string, value: string): string {
  return `${prefix}-${value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}`;
}

export function seedMasterData(): ScheduleMasterData {
  return {
    subjects: SUBJECT_SEED.map((subject) => ({ ...subject, id: slugId("subj", subject.code) })),
    instructors: INSTRUCTOR_SEED.map((instructor) => ({
      ...instructor,
      id: slugId("inst", instructor.displayName),
    })),
    rooms: ROOM_SEED.map((room) => ({ ...room, id: slugId("room", room.name) })),
    sections: SECTION_ORDER.map((section, index) => ({
      section,
      ...SECTION_META_SEED[index],
    })),
  };
}

/* ----------------------------------------------------------- id link pass */

/**
 * Stamps the admin-only ids onto a student-side entry. Matching is by the
 * strings the student page already shows, so the seed and any CSV import end up
 * in the same shape; anything unknown (a room typed by hand) is left unset and
 * the entry keeps working on its plain strings.
 */
export function linkEntryToMaster(entry: ScheduleEntry, master: ScheduleMasterData): ScheduleEntry {
  const subject = master.subjects.find((item) => item.code === entry.subjectCode);
  const instructor = master.instructors.find((item) => item.displayName === entry.instructor);
  const roomA = master.rooms.find((item) => item.name === entry.roomSetA);
  const roomB = master.rooms.find((item) => item.name === entry.roomSetB);
  return {
    ...entry,
    subjectId: subject?.id ?? entry.subjectId,
    instructorId: instructor?.id ?? entry.instructorId,
    roomAId: roomA?.id ?? entry.roomAId,
    roomBId: roomB?.id ?? entry.roomBId,
  };
}

export function linkSchedulesToMaster(
  schedules: SectionSchedule[],
  master: ScheduleMasterData,
): SectionSchedule[] {
  return schedules.map((schedule) => ({
    ...schedule,
    entries: schedule.entries.map((entry) => linkEntryToMaster(entry, master)),
  }));
}

/**
 * Published v7. `@/services/mockSchedules` is the student page's own data, so this
 * is what students are already looking at — publishing v8 has to show a real
 * diff against it, not an empty baseline.
 */
export const SEED_PUBLISHED_VERSION = 7;
export const SEED_PUBLISHED_AT = "2026-10-04T01:12:00.000Z";

export function seedPublishedSchedule(): PublishedSchedule {
  const master = seedMasterData();
  const schedules = linkSchedulesToMaster(SCHEDULES, master);
  return {
    version: SEED_PUBLISHED_VERSION,
    publishedAt: SEED_PUBLISHED_AT,
    publishedBy: "Registrar",
    schedules,
    archive: [
      {
        version: 6,
        publishedAt: "2026-09-21T01:05:00.000Z",
        publishedBy: "Registrar",
        // One earlier revision so "Restore this version" has something to show:
        // 3A's OS class was still active in v6.
        schedules: schedules.map((schedule) =>
          schedule.section === "BSIT-3A"
            ? {
                ...schedule,
                entries: schedule.entries.map((entry) =>
                  entry.subjectCode === "OS" ? { ...entry, status: "active" as const } : entry,
                ),
              }
            : schedule,
        ),
      },
    ],
  };
}

export function seedHistory(published: PublishedSchedule): ScheduleChange[] {
  return [
    {
      id: "chg-seed-publish",
      at: published.publishedAt,
      actor: published.publishedBy,
      type: "published",
      section: "BSIT-3A",
      detail: `Published version ${published.version} for all four sections.`,
    },
    {
      id: "chg-seed-edit",
      at: "2026-10-03T08:20:00.000Z",
      actor: "Registrar",
      type: "edited",
      section: "BSIT-3A",
      detail: "OS set to Not Active pending the room reassignment.",
    },
    {
      id: "chg-seed-import",
      at: "2026-09-20T02:40:00.000Z",
      actor: "Registrar",
      type: "imported",
      section: "BSIT-3D",
      detail: "Imported 9 rows from the summer CSV.",
    },
  ];
}

