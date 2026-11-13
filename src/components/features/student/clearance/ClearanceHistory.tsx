import { useMemo, useState } from "react";
import { Archive, ChevronDown, Download } from "lucide-react";
import { cn } from "@/lib/cn";
import { showError, showSuccess } from "@/lib/feedback";
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
    try {
      downloadClearanceSlip({
        student,
        offices: item.signatures,
        referenceNumber,
        dateCleared: item.dateCleared,
        academicYear: item.academicYear,
        semester: item.semester,
        historical: true,
      });
      showSuccess("Clearance slip downloaded", `${item.semester} · ${item.academicYear}`);
    } catch {
      showError("Download failed", "We could not create the file. Please try again.");
    }
  }

  return (
    <section
      aria-labelledby="history-heading"
      className="group relative overflow-hidden rounded-2xl border border-white/80 bg-white/85 p-5 shadow-[0_8px_30px_rgb(15,36,104,0.04)] backdrop-blur-md transition-all hover:shadow-[0_12px_36px_rgb(15,36,104,0.08)] sm:p-6"
    >
      {/* Decorative ambient glow */}
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-gradient-to-br from-cpc-blue-accent/5 to-transparent blur-2xl"
        aria-hidden
      />

      <div className="relative flex flex-wrap items-center justify-between gap-4 border-b border-cpc-input-border/50 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cpc-blue-accent/15 to-cpc-navy-text/10 text-cpc-blue-accent shadow-xs ring-1 ring-cpc-blue-accent/20">
            <Archive className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 id="history-heading" className="font-poppins text-lg font-bold text-cpc-navy-text">
                Clearance History
              </h2>
              <span className="inline-flex items-center rounded-full bg-cpc-blue-accent/10 px-2.5 py-0.5 text-[11px] font-semibold text-cpc-blue-accent">
                {rows.length} {rows.length === 1 ? "Record" : "Records"}
              </span>
            </div>
            <p className="mt-0.5 font-poppins text-xs text-cpc-heading-soft">
              Archived clearance records and signed verification documents.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="semester-filter" className="font-poppins text-xs font-medium text-cpc-heading-soft">
            Filter:
          </label>
          <select
            id="semester-filter"
            value={filter}
            onChange={(event) => setFilter(event.target.value as SemesterFilter)}
            className="h-9 cursor-pointer rounded-xl border border-cpc-input-border/80 bg-white/90 px-3 font-poppins text-xs font-semibold text-cpc-navy-text shadow-xs outline-none transition-all hover:border-cpc-blue-accent/40 focus:border-cpc-blue-accent focus:ring-2 focus:ring-cpc-blue-accent/20"
          >
            {SEMESTER_FILTERS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="relative mt-4 overflow-x-auto rounded-xl border border-cpc-input-border/60 bg-white/50">
        <table className="w-full border-collapse font-poppins text-xs sm:text-sm">
          <caption className="sr-only">Previous clearance records</caption>
          <thead>
            <tr className="border-b border-cpc-input-border/60 bg-cpc-section-light/70 text-left text-[11px] font-bold uppercase tracking-wider text-cpc-label sm:text-xs">
              <th scope="col" className="px-3 py-3 sm:px-5">
                Academic Year
              </th>
              <th scope="col" className="px-3 py-3 sm:px-5">
                Semester
              </th>
              <th scope="col" className="px-3 py-3 sm:px-5">
                Status
              </th>
              <th scope="col" className="hidden px-3 py-3 sm:table-cell sm:px-5">
                Date Cleared
              </th>
              <th scope="col" className="w-12 px-2 py-3 text-center sm:px-5">
                <span className="sr-only">Details</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cpc-input-border/50">
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-cpc-heading-soft">
                  <p className="text-sm font-medium">No clearance records found for this filter.</p>
                  <p className="mt-1 text-xs">Switch to &ldquo;All semesters&rdquo; to view all archived clearances.</p>
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
      <tr className="text-cpc-navy-text transition-colors hover:bg-cpc-section-light/50">
        <th
          scope="row"
          className="px-3 py-3.5 text-left text-xs font-bold whitespace-nowrap text-cpc-navy-text sm:px-5 sm:text-sm"
        >
          {item.academicYear}
        </th>
        <td className="px-3 py-3.5 text-cpc-heading-soft sm:px-5">
          <span className="block font-medium whitespace-nowrap text-cpc-navy-text">{item.semester}</span>
          <span className="block text-[11px] whitespace-nowrap text-cpc-heading-soft sm:hidden">
            {formatDate(item.dateCleared)}
          </span>
        </td>
        <td className="px-3 py-3.5 sm:px-5">
          <Badge tone="success" size="sm" className="shadow-xs">
            {item.status}
          </Badge>
        </td>
        <td className="hidden px-3 py-3.5 text-xs font-medium text-cpc-heading-soft sm:table-cell sm:px-5 sm:text-sm">
          {formatDate(item.dateCleared)}
        </td>
        <td className="px-2 py-3.5 text-center sm:px-5">
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={open}
            aria-controls={panelId}
            aria-label={`${open ? "Hide" : "Show"} signatures for ${item.semester}, ${item.academicYear}`}
            className={cn(
              "cursor-pointer rounded-lg p-2 text-cpc-heading-soft transition-all hover:bg-cpc-section-light hover:text-cpc-navy-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent",
              open && "bg-cpc-blue-accent/10 text-cpc-blue-accent",
            )}
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
          <td colSpan={5} className="border-t border-cpc-input-border/60 bg-gradient-to-b from-cpc-section-light/50 to-white/60 p-4 sm:p-5">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cpc-input-border/40 pb-3">
                <div>
                  <h4 className="font-poppins text-xs font-bold uppercase tracking-wider text-cpc-navy-text">
                    Signatory Endorsements ({item.signatures.length} Offices)
                  </h4>
                  <p className="font-poppins text-[11px] text-cpc-heading-soft">
                    All departmental clearances were verified on {formatDate(item.dateCleared)}.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onDownload}
                  className="cpc-btn cpc-btn-primary cpc-btn-sm"
                >
                  <Download className="h-3.5 w-3.5" aria-hidden />
                  Download Clearance Slip
                </button>
              </div>

              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {item.signatures.map((office) => (
                  <li
                    key={office.office}
                    className="flex items-center justify-between gap-3 rounded-xl border border-white/90 bg-white/90 p-3 shadow-xs transition-all hover:border-cpc-blue-accent/30 hover:shadow-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="block truncate font-poppins text-xs font-bold text-cpc-navy-text" title={office.label}>
                        {office.label}
                      </span>
                      <span className="block truncate font-poppins text-[11px] text-cpc-heading-soft">
                        {office.signerName ?? "Authorized Signatory"}
                      </span>
                      <span className="mt-0.5 block font-poppins text-[10px] font-medium text-emerald-600">
                        Cleared · {office.respondedAt ? formatDate(office.respondedAt) : formatDate(item.dateCleared)}
                      </span>
                    </div>

                    <div className="shrink-0 text-right">
                      {office.signatureImage ? (
                        <img
                          src={office.signatureImage}
                          alt={`${office.signerName ?? office.label} signature`}
                          className="h-8 w-auto max-w-20 object-contain"
                        />
                      ) : (
                        <span
                          aria-hidden
                          className="inline-block select-none text-sm leading-none text-cpc-navy-text"
                          style={{ fontFamily: HANDWRITING }}
                        >
                          {office.signerName?.split(" ").slice(-2).join(" ") ?? "Signed"}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
