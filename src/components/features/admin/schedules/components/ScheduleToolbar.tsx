import type { RefObject } from "react";
import { Check, LayoutGrid, List, RefreshCw, Search, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { DAY_CODES, DAY_LABELS } from "@/utils/scheduleTime";
import { useScheduleAdmin } from "../context/ScheduleAdminContext";
import type { GridOverlayMode, ScheduleEditorView, ScheduleFilters } from "../types";

const FIELD_BASE =
  "w-full rounded-lg border border-cpc-input-border bg-white px-3 py-2 font-poppins text-xs text-cpc-navy-text placeholder:text-cpc-placeholder transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent";

const LABEL_BASE =
  "mb-1 block font-poppins text-[10px] font-bold tracking-[0.12em] text-cpc-heading-soft uppercase";

const SELECT_BASE = cn(FIELD_BASE, "cursor-pointer");

const STATUS_OPTIONS: { value: ScheduleFilters["status"]; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "not_active", label: "Not active" },
];

const VIEW_OPTIONS: { value: ScheduleEditorView; label: string; icon: typeof List }[] = [
  { value: "table", label: "List", icon: List },
  { value: "grid", label: "Weekly grid", icon: LayoutGrid },
];

const OVERLAY_MODES: { value: GridOverlayMode; label: string }[] = [
  { value: "none", label: "No ghost overlay" },
  { value: "instructor", label: "Ghost one teacher" },
  { value: "room", label: "Ghost one room" },
];

type ScheduleToolbarProps = {
  /** The page passes this so the `/` shortcut can focus the search box. */
  searchInputRef?: RefObject<HTMLInputElement | null>;
};

/**
 * Scope and filter controls (spec §3).
 *
 * Every control writes through `setFilters`, which serialises the whole filter
 * set into the URL — so a filtered view is shareable, survives a refresh, and
 * the KPI cards can narrow the same list without duplicating this state.
 */
