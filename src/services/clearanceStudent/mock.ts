import type {
  ClearanceState,
  OfficeId,
  OfficeSignature,
  StudentProfile,
  Subject,
} from "@/types/clearance";

/** Demo student shown on Form 3 and the confirmation slip. */
export const mockStudent: StudentProfile = {
  name: "Harry Styles",
  studentId: "20240778",
  section: "BSIT 3-A",
  yearLevel: "3rd year",
  course: "BSIT",
  program: "BS Information Technology",
  academicYear: "2025-2026",
  semester: "2nd Semester",
  term: "2nd",
  graduating: false,
  date: "2026-10-09",
  referenceNumber: "CPC-2026-000123",
};

export const mockSubjects: Subject[] = [
  { name: "Dance", units: 2, instructor: "Prof. R. Dela Cruz" },
  { name: "Reading Visual Arts", units: 3, instructor: "Ms. A. Villanueva" },
  { name: "Science, Technology and Society", units: 3, instructor: "Dr. M. Santos" },
  { name: "Information Management", units: 3, instructor: "Mr. J. Cruz" },
  { name: "IT Track Elective 1", units: 3, instructor: "Prof. R. Dela Cruz" },
  { name: "Object Oriented Programming", units: 3, instructor: "Prof. R. Dela Cruz" },
  { name: "Probabilities and Statistics", units: 3, instructor: "Mrs. L. Reyes" },
  { name: "Data Communications and Networking 1", units: 3, instructor: "Mr. J. Cruz" },
  { name: "Quantitative Methods", units: 3, instructor: "Dr. M. Santos" },
];

/** Default SAO activities mirrored from the clearance record defaults. */
export const defaultSaoEvents = [
  { title: "Brigada Balik Eskwela", status: "pending" as const },
  { title: "Foundation Day", status: "attended" as const },
  { title: "Monday – BSIT and BEED", status: "not_attended" as const },
  { title: "Mass – Foundation Day", status: "pending" as const },
  { title: "SSG Day Trash Galore", status: "attended" as const },
  { title: "I-CARE Seminar – Officers", status: "not_attended" as const },
  { title: "Exhibit (Index Card)", status: "pending" as const },
];

/** The six signatories, in the order they appear on Form 3. */
export const officeOrder: OfficeId[] = [
  "dean",
  "sao",
  "library",
  "accounting",
  "registrar",
];

/** Staff member assigned to each office (used by the demo staff panel). */
export const officeSignerNames: Record<OfficeId, string> = {
  dean: "",
  sao: "",
  library: "",
  accounting: "",
  registrar: "",
};

const officeLabels: Record<OfficeId, string> = {
  dean: "Dean",
  sao: "SAO / SSG Adviser",
  library: "Library",
  accounting: "Accounting",
  registrar: "Registrar",
};

/**
 * Fresh clearance: nothing requested yet, so the student can walk through the
 * full request → staff action → signature flow.
 */
export function createInitialOffices(): OfficeSignature[] {
  return officeOrder.map((office) => ({
    office,
    label: officeLabels[office],
    status: "not_requested",
  }));
}

export function createInitialState(): ClearanceState {
  return {
    offices: createInitialOffices(),
    saoEvents: defaultSaoEvents.map((event) => ({ ...event })),
    history: [],
    dateCleared: null,
  };
}
