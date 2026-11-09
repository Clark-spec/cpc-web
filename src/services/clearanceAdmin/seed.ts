import {
  createInitialOffices,
  mockEvents,
  mockSubjects,
  officeSignerNames,
} from "@/services/clearanceStudent/mock";
import type {
  ClearanceRecord,
  OfficeSignature,
  TimelineEvent,
} from "@/types/clearance";
import { OFFICE_LABELS, OFFICE_ORDER } from "@/components/features/admin/clearance/officeChecks";
import { MAX_TIMELINE, newId } from "./primitives";

export const FIRST_NAMES = [
  "Kyla", "Nicole", "Jasmine", "Angela", "Paolo", "Marcus", "Andrea", "Mika",
  "Daniel", "Rhea", "Joshua", "Camille", "Trisha", "Nathan", "Aira", "Bianca",
  "Carlo", "Dana", "Ella", "Ferdinand", "Gwen", "Hannah", "Ivan", "Janelle",
  "Kirk", "Liza", "Miguel", "Naomi", "Omar", "Patricia", "Quincy", "Rafael",
  "Sofia", "Trevor", "Ulrich", "Vera", "Wilhelm", "Xander", "Yuki", "Zara",
];

export const LAST_NAMES = [
  "Garcia", "Gonzales", "Santos", "Pascual", "Reyes", "Villanueva", "Cruz",
  "Fernandez", "Dela Cruz", "Alvarez", "Bautista", "Castillo", "Domingo",
  "Estrada", "Flores", "Gutierrez", "Hidalgo", "Ibarra", "Javellana", "Lopez",
  "Mendoza", "Navarro", "Ocampo", "Padilla", "Quiambao", "Ramos", "Salazar",
  "Torres", "Uy", "Valdez", "Aquino", "Bartolome", "Cabrera", "Del Rosario",
  "Espiritu", "Fajardo", "Galan", "Herrera", "Ilagan", "Jimenez",
];

export const SECTIONS = ["BSIT 3-A", "BSIT 3-B", "BSIT 3-C", "BSIT 3-D"];

/** Six students deliberately parked past the three-day SLA. */
export const OVERDUE_STUDENTS = new Set([3, 9, 17, 24, 31, 38]);

export const NOTE_LINES = [
  "Requesting clearance for 2nd semester enrollment.",
  "Please sign before the filing deadline on Friday.",
  "I will settle any pending fee once this is signed.",
  "Needed for an OJT deployment endorsement.",
];

export function seedStatusFor(
  index: number,
  officeIndex: number,
): OfficeSignature["status"] {
  // Every thirteenth student is fully cleared, to exercise the reference
  // number and the completed state on the student page.
  if (index % 13 === 0) return "signed";
  if (index % 17 === 0 && officeIndex === 2) return "rejected";

  const roll = (index * 7 + officeIndex * 13) % 10;
  if (roll <= 3) return "requested";
  if (roll <= 7) return "signed";
  if (roll === 8) return "rejected";
  return "not_requested";
}

export function seedRequestedAt(index: number, officeIndex: number, now: number): string {
  const hoursAgo = OVERDUE_STUDENTS.has(index)
    ? 24 * (4 + (index % 5))
    : 1 + ((index * 5 + officeIndex * 3) % 44);
  return new Date(now - hoursAgo * 3_600_000).toISOString();
}

export function seedOffices(index: number, now: number): OfficeSignature[] {
  return OFFICE_ORDER.map((office, officeIndex) => {
    const status = seedStatusFor(index, officeIndex);
    if (status === "not_requested") {
      return { office, label: OFFICE_LABELS[office], status };
    }

    const requestedAt = seedRequestedAt(index, officeIndex, now);
    const base: OfficeSignature = {
      office,
      label: OFFICE_LABELS[office],
      status,
      requestedAt,
    };

    if (status === "requested") {
      return index % 9 === 2
        ? { ...base, studentNote: NOTE_LINES[index % NOTE_LINES.length] }
        : base;
    }

    const respondedAt = new Date(
      Date.parse(requestedAt) + (3 + ((index + officeIndex) % 40)) * 3_600_000,
    ).toISOString();

    if (status === "rejected") {
      return {
        ...base,
        respondedAt,
        signerName: officeSignerNames[office],
        remarks: "Please settle the outstanding requirement and request again.",
      };
    }

    // Seeded signatures carry no image so the demo store stays small; the
    // student card falls back to the signer's name in a handwriting face.
    return { ...base, respondedAt, signerName: officeSignerNames[office] };
  });
}

