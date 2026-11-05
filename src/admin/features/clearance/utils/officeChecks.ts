import type {
  ClearanceRecord,
  OfficeCheckItem,
  OfficeId,
} from "@/features/clearance/types";

/** Form 3 signature order — the same order the student page renders. */
export const OFFICE_ORDER: OfficeId[] = [
  "instructor",
  "dean",
  "library",
  "registrar",
  "accounting",
  "sao",
];

export const OFFICE_LABELS: Record<OfficeId, string> = {
  instructor: "Instructor",
  dean: "Dean",
  library: "Library",
  registrar: "Registrar",
  accounting: "Accounting",
  sao: "SAO / SSG Adviser",
};

/** Title used by the single-office header chip. */
export const OFFICE_TITLES: Record<OfficeId, string> = {
  instructor: "Instructor's Office",
  dean: "Dean's Office",
  library: "Library Office",
  registrar: "Registrar's Office",
  accounting: "Accounting Office",
  sao: "SAO / SSG Adviser",
};

/**
 * Deterministic stand-in for the registrar/library/accounting queries a real
 * deployment would run: the same student always gets the same answers, so the
 * checklist does not change between page loads or between the two portals.
 */
function flag(studentId: string, key: string, percentLikely: number): boolean {
  let hash = 2166136261;
  const source = `${studentId}:${key}`;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash) % 100 < percentLikely;
}

function item(
  id: string,
  label: string,
  ok: boolean,
  detail: { ok: string; issue: string },
): OfficeCheckItem {
  return {
    id,
    label,
    result: ok ? "ok" : "issue",
    detail: ok ? detail.ok : detail.issue,
    verifiedByStaff: ok,
  };
}

/**
 * Office-specific verification list. SAO and Instructor are evaluated from the
 * student's own record (event attendance and taught subjects); the remaining
 * offices would normally query their systems, so they read from the seeded
 * deterministic flags instead.
 */
export function buildOfficeChecks(
  office: OfficeId,
  record: ClearanceRecord,
  staffName?: string,
): OfficeCheckItem[] {
  const { studentId } = record;

  switch (office) {
    case "library":
      return [
        item(
          "library-books",
          "Unreturned books",
          !flag(studentId, "books", 28),
          {
            ok: "No books outstanding",
            issue: `${1 + (Math.abs(studentId.charCodeAt(studentId.length - 1)) % 3)} books unreturned`,
          },
        ),
        item("library-fines", "Unpaid library fines", !flag(studentId, "fines", 20), {
          ok: "Fines settled",
          issue: "₱150.00 fine still unpaid",
        }),
      ];

    case "accounting":
      return [
        item(
          "acct-balance",
          "Outstanding balance",
          !flag(studentId, "balance", 30),
          {
            ok: "No fees outstanding",
            issue: "₱350.00 laboratory fee unpaid",
          },
        ),
        item("acct-refund", "Pending refunds", !flag(studentId, "refund", 12), {
          ok: "No refund claims pending",
          issue: "Tuition refund claim still processing",
        }),
      ];

    case "sao": {
      const missing = record.saoEvents.filter((event) => !event.attended);
      return [
        {
          id: "sao-events",
          label: "Required events attended",
          result: missing.length === 0 ? "ok" : "issue",
          detail:
            missing.length === 0
              ? `${record.saoEvents.length} of ${record.saoEvents.length} events recorded`
              : `${missing[0].title} attendance missing`,
          verifiedByStaff: missing.length === 0,
        },
        item("sao-ssg", "SSG contribution paid", !flag(studentId, "ssg", 22), {
          ok: "Contribution recorded",
          issue: "SSG contribution not yet posted",
        }),
      ];
    }

    case "registrar":
      return [
        {
          id: "reg-enrollment",
          label: "Enrollment verified",
          result: "ok",
          detail: `Enrolled in ${record.section}, ${record.term} semester`,
          verifiedByStaff: true,
        },
        item("reg-grades", "Grades complete", !flag(studentId, "grades", 18), {
          ok: "All subject grades posted",
          issue: "Grades still missing for 1 subject",
        }),
        item("reg-documents", "Missing documents", !flag(studentId, "docs", 15), {
          ok: "Document file complete",
          issue: "Good moral certificate not on file",
        }),
      ];

    case "dean":
      return [
        item("dean-standing", "Academic standing", !flag(studentId, "standing", 10), {
          ok: "Good academic standing",
          issue: "Standing under review by the college",
        }),
        item("dean-incomplete", "No pending incomplete grades", !flag(studentId, "inc", 20), {
          ok: "No incomplete grades",
          issue: "1 incomplete grade still pending",
        }),
      ];

    case "instructor": {
      const taught = record.subjects.filter(
        (subject) => !staffName || subject.instructor === staffName,
      );
      const subjects = taught.length > 0 ? taught : record.subjects.slice(0, 3);

      return subjects.map((subject, index) => {
        const clear = !flag(studentId, `subj-${index}`, 25);
        return {
          id: `instructor-subject-${index}`,
          label: `${subject.name} (${subject.units} units)`,
          result: clear ? ("ok" as const) : ("issue" as const),
          detail: clear
            ? "Grades submitted · requirements complete"
            : "Class record not yet submitted",
          verifiedByStaff: clear,
        };
      });
    }
  }
}

export function countIssues(items: OfficeCheckItem[]): number {
  return items.filter((item) => item.result === "issue").length;
}
