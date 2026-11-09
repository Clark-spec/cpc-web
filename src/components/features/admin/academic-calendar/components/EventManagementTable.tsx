import { useMemo, useState } from "react";
import {
  Archive,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  EyeOff,
  PencilLine,
  Printer,
  RotateCcw,
  Search,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import {
  ACADEMIC_YEARS,
  CATEGORY_META,
  CATEGORY_ORDER,
  SEMESTERS,
  STATUS_META,
  eventDateRange,
  formatTimeRange,
  sortEvents,
  type AcademicYear,
  type AdminCalendarEvent,
  type EventCategory,
  type EventStatus,
  type Semester,
} from "../data/academicCalendar";
import {
  CalendarEmptyState,
  SectionCard,
  StatusBadge,
  primaryButtonClass,
  secondaryButtonClass,
} from "./CalendarPieces";

export type EventFilters = {
  query: string;
  category: EventCategory | "all";
  status: EventStatus | "all";
  year: AcademicYear | "all";
  semester: Semester | "all";
  from: string;
  to: string;
};

export const EMPTY_FILTERS: EventFilters = {
  query: "",
  category: "all",
  status: "all",
  year: "all",
  semester: "all",
  from: "",
  to: "",
};

export function filterEvents(events: AdminCalendarEvent[], filters: EventFilters) {
  const query = filters.query.trim().toLowerCase();
  return sortEvents(
    events.filter((event) => {
      if (query) {
        const haystack = `${event.title} ${event.description} ${event.location ?? ""} ${event.organizer ?? ""}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      if (filters.category !== "all" && event.category !== filters.category) return false;
      if (filters.status !== "all" && event.status !== filters.status) return false;
      if (filters.year !== "all" && event.academicYear !== filters.year) return false;
      if (filters.semester !== "all" && event.semester !== filters.semester) return false;
      if (filters.from && (event.endDate ?? event.startDate) < filters.from) return false;
      if (filters.to && event.startDate > filters.to) return false;
      return true;
    }),
  );
}

const PAGE_SIZE = 8;

type EventManagementTableProps = {
  events: AdminCalendarEvent[];
  onAdd: () => void;
  onView: (event: AdminCalendarEvent) => void;
  onEdit: (event: AdminCalendarEvent) => void;
  onTogglePublish: (event: AdminCalendarEvent) => void;
  onArchive: (event: AdminCalendarEvent) => void;
  onDelete: (event: AdminCalendarEvent) => void;
  onExport: (events: AdminCalendarEvent[]) => void;
  onPrint: (events: AdminCalendarEvent[]) => void;
};

export function EventManagementTable({
  events,
  onAdd,
  onView,
  onEdit,
  onTogglePublish,
  onArchive,
  onDelete,
  onExport,
  onPrint,
}: EventManagementTableProps) {
  const [filters, setFilters] = useState<EventFilters>(EMPTY_FILTERS);
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => filterEvents(events, filters), [events, filters]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const visible = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  const update = <K extends keyof EventFilters>(key: K, value: EventFilters[K]) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(0);
  };

  const activeFilterCount = Object.entries(filters).filter(([key, value]) => {
    const empty = key === "query" || key === "from" || key === "to" ? "" : "all";
    return value !== empty;
  }).length;

  return (
    <SectionCard
      id="academic-event-management"
      title="Academic Event Management"
      description="Manage academic activities, examinations, enrollment periods, and institutional events."
      actions={
        <>
          <span className="hidden font-poppins text-[11px] text-cpc-heading-soft sm:inline">
            {filtered.length} of {events.length} events
          </span>
          <button
            type="button"
            onClick={() => onExport(filtered)}
            className={secondaryButtonClass("px-2.5 py-1.5 text-[11px]")}
          >
            <Download className="h-3.5 w-3.5" aria-hidden />
            Export List
          </button>
          <button
            type="button"
            onClick={() => onPrint(filtered)}
            className={secondaryButtonClass("px-2.5 py-1.5 text-[11px]")}
          >
            <Printer className="h-3.5 w-3.5" aria-hidden />
            Print
          </button>
          <button type="button" onClick={onAdd} className={primaryButtonClass("px-2.5 py-1.5 text-[11px]")}>
            <CalendarPlus className="h-3.5 w-3.5" aria-hidden />
            Add Event
          </button>
        </>
      }
      bodyClassName="p-0"
    >
      <div className="border-b border-cpc-tile-border/60 bg-cpc-section-light/35 px-4 py-3">
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-8">
          <label className="relative md:col-span-2">
            <span className="sr-only">Search events</span>
            <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-cpc-muted-blue" aria-hidden />
            <input
              id="event-search"
              value={filters.query}
              onChange={(event) => update("query", event.target.value)}
              placeholder="Search title or description…"
              className="w-full rounded-lg border border-cpc-input-border bg-white py-2 pr-2 pl-7 font-poppins text-xs text-cpc-navy-text placeholder:text-cpc-placeholder transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
            />
          </label>

          <select
            value={filters.category}
            onChange={(event) => update("category", event.target.value as EventCategory | "all")}
            aria-label="Filter by category"
            className="cursor-pointer rounded-lg border border-cpc-input-border bg-white px-3 py-2 font-poppins text-xs text-cpc-navy-text transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
          >
            <option value="all">All categories</option>
            {CATEGORY_ORDER.map((category) => (
              <option key={category} value={category}>
                {CATEGORY_META[category].label}
              </option>
            ))}
          </select>

          <select
            value={filters.status}
            onChange={(event) => update("status", event.target.value as EventStatus | "all")}
            aria-label="Filter by publication status"
            className="cursor-pointer rounded-lg border border-cpc-input-border bg-white px-3 py-2 font-poppins text-xs text-cpc-navy-text transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
          >
            <option value="all">All statuses</option>
            {(Object.keys(STATUS_META) as EventStatus[]).map((status) => (
              <option key={status} value={status}>
                {STATUS_META[status].label}
              </option>
            ))}
          </select>

          <select
            value={filters.year}
            onChange={(event) => update("year", event.target.value as AcademicYear | "all")}
            aria-label="Filter by academic year"
            className="cursor-pointer rounded-lg border border-cpc-input-border bg-white px-3 py-2 font-poppins text-xs text-cpc-navy-text transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
          >
            <option value="all">All years</option>
            {ACADEMIC_YEARS.map((year) => (
              <option key={year} value={year}>
                A.Y. {year}
              </option>
            ))}
          </select>

          <select
            value={filters.semester}
            onChange={(event) => update("semester", event.target.value as Semester | "all")}
            aria-label="Filter by semester"
            className="cursor-pointer rounded-lg border border-cpc-input-border bg-white px-3 py-2 font-poppins text-xs text-cpc-navy-text transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
          >
            <option value="all">All semesters</option>
            {SEMESTERS.map((semester) => (
              <option key={semester} value={semester}>
                {semester}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1">
            <label className="flex min-w-0 flex-1 items-center gap-1">
              <span className="sr-only">From date</span>
              <input
                type="date"
                value={filters.from}
                onChange={(event) => update("from", event.target.value)}
                className="w-full rounded-lg border border-cpc-input-border bg-white px-2 py-2 font-poppins text-xs text-cpc-navy-text transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
              />
            </label>
            <span className="font-poppins text-xs text-cpc-heading-soft">–</span>
            <label className="flex min-w-0 flex-1 items-center gap-1">
              <span className="sr-only">To date</span>
              <input
                type="date"
                value={filters.to}
                onChange={(event) => update("to", event.target.value)}
                className="w-full rounded-lg border border-cpc-input-border bg-white px-2 py-2 font-poppins text-xs text-cpc-navy-text transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
              />
            </label>
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between gap-2">
          <p className="font-poppins text-[11px] text-cpc-heading-soft">
            {activeFilterCount > 0
              ? `${activeFilterCount} filter${activeFilterCount === 1 ? "" : "s"} active`
              : "Showing every event in the demo calendar."}
          </p>
          <button
            type="button"
            onClick={() => {
              setFilters(EMPTY_FILTERS);
              setPage(0);
            }}
            disabled={activeFilterCount === 0}
            className="inline-flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 font-poppins text-[11px] font-semibold text-cpc-blue-accent transition-colors hover:bg-cpc-section-light focus-visible:outline-2 focus-visible:outline-cpc-blue-accent disabled:cursor-not-allowed disabled:opacity-40"
          >
            <X className="h-3.5 w-3.5" aria-hidden />
            Clear filters
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <CalendarEmptyState
          title="No events match these filters"
          description="Try a different keyword, category, status, or date range."
          action={
            <button
              type="button"
              onClick={() => {
                setFilters(EMPTY_FILTERS);
                setPage(0);
              }}
              className={secondaryButtonClass("mt-1")}
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden />
              Clear filters
            </button>
          }
        />
      ) : (
        <>
          <div className="admin-scrollbar max-h-[65vh] overflow-auto">
            <table className="w-full min-w-[880px] border-collapse">
              <thead>
                <tr className="border-b border-cpc-tile-border/60 text-left">
                  {["Event", "Date & time", "Academic period", "Status", "Actions"].map((header) => (
                    <th
                      key={header}
                      scope="col"
                      className="sticky top-0 z-10 bg-cpc-section-light px-3 py-2.5 font-poppins text-[10px] font-bold tracking-[0.1em] text-cpc-heading-soft uppercase whitespace-nowrap"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-cpc-tile-border/50">
                {visible.map((event) => {
                  const meta = CATEGORY_META[event.category];
                  const published = event.status === "published";
                  return (
                    <tr
                      key={event.id}
                      className="transition-colors hover:bg-cpc-section-light/45"
                    >
                      <td className="max-w-[320px] px-3 py-2.5">
                        <div className="flex items-start gap-2">
                          <span
                            className={cn("mt-0.5 h-2 w-2 shrink-0 rounded-full", meta.dotClass)}
                            aria-hidden
                          />
                          <div className="min-w-0">
                            <p
                              className={cn(
                                "truncate font-poppins text-xs font-semibold text-cpc-navy-text",
                                event.status === "cancelled" && "line-through opacity-70",
                              )}
                            >
                              {event.title}
                            </p>
                            <p className="mt-0.5 flex flex-wrap items-center gap-x-2 font-poppins text-[11px] text-cpc-heading-soft">
                              <span className={cn("font-semibold", meta.textClass)}>{meta.label}</span>
                              {event.location && <span className="truncate">{event.location}</span>}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 font-poppins text-[11px] text-cpc-navy-text">
                        <span className="block font-semibold">{eventDateRange(event)}</span>
                        <span className="mt-0.5 block text-[11px] text-cpc-heading-soft">
                          {formatTimeRange(event)}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 font-poppins text-[11px] text-cpc-navy-text">
                        <span className="block font-semibold">A.Y. {event.academicYear}</span>
                        <span className="mt-0.5 block text-[11px] text-cpc-heading-soft">
                          {event.semester}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <StatusBadge status={event.status} />
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-0.5">
                          <button
                            type="button"
                            onClick={() => onView(event)}
                            aria-label={`View ${event.title}`}
                            title="View details"
                            className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-cpc-heading-soft transition-colors hover:bg-cpc-section-light hover:text-cpc-blue-accent focus-visible:outline-2 focus-visible:outline-cpc-blue-accent"
                          >
                            <Eye className="h-3.5 w-3.5" aria-hidden />
                          </button>
                          <button
                            type="button"
                            onClick={() => onEdit(event)}
                            aria-label={`Edit ${event.title}`}
                            title="Edit event"
                            className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-cpc-heading-soft transition-colors hover:bg-cpc-section-light hover:text-cpc-blue-accent focus-visible:outline-2 focus-visible:outline-cpc-blue-accent"
                          >
                            <PencilLine className="h-3.5 w-3.5" aria-hidden />
                          </button>
                          <button
                            type="button"
                            onClick={() => onTogglePublish(event)}
                            aria-label={`${published ? "Unpublish" : "Publish"} ${event.title}`}
                            title={published ? "Unpublish" : "Publish"}
                            className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-cpc-heading-soft transition-colors hover:bg-cpc-section-light hover:text-emerald-700 focus-visible:outline-2 focus-visible:outline-cpc-blue-accent"
                          >
                            {published ? (
                              <EyeOff className="h-3.5 w-3.5" aria-hidden />
                            ) : (
                              <Send className="h-3.5 w-3.5" aria-hidden />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => onArchive(event)}
                            aria-label={`${event.status === "archived" ? "Restore" : "Archive"} ${event.title}`}
                            title={event.status === "archived" ? "Restore event" : "Archive event"}
                            className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-cpc-heading-soft transition-colors hover:bg-cpc-section-light hover:text-cpc-blue-accent focus-visible:outline-2 focus-visible:outline-cpc-blue-accent"
                          >
                            {event.status === "archived" ? (
                              <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                            ) : (
                              <Archive className="h-3.5 w-3.5" aria-hidden />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => onDelete(event)}
                            aria-label={`Delete ${event.title}`}
                            title="Delete event"
                            className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-cpc-heading-soft transition-colors hover:bg-rose-50 hover:text-rose-600 focus-visible:outline-2 focus-visible:outline-rose-500"
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-cpc-tile-border/60 px-3 py-2.5">
            <p className="font-poppins text-[11px] text-cpc-heading-soft">
              Showing {safePage * PAGE_SIZE + 1}–
              {Math.min(filtered.length, (safePage + 1) * PAGE_SIZE)} of {filtered.length}
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(0, current - 1))}
                disabled={safePage === 0}
                className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-cpc-tile-border bg-white text-cpc-navy-text transition-colors hover:bg-cpc-section-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
              </button>
              <span className="px-1.5 font-poppins text-[11px] font-semibold text-cpc-navy-text">
                {safePage + 1} / {pageCount}
              </span>
              <button
                type="button"
                onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))}
                disabled={safePage >= pageCount - 1}
                className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-cpc-tile-border bg-white text-cpc-navy-text transition-colors hover:bg-cpc-section-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Next page"
              >
                <ChevronRight className="h-3.5 w-3.5" aria-hidden />
              </button>
            </div>
          </div>
        </>
      )}
    </SectionCard>
  );
}
