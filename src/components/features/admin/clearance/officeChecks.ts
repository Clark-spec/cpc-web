import type {
  ClearanceRecord,
  OfficeCheckItem,
  OfficeId,
} from "@/types/clearance";

/** Form 3 signature order — the same order the student page renders. */
export const OFFICE_ORDER: OfficeId[] = [
  "dean",
  "sao",
  "library",
  "accounting",
  "registrar",
];

export const OFFICE_LABELS: Record<OfficeId, string> = {
  dean: "Dean",
  sao: "SAO / SSG Adviser",
  library: "Library",
  accounting: "Accounting",
  registrar: "Registrar",
};

/** Title used by the single-office header chip. */
export const OFFICE_TITLES: Record<OfficeId, string> = {
  dean: "Dean's Office",
  sao: "SAO / SSG Adviser",
  library: "Library",
  accounting: "Accounting Office",
  registrar: "Registrar's Office",
};

/**
 * Office-specific checklist. SAO activities are shown individually so SAO can
 * verify each attendance record. Other office records must be checked against
 * that office's source system, so they are never presented as pre-verified.
 */
export function buildOfficeChecks(
  office: OfficeId,
  record: ClearanceRecord,
): OfficeCheckItem[] {
  switch (office) {
    case "sao":
      return record.saoEvents.map((event, index) => ({
        id: `sao-event-${index}`,
        label: event.title,
        result: "unknown",
        detail: "Pending SAO verification",
        verifiedByStaff: false,
      }));

    case "library":
      return [{ id: "library-record", label: "Library account", result: "unknown", detail: "Verify the student's library account and outstanding obligations.", verifiedByStaff: false }];

    case "accounting":
      return [{ id: "accounting-record", label: "Accounting record", result: "unknown", detail: "Verify the student's accounting record and outstanding obligations.", verifiedByStaff: false }];

    case "registrar":
      return [{ id: "registrar-record", label: "Academic record", result: "unknown", detail: `Verify the student's enrollment record for ${record.term} semester, ${record.academicYear}.`, verifiedByStaff: false }];

    case "dean":
      return [{ id: "dean-record", label: "Academic standing", result: "unknown", detail: "Verify the student's academic standing in the department records.", verifiedByStaff: false }];

    default:
      return [];
  }
}

export function countIssues(items: OfficeCheckItem[]): number {
  return items.filter((item) => item.result === "issue").length;
}
