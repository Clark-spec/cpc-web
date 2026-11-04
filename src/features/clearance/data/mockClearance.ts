import type {
  ClearanceHistoryItem,
  ClearanceState,
  OfficeId,
  OfficeSignature,
  SaoEvent,
  StudentProfile,
  Subject,
} from "../types";

/** Demo student shown on Form 3 and the confirmation slip. */
export const mockStudent: StudentProfile = {
  name: "Harry Styles",
  studentId: "20240778",
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

export const mockEvents: SaoEvent[] = [
  { title: "Brigada Balik Eskwela", attended: true },
  { title: "Foundation Day", attended: true },
  { title: "Monday – BSIT and BEED", attended: true },
  { title: "Mass – Foundation Day", attended: true },
  { title: "SSG Day Trash Galore", attended: true },
  { title: "I-CARE Seminar – Officers", attended: true },
  {
    title: "Exhibit (Index Card)",
    attended: false,
    note: "Your attendance sheet for Exhibit (Index Card) has not been submitted to the SAO / SSG Adviser yet.",
  },
];

/** The six signatories, in the order they appear on Form 3. */
export const officeOrder: OfficeId[] = [
  "instructor",
  "dean",
  "library",
  "registrar",
  "accounting",
  "sao",
];

/** Staff member assigned to each office (used by the demo staff panel). */
export const officeSignerNames: Record<OfficeId, string> = {
  instructor: "Prof. R. Dela Cruz",
  dean: "Dr. M. Santos",
  library: "Ms. A. Villanueva",
  registrar: "Mrs. L. Reyes",
  accounting: "Mr. J. Cruz",
  sao: "Prof. L. Fernandez",
};

const officeLabels: Record<OfficeId, string> = {
  instructor: "Instructor",
  dean: "Dean",
  library: "Library",
  registrar: "Registrar",
  accounting: "Accounting",
  sao: "SAO / SSG Adviser",
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

/** A signed office used by the mock history rows. */
function historySignature(office: OfficeId, date: string): OfficeSignature {
  return {
    office,
    label: officeLabels[office],
    status: "signed",
    signerName: officeSignerNames[office],
    requestedAt: `${date}T08:00:00.000Z`,
    respondedAt: `${date}T09:00:00.000Z`,
    // History rows have no stored image; the UI falls back to a handwriting
    // style rendering of the signer name. Real records would carry the image.
  };
}

/** Previous terms shown in the history table. */
export const mockHistory: ClearanceHistoryItem[] = [
  {
    academicYear: "2025-2026",
    semester: "1st Semester",
    status: "Cleared",
    dateCleared: "2026-01-12",
    signatures: officeOrder.map((office) => historySignature(office, "2026-01-10")),
  },
  {
    academicYear: "2024-2025",
    semester: "2nd Semester",
    status: "Cleared",
    dateCleared: "2025-06-05",
    signatures: officeOrder.map((office) => historySignature(office, "2025-06-03")),
  },
  {
    academicYear: "2024-2025",
    semester: "1st Semester",
    status: "Cleared",
    dateCleared: "2025-01-10",
    signatures: officeOrder.map((office) => historySignature(office, "2025-01-08")),
  },
];

export function createInitialState(): ClearanceState {
  return {
    offices: createInitialOffices(),
    history: mockHistory,
    dateCleared: null,
  };
}
