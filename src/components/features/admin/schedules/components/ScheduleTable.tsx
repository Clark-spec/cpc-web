import { useMemo, useState } from "react";
import { AlertTriangle, ArrowDown, ArrowUp, SearchX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/admin/EmptyState";
import { TableSkeleton } from "@/components/ui/admin/Skeleton";
import { cn } from "@/lib/cn";
import { daysToLabel, formatTime } from "@/utils/scheduleTime";
import { getSubjectColor } from "@/utils/scheduleColors";
import type { VisibleEntry } from "../context/ScheduleAdminContext";
import { useScheduleAdmin } from "../context/ScheduleAdminContext";
import { unitsFor } from "../utils/conflicts";

type ColumnId =
  | "section"
  | "subjectCode"
  | "title"
  | "startMin"
  | "units"
  | "instructor"
  | "status";

const COLUMNS: { id: ColumnId | null; label: string; sortable: boolean; className?: string }[] = [
  { id: "section", label: "Section", sortable: true },
  { id: "subjectCode", label: "Code", sortable: true },
  { id: "title", label: "Subject", sortable: true, className: "min-w-[14rem]" },
  { id: null, label: "Days", sortable: false },
  { id: "startMin", label: "Start", sortable: true },
  { id: null, label: "End", sortable: false },
  { id: null, label: "Room A", sortable: false },
  { id: null, label: "Room B", sortable: false },
  { id: "units", label: "Units", sortable: true },
  { id: "instructor", label: "Instructor", sortable: true },
  { id: "status", label: "Status", sortable: true },
];

/** The overload ceiling and the underload floor the registrar is warned about. */
const MAX_UNITS = 27;
const MIN_UNITS = 12;

function compareRows(a: VisibleEntry, b: VisibleEntry, column: ColumnId): number {
  switch (column) {
    case "section":
      return a.section.localeCompare(b.section);
    case "subjectCode":
      return a.entry.subjectCode.localeCompare(b.entry.subjectCode);
    case "title":
      return a.entry.title.localeCompare(b.entry.title);
    case "startMin":
      return a.entry.startMin - b.entry.startMin;
    case "units":
      return a.entry.units - b.entry.units;
    case "instructor":
      return a.entry.instructor.localeCompare(b.entry.instructor);
    case "status":
      return a.entry.status.localeCompare(b.entry.status);
    default:
      return 0;
  }
}

/** One room cell: `ONLINE` and an empty set read as text, not as a blank box. */
function RoomCell({ value }: { value: string }) {
  const name = value.trim();
  return (
    <span className="font-poppins text-xs text-cpc-navy-text">
      {name === "" ? <span className="text-cpc-heading-soft">—</span> : name}
    </span>
  );
}

/**
 * The working list (spec §5).
 *
 * (1) Rows come from `visibleEntries`, which is already section-scoped, role-
 * scoped and filtered in the context — this component only decides order and
 * presentation, so the table and the grid can never disagree about what is on
 * screen.
 * (2) A class marked `not_active` stays in the list with its own badge and a
 * dashed cell. It is excluded from conflict detection because it does not
 * occupy the calendar, but hiding it would lose the record of why the slot is
 * empty.
 */
export function ScheduleTable() {
  const { loading, section, visibleEntries, clearFilters, activeFilterCount } = useScheduleAdmin();
  const [sort, setSort] = useState<{ column: ColumnId; direction: "asc" | "desc" }>({
    column: "startMin",
    direction: "asc",
  });

  const rows = useMemo(() => {
    const copy = [...visibleEntries];
    copy.sort((a, b) => {
      const result = compareRows(a, b, sort.column);
      if (result !== 0) return sort.direction === "asc" ? result : -result;
      return a.entry.id.localeCompare(b.entry.id);
    });
    return copy;
  }, [sort, visibleEntries]);

  /* The unit warning belongs to one section; "All sections" would only dilute it. */
  const unitNotice = useMemo(() => {
    if (section === "all" || loading) return null;
    const total = unitsFor(rows.map((row) => row.entry));
    if (total > MAX_UNITS) {
      return {
        tone: "danger" as const,
        text: `${section} totals ${total} units — above the ${MAX_UNITS}-unit ceiling.`,
      };
    }
    if (total < MIN_UNITS) {
      return {
        tone: "warning" as const,
        text: `${section} totals ${total} units — below the ${MIN_UNITS}-unit minimum load.`,
      };
    }
    return { tone: "info" as const, text: `${section} totals ${total} units.` };
  }, [loading, rows, section]);

  if (loading) {
    return (
      <section
        aria-label="Schedule entries"
        className="rounded-2xl border border-cpc-tile-border/70 bg-white"
      >
        <div className="border-b border-cpc-input-border px-4 py-3">
          <p className="font-poppins text-xs font-semibold text-cpc-heading-soft">
            Loading schedule…
          </p>
        </div>
        <TableSkeleton rows={8} />
      </section>
    );
  }

  if (rows.length === 0) {
    return (
      <section
        aria-label="Schedule entries"
        className="rounded-2xl border border-cpc-tile-border/70 bg-white"
      >
        <EmptyState
          icon={SearchX}
          title="No classes match these filters"
          description={
            activeFilterCount > 0
              ? "Widen the filters to see the rest of the section."
              : "This section has no entries yet. Add a class to start building the timetable."
          }
          action={
            activeFilterCount > 0 ? (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-1 inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-cpc-tile-border bg-white px-3 py-2 font-poppins text-xs font-semibold text-cpc-navy-text transition-colors hover:bg-cpc-section-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
              >
                Clear filters
              </button>
            ) : undefined
          }
        />
      </section>
    );
  }

  const headerCell = (column: (typeof COLUMNS)[number]) => {
    const active = column.id !== null && sort.column === column.id;
    const Arrow = active && sort.direction === "desc" ? ArrowDown : ArrowUp;
    return (
      <th
        key={column.label}
        scope="col"
        aria-sort={
          active ? (sort.direction === "asc" ? "ascending" : "descending") : undefined
        }
        className="px-3 py-2.5 text-left font-poppins text-[11px] font-bold tracking-[0.08em] text-cpc-blue-accent uppercase whitespace-nowrap"
      >
        {column.sortable && column.id !== null ? (
          <button
            type="button"
            onClick={() =>
              setSort((current) =>
                current.column === column.id
                  ? { column: current.column, direction: current.direction === "asc" ? "desc" : "asc" }
                  : { column: column.id as ColumnId, direction: "asc" },
              )
            }
            className="inline-flex cursor-pointer items-center gap-1 rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
          >
            {column.label}
            <Arrow
              className={cn("h-3 w-3 shrink-0", active ? "text-cpc-blue-accent" : "text-cpc-muted-blue/50")}
              aria-hidden
            />
          </button>
        ) : (
          column.label
        )}
      </th>
    );
  };

  return (
    <section
      aria-label="Schedule entries"
      className="overflow-hidden rounded-2xl border border-cpc-tile-border/70 bg-white"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cpc-input-border px-4 py-3">
        <h2 className="font-poppins text-sm font-bold text-cpc-navy-text">
          {section === "all" ? "All sections" : section}
          <span className="ml-2 font-poppins text-xs font-semibold text-cpc-heading-soft">
            {rows.length} {rows.length === 1 ? "class" : "classes"}
          </span>
        </h2>
        {unitNotice && (
          <span aria-live="polite">
            <Badge tone={unitNotice.tone}>
              {unitNotice.tone !== "info" && <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden />}
              {unitNotice.text}
            </Badge>
          </span>
        )}
      </div>

      {/* Desktop: one row per class. */}
      <div className="hidden md:block">
        <table className="w-full border-collapse">
          <caption className="sr-only">
            Scheduled classes for {section === "all" ? "all sections" : section}, sortable by
            section, code, subject, start time, units, instructor and status.
          </caption>
          <thead className="bg-cpc-section-light">
            <tr>{COLUMNS.map(headerCell)}</tr>
          </thead>
          <tbody>
            {rows.map(({ entry, section: rowSection, conflictCount }) => {
              const color = getSubjectColor(entry.colorKey);
              const inactive = entry.status === "not_active";
              return (
                <tr
                  key={entry.id}
                  className="border-b border-cpc-input-border/70 last:border-b-0 even:bg-cpc-section-light/30"
                >
                  <td className="px-3 py-2.5 font-poppins text-xs font-semibold text-cpc-navy-text whitespace-nowrap">
                    {rowSection}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <span className="inline-flex items-center gap-2">
                      <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", color.dot)} aria-hidden />
                      <span className="font-poppins text-xs font-semibold text-cpc-navy-text">
                        {entry.subjectCode}
                      </span>
                    </span>
                  </td>
                  <td className="px-3 py-2.5 font-poppins text-xs text-cpc-navy-text">{entry.title}</td>
                  <td className="px-3 py-2.5 font-poppins text-xs text-cpc-navy-text tabular-nums whitespace-nowrap">
                    {daysToLabel(entry.days)}
                  </td>
                  <td className="px-3 py-2.5 font-poppins text-xs text-cpc-navy-text tabular-nums whitespace-nowrap">
                    {formatTime(entry.startMin)}
                  </td>
                  <td className="px-3 py-2.5 font-poppins text-xs text-cpc-navy-text tabular-nums whitespace-nowrap">
                    {formatTime(entry.endMin)}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <RoomCell value={entry.roomSetA} />
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <RoomCell value={entry.roomSetB} />
                  </td>
                  <td className="px-3 py-2.5 font-poppins text-xs text-cpc-navy-text tabular-nums">
                    {entry.units}
                  </td>
                  <td className="px-3 py-2.5 font-poppins text-xs text-cpc-navy-text whitespace-nowrap">
                    {entry.instructor}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5">
                      <Badge tone={inactive ? "neutral" : "success"}>
                        {inactive ? "Not active" : "Active"}
                      </Badge>
                      {conflictCount > 0 && (
                        <Badge tone="danger">
                          <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden />
                          {conflictCount} clash{conflictCount === 1 ? "" : "es"}
                        </Badge>
                      )}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile: the same rows as stacked cards, never a horizontal scroll. */}
      <ul className="space-y-3 p-4 md:hidden">
        {rows.map(({ entry, section: rowSection, conflictCount }) => {
          const color = getSubjectColor(entry.colorKey);
          const inactive = entry.status === "not_active";
          return (
            <li
              key={entry.id}
              className={cn(
                "rounded-xl border border-cpc-input-border bg-white p-3.5",
                inactive && "border-dashed",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="inline-flex items-center gap-2 font-poppins text-xs font-bold text-cpc-navy-text">
                    <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", color.dot)} aria-hidden />
                    <span className="truncate">{entry.subjectCode}</span>
                  </p>
                  <p className="mt-1 font-poppins text-sm leading-snug font-semibold text-cpc-navy-text">
                    {entry.title}
                  </p>
                </div>
                <Badge tone={inactive ? "neutral" : "success"}>
                  {inactive ? "Not active" : "Active"}
                </Badge>
              </div>

              <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 font-poppins text-xs">
                <div className="flex gap-1.5">
                  <dt className="text-cpc-heading-soft">Section</dt>
                  <dd className="font-semibold text-cpc-navy-text">{rowSection}</dd>
                </div>
                <div className="flex gap-1.5">
                  <dt className="text-cpc-heading-soft">Days</dt>
                  <dd className="font-semibold text-cpc-navy-text tabular-nums">
                    {daysToLabel(entry.days)}
                  </dd>
                </div>
                <div className="col-span-2 flex gap-1.5">
                  <dt className="text-cpc-heading-soft">Time</dt>
                  <dd className="font-semibold text-cpc-navy-text tabular-nums">
                    {formatTime(entry.startMin)} – {formatTime(entry.endMin)}
                  </dd>
                </div>
                <div className="flex gap-1.5">
                  <dt className="text-cpc-heading-soft">Room A</dt>
                  <dd className="font-semibold text-cpc-navy-text">{entry.roomSetA || "—"}</dd>
                </div>
                <div className="flex gap-1.5">
                  <dt className="text-cpc-heading-soft">Room B</dt>
                  <dd className="font-semibold text-cpc-navy-text">{entry.roomSetB || "—"}</dd>
                </div>
                <div className="flex gap-1.5">
                  <dt className="text-cpc-heading-soft">Units</dt>
                  <dd className="font-semibold text-cpc-navy-text tabular-nums">{entry.units}</dd>
                </div>
                <div className="flex gap-1.5">
                  <dt className="text-cpc-heading-soft">Teacher</dt>
                  <dd className="min-w-0 truncate font-semibold text-cpc-navy-text">
                    {entry.instructor}
                  </dd>
                </div>
              </dl>

              {conflictCount > 0 && (
                <p className="mt-3 font-poppins text-xs font-semibold text-amber-700">
                  {conflictCount} schedule clash{conflictCount === 1 ? "" : "es"} — open the
                  conflict panel to see what overlaps.
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
