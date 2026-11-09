import { useMemo, useState } from "react";
import { CheckCircle2, ChevronDown, Download } from "lucide-react";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/badge";
import { useClearance } from "@/components/features/student/clearance/ClearanceContext";
import { formatDate } from "@/lib/format";
import { downloadClearanceSlip } from "@/components/features/student/clearance/clearancePdf";
import type { ClearanceHistoryItem } from "@/types/clearance";

const SEMESTER_FILTERS = ["All semesters", "1st Semester", "2nd Semester"] as const;
type SemesterFilter = (typeof SEMESTER_FILTERS)[number];

const HANDWRITING = '"Dancing Script", "Segoe Script", cursive';

/** Section 7: previous clearances with expandable signature details. */
export function ClearanceHistory() {
  const { history, student, referenceNumber } = useClearance();
  const [filter, setFilter] = useState<SemesterFilter>("All semesters");
  const [expanded, setExpanded] = useState<string | null>(null);

  const rows = useMemo(
    () => history.filter((item) => filter === "All semesters" || item.semester === filter),
    [history, filter],
  );

  function download(item: ClearanceHistoryItem) {
    downloadClearanceSlip({
      student,
      offices: item.signatures,
      referenceNumber,
      dateCleared: item.dateCleared,
      academicYear: item.academicYear,
      semester: item.semester,
      historical: true,
    });
  }

  return (
    <section
      aria-labelledby="history-heading"
      className="rounded-xl border border-cpc-input-border bg-white p-5 shadow-sm sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="history-heading" className="font-poppins text-lg font-bold text-cpc-navy-text">
            Clearance History
          </h2>
          <p className="mt-1 font-poppins text-xs text-cpc-heading-soft">
            Your previous clearance records.
          </p>
        </div>

        <div>
          <label htmlFor="semester-filter" className="sr-only">
            Filter by semester
          </label>
          <select
            id="semester-filter"
            value={filter}
            onChange={(event) => setFilter(event.target.value as SemesterFilter)}
            className="h-9 cursor-pointer rounded-lg border border-cpc-input-border bg-white px-2.5 font-poppins text-xs font-medium text-cpc-label outline-none transition-colors hover:border-cpc-tile-border focus:border-cpc-icon focus:ring-2 focus:ring-cpc-icon/30"
          >
            {SEMESTER_FILTERS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full border-collapse font-poppins text-xs sm:text-sm">
          <caption className="sr-only">Previous clearance records</caption>
          <thead>
            <tr className="bg-cpc-section-light text-left text-[11px] font-semibold text-cpc-label sm:text-xs">
              <th scope="col" className="rounded-tl-lg px-2 py-2.5 sm:px-4 sm:py-3">
                Academic Year
              </th>
              <th scope="col" className="px-2 py-2.5 sm:px-4 sm:py-3">
                Semester
              </th>
              <th scope="col" className="px-2 py-2.5 sm:px-4 sm:py-3">
                Status
              </th>
              <th scope="col" className="hidden px-2 py-2.5 sm:table-cell sm:px-4 sm:py-3">
                Date Cleared
              </th>
              <th scope="col" className="w-9 rounded-tr-lg px-1.5 py-2.5 sm:w-12 sm:px-4 sm:py-3">
                <span className="sr-only">Details</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-cpc-heading-soft">
                  No clearance records for this semester.
                </td>
              </tr>
            )}

            {rows.map((item) => {
              const key = `${item.academicYear}-${item.semester}`;
              const open = expanded === key;
              const panelId = `history-panel-${key.replace(/\s+/g, "-")}`;

              return (
                <HistoryRow
                  key={key}
                  item={item}
                  open={open}
                  panelId={panelId}
                  onToggle={() => setExpanded(open ? null : key)}
                  onDownload={() => download(item)}
                />
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

type HistoryRowProps = {
  item: ClearanceHistoryItem;
  open: boolean;
  panelId: string;
  onToggle: () => void;
  onDownload: () => void;
};

function HistoryRow({ item, open, panelId, onToggle, onDownload }: HistoryRowProps) {
  return (
    <>
      <tr className="border-t border-cpc-input-border/70 text-cpc-navy-text transition-colors hover:bg-cpc-section-light/40">
        <th
          scope="row"
          className="px-2 py-2.5 text-left text-[11px] font-semibold whitespace-nowrap sm:px-4 sm:py-3 sm:text-sm"
        >
          {item.academicYear}
        </th>
        <td className="px-2 py-2.5 text-cpc-heading-soft sm:px-4 sm:py-3">
          <span className="block whitespace-nowrap">{item.semester}</span>
          <span className="block text-[10px] whitespace-nowrap text-cpc-heading-soft sm:hidden">
            {formatDate(item.dateCleared)}
          </span>
        </td>
        <td className="px-2 py-2.5 sm:px-4 sm:py-3">
          <Badge tone="success">
            <CheckCircle2 className="h-3 w-3" aria-hidden />
            {item.status}
          </Badge>
        </td>
        <td className="hidden px-4 py-3 text-cpc-heading-soft sm:table-cell">
          {formatDate(item.dateCleared)}
        </td>
        <td className="px-1.5 py-2.5 text-right sm:px-4 sm:py-3">
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={open}
            aria-controls={panelId}
            aria-label={`${open ? "Hide" : "Show"} signatures for ${item.semester}, ${item.academicYear}`}
            className="cursor-pointer rounded-md p-1.5 text-cpc-heading-soft transition-colors hover:bg-cpc-section-light hover:text-cpc-navy-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
          >
            <ChevronDown
              className={cn("h-4 w-4 transition-transform duration-200", open && "rotate-180")}
              aria-hidden
            />
          </button>
        </td>
      </tr>

      {open && (
        <tr id={panelId}>
          <td colSpan={5} className="bg-cpc-section-light/40 px-3 py-4 sm:px-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <ul className="grid flex-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {item.signatures.map((office) => (
                  <li
                    key={office.office}
                    className="flex items-center justify-between gap-2 rounded-md border border-cpc-input-border bg-white px-3 py-2"
                  >
                    <span className="min-w-0">
                      <span className="block font-poppins text-xs font-medium text-cpc-navy-text">
                        {office.label}
                      </span>
                      <span className="block font-poppins text-[10px] text-cpc-heading-soft">
                        {office.signerName ?? "—"}
                        {office.respondedAt && ` · ${formatDate(office.respondedAt)}`}
                      </span>
                    </span>

                    {office.signatureImage ? (
                      <img
                        src={office.signatureImage}
                        alt={`${office.signerName ?? office.label} signature`}
                        className="h-8 w-auto max-w-24 shrink-0 object-contain"
                      />
                    ) : (
                      <span
                        aria-hidden
                        className="shrink-0 text-base leading-none text-cpc-navy-text"
                        style={{ fontFamily: HANDWRITING }}
                      >
                        {office.signerName?.split(" ").slice(-2).join(" ") ?? "Signed"}
                      </span>
                    )}
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={onDownload}
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-cpc-navy-text px-3 py-2 font-poppins text-xs font-semibold text-cpc-navy-text transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
              >
                <Download className="h-3.5 w-3.5" aria-hidden />
                View / Download
              </button>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