export function isFullySigned(offices: OfficeSignature[]): boolean {
  return (
    offices.length === OFFICE_ORDER.length &&
    offices.every((office) => office.status === "signed")
  );
}

/** CPC-2026-000123, continuing from the highest number already issued. */
export function referenceNumberFor(sequence: number): string {
  return `CPC-2026-${String(sequence).padStart(6, "0")}`;
}

export function nextReferenceSequence(records: ClearanceRecord[]): number {
  const highest = records.reduce((max, record) => {
    const tail = (record.referenceNumber ?? "").split("-").pop() ?? "";
    const digits = Number.parseInt(tail, 10);
    return Number.isNaN(digits) ? max : Math.max(max, digits);
  }, 122);
  return highest + 1;
}

export function seedRecord(index: number, now: number): ClearanceRecord {
  const offices = seedOffices(index, now);
  const complete = isFullySigned(offices);
  const rotation = index % 3;

  return {
    studentId: `STU-2026-${String(101 + index).padStart(4, "0")}`,
    studentName: `${FIRST_NAMES[index]} ${LAST_NAMES[index]}`,
    section: SECTIONS[index % SECTIONS.length],
    program: "BS Information Technology",
    yearLevel: "3rd Year",
    term: "1st",
    academicYear: "2026-2027",
    offices,
    subjects: [...mockSubjects.slice(rotation), ...mockSubjects.slice(0, rotation)],
    saoEvents: mockEvents.map((event, eventIndex) => ({
      ...event,
      attended: event.attended && (index % 5 !== 0 || eventIndex !== 3),
    })),
    referenceNumber: complete ? referenceNumberFor(123 + index) : undefined,
    completedAt: complete
      ? new Date(now - (index + 2) * 86_400_000).toISOString()
      : undefined,
  };
}

/**
 * The demo student from the student portal: five offices already signed, the
 * SAO still awaiting action, and one genuinely missing event so the SAO
 * checklist reports a real issue.
 */
export function seedHarry(now: number): ClearanceRecord {
  const signed = createInitialOffices().map((office) => {
    const requestedAt = new Date(now - 9 * 86_400_000).toISOString();
    return {
      ...office,
      status: "signed" as const,
      requestedAt,
      respondedAt: new Date(Date.parse(requestedAt) + 6 * 3_600_000).toISOString(),
      signerName: officeSignerNames[office.office],
    };
  });

  return {
    studentId: "20240778",
    studentName: "Harry Styles",
    section: "BSIT 3-A",
    program: "BS Information Technology",
    yearLevel: "3rd Year",
    term: "1st",
    academicYear: "2026-2027",
    offices: signed.map((office) =>
      office.office === "sao"
        ? {
            ...office,
            status: "requested" as const,
            requestedAt: new Date(now - 5 * 3_600_000).toISOString(),
            respondedAt: undefined,
            signerName: undefined,
            studentNote: NOTE_LINES[0],
          }
        : office,
    ),
    subjects: mockSubjects,
    saoEvents: mockEvents,
  };
}

export function seedRecords(): ClearanceRecord[] {
  const now = Date.now();
  return [
    seedHarry(now),
    ...Array.from({ length: 40 }, (_, index) => seedRecord(index, now)),
  ];
}

export function seedTimeline(records: ClearanceRecord[]): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  for (const record of records) {
    for (const office of record.offices) {
      if (office.status === "not_requested" || !office.requestedAt) continue;
      const requestId = `${record.studentId}:${office.office}`;
      events.push({
        id: newId(),
        requestId,
        at: office.requestedAt,
        actor: record.studentName,
        type: "requested",
        detail: office.studentNote,
      });
      if (!office.respondedAt) continue;
      events.push({
        id: newId(),
        requestId,
        at: office.respondedAt,
        actor: office.signerName ?? OFFICE_LABELS[office.office],
        type: office.status === "signed" ? "signed" : "rejected",
        detail: office.status === "rejected" ? office.remarks : undefined,
      });
    }
  }

  return events.sort((a, b) => b.at.localeCompare(a.at)).slice(0, MAX_TIMELINE);
}