export function ScheduleToolbar({ searchInputRef }: ScheduleToolbarProps) {
  const {
    activeFilterCount,
    clearFilters,
    filters,
    loading,
    master,
    overlay,
    reload,
    roomSet,
    setFilters,
    setOverlay,
    setRoomSet,
    setView,
    view,
  } = useScheduleAdmin();

  const setFilter = <K extends keyof ScheduleFilters>(key: K, value: ScheduleFilters[K]) =>
    setFilters({ ...filters, [key]: value });

  const instructors = master.instructors.filter((item) => item.active);
  const rooms = master.rooms.filter((item) => item.active);
  /* An online "room" has no door to ghost, so the overlay lists real ones. */
  const physicalRooms = rooms.filter((item) => item.type !== "online");

  return (
    <section
      aria-label="Schedule search and filters"
      className="rounded-2xl border border-cpc-tile-border/70 bg-white p-4 shadow-[0_18px_50px_rgba(15,36,104,0.22)]"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12 lg:items-start">
        <div className="sm:col-span-2 lg:col-span-4">
          <label htmlFor="schedule-search" className={LABEL_BASE}>
            Search
          </label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-cpc-muted-blue"
              aria-hidden
            />
            <input
              id="schedule-search"
              ref={searchInputRef}
              type="search"
              value={filters.search}
              onChange={(event) => setFilter("search", event.target.value)}
              placeholder="Subject code, title, teacher or room"
              className={cn(FIELD_BASE, "pl-8")}
            />
          </div>
        </div>

        <div className="lg:col-span-2">
          <label htmlFor="schedule-day" className={LABEL_BASE}>
            Day
          </label>
          <select
            id="schedule-day"
            value={filters.day}
            onChange={(event) => setFilter("day", event.target.value as ScheduleFilters["day"])}
            className={SELECT_BASE}
          >
            <option value="all">Every day</option>
            {DAY_CODES.map((day) => (
              <option key={day} value={day}>
                {DAY_LABELS[day]}
              </option>
            ))}
          </select>
        </div>

        <div className="lg:col-span-2">
          <label htmlFor="schedule-instructor" className={LABEL_BASE}>
            Instructor
          </label>
          <select
            id="schedule-instructor"
            value={filters.instructorId}
            onChange={(event) => setFilter("instructorId", event.target.value)}
            className={SELECT_BASE}
          >
            <option value="all">Everyone</option>
            {instructors.map((item) => (
              <option key={item.id} value={item.id}>
                {item.displayName}
              </option>
            ))}
          </select>
        </div>

        <div className="lg:col-span-2">
          <label htmlFor="schedule-room" className={LABEL_BASE}>
            Room
          </label>
          <select
            id="schedule-room"
            value={filters.room}
            onChange={(event) => setFilter("room", event.target.value)}
            className={SELECT_BASE}
          >
            <option value="all">Every room</option>
            {rooms.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>

        <div className="lg:col-span-2">
          <label htmlFor="schedule-status" className={LABEL_BASE}>
            Status
          </label>
          <select
            id="schedule-status"
            value={filters.status}
            onChange={(event) => setFilter("status", event.target.value as ScheduleFilters["status"])}
            className={SELECT_BASE}
          >
            <option value="all">Both</option>
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:col-span-2 lg:col-span-7">
          <button
            type="button"
            aria-pressed={filters.onlyConflicts}
            onClick={() => setFilter("onlyConflicts", !filters.onlyConflicts)}
            className={cn(
              "inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-2 font-poppins text-xs font-semibold whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent",
              filters.onlyConflicts
                ? "border-cpc-blue-accent bg-cpc-blue-accent text-white"
                : "border-cpc-tile-border/70 bg-white text-cpc-navy-text hover:bg-cpc-section-light",
            )}
          >
            {filters.onlyConflicts && <Check className="h-3.5 w-3.5 shrink-0" aria-hidden />}
            Conflicts only
          </button>

          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-cpc-tile-border/70 bg-white px-3 py-2 font-poppins text-xs font-semibold text-cpc-heading-soft transition-colors hover:bg-cpc-section-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
            >
              <X className="h-3.5 w-3.5 shrink-0" aria-hidden />
              Clear {activeFilterCount} filter{activeFilterCount === 1 ? "" : "s"}
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:col-span-2 lg:col-span-5 lg:justify-end">
          <button
            type="button"
            onClick={() => void reload()}
            disabled={loading}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-cpc-tile-border bg-white px-3 py-2 font-poppins text-xs font-semibold text-cpc-navy-text transition-colors hover:bg-cpc-section-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              className={cn(
                "h-3.5 w-3.5 shrink-0",
                loading && "animate-spin motion-reduce:animate-none",
              )}
              aria-hidden
            />
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        {/* Grid-only controls sit on their own row so the filter grid never
            reflows when the view changes. */}
        <div className="flex flex-wrap items-center gap-2 sm:col-span-2 lg:col-span-12 lg:justify-between">
          <div
            role="group"
            aria-label="Editor view"
            className="flex rounded-lg border border-cpc-input-border bg-white p-1"
          >
            {VIEW_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                id={`schedule-view-${option.value}`}
                aria-pressed={view === option.value}
                onClick={() => setView(option.value)}
                className={cn(
                  "inline-flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 font-poppins text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent",
                  view === option.value
                    ? "bg-cpc-blue-accent text-white"
                    : "text-cpc-heading-soft hover:bg-cpc-section-light hover:text-cpc-navy-text",
                )}
              >
                <option.icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {option.label}
              </button>
            ))}
          </div>

          {view === "grid" && (
            <div className="flex flex-wrap items-center gap-2">
              <div
                role="group"
                aria-label="Choose room set"
                className="flex rounded-lg border border-cpc-input-border bg-white p-1"
              >
                {(["A", "B"] as const).map((set) => (
                  <button
                    key={set}
                    type="button"
                    aria-pressed={roomSet === set}
                    onClick={() => setRoomSet(set)}
                    className={cn(
                      "cursor-pointer rounded-md px-3 py-1.5 font-poppins text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent",
                      roomSet === set
                        ? "bg-cpc-blue-accent text-white"
                        : "text-cpc-heading-soft hover:bg-cpc-section-light hover:text-cpc-navy-text",
                    )}
                  >
                    Set {set}
                  </button>
                ))}
              </div>

              <label htmlFor="schedule-overlay" className="sr-only">
                Ghost overlay
              </label>
              <select
                id="schedule-overlay"
                value={overlay.mode}
                onChange={(event) =>
                  setOverlay({ mode: event.target.value as GridOverlayMode, id: "" })
                }
                className={cn(SELECT_BASE, "w-auto")}
              >
                {OVERLAY_MODES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              {overlay.mode !== "none" && (
                <>
                  <label htmlFor="schedule-overlay-id" className="sr-only">
                    {overlay.mode === "instructor" ? "Ghost teacher" : "Ghost room"}
                  </label>
                  <select
                    id="schedule-overlay-id"
                    value={overlay.id}
                    onChange={(event) => setOverlay({ mode: overlay.mode, id: event.target.value })}
                    className={cn(SELECT_BASE, "w-auto max-w-[12rem]")}
                  >
                    <option value="">
                      {overlay.mode === "instructor" ? "Choose a teacher" : "Choose a room"}
                    </option>
                    {(overlay.mode === "instructor"
                      ? instructors.map((item) => ({ value: item.id, label: item.displayName }))
                      : physicalRooms.map((item) => ({ value: item.name, label: item.name }))
                    ).map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
