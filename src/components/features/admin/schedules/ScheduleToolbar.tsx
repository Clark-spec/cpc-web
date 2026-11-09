import type { RefObject } from "react";
import { Check, Copy, LayoutGrid, List, Plus, RefreshCw, Search, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { DAY_CODES, DAY_LABELS } from "@/lib/scheduleTime";
import { useScheduleAdmin } from "@/components/features/admin/schedules/ScheduleAdminContext";
import type { GridOverlayMode, ScheduleEditorView, ScheduleFilters, SectionId } from "@/components/features/admin/schedules/types";
import { SectionTabs } from "@/components/features/admin/schedules/SectionTabs";

const FIELD_BASE =
  "w-full rounded-xl border border-cpc-input-border/80 bg-white/90 px-3.5 py-2 font-poppins text-xs text-cpc-navy-text placeholder:text-cpc-placeholder shadow-2xs backdrop-blur-xs transition-all focus:border-cpc-blue-accent focus:bg-white focus:ring-2 focus:ring-cpc-blue-accent/20 focus-visible:outline-hidden";

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
  /** Opens the entry form for a new class. */
  onNewClass: () => void;
  /** Opens the copy-a-section dialog for the section being looked at. */
  onDuplicate: () => void;
};

/**
 * Scope and filter controls (spec §3).
 *
 * Every control writes through `setFilters`, which serialises the whole filter
 * set into the URL — so a filtered view is shareable, survives a refresh, and
 * the KPI cards can narrow the same list without duplicating this state.
 */
export function ScheduleToolbar({ searchInputRef, onNewClass, onDuplicate }: ScheduleToolbarProps) {
  const {
    activeFilterCount,
    canEditSection,
    clearFilters,
    editDisabledReason,
    filters,
    loading,
    master,
    overlay,
    reload,
    roomSet,
    section,
    sectionsForRole,
    setFilters,
    setOverlay,
    setRoomSet,
    setView,
    view,
  } = useScheduleAdmin();

  /* New class and duplicate both write into one section. On "All sections" a
   * new class still has a home — the first section this role owns — but a copy
   * would be aimed at nothing, so that one waits for a tab. */
  const targetSection: SectionId = section === "all" ? sectionsForRole[0] : section;
  const roleReason = editDisabledReason(targetSection) ?? "";
  const newDisabled = !canEditSection(targetSection);
  const duplicateDisabled = newDisabled || section === "all";
  const duplicateReason =
    roleReason !== "" ? roleReason : "Open one section tab to duplicate it.";

  const setFilter = <K extends keyof ScheduleFilters>(key: K, value: ScheduleFilters[K]) =>
    setFilters({ ...filters, [key]: value });

  const instructors = master.instructors.filter((item) => item.active);
  const rooms = master.rooms.filter((item) => item.active);
  /* An online "room" has no door to ghost, so the overlay lists real ones. */
  const physicalRooms = rooms.filter((item) => item.type !== "online");

  return (
    <section
      aria-label="Schedule search and filters"
      className="rounded-2xl border border-white/80 bg-white/85 p-5 shadow-[0_8px_30px_rgb(15,36,104,0.04)] backdrop-blur-md space-y-4"
    >
      {/* Section Scope Tabs */}
      <SectionTabs />

      <div className="h-px w-full bg-cpc-input-border/60" />

      {/* Main Filter Bar */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-12 items-end">
        <div className="sm:col-span-2 md:col-span-3 lg:col-span-4">
          <label htmlFor="schedule-search" className={LABEL_BASE}>
            Search Classes
          </label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-cpc-muted-blue"
              aria-hidden
            />
            <input
              id="schedule-search"
              ref={searchInputRef}
              type="search"
              value={filters.search}
              onChange={(event) => setFilter("search", event.target.value)}
              placeholder="Code, title, instructor or room..."
              className={cn(FIELD_BASE, "pl-9")}
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
            <option value="all">All Days</option>
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
            <option value="all">All Instructors</option>
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
            <option value="all">All Rooms</option>
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
            <option value="all">All Statuses</option>
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Bottom Bar: Quick Filter Pills, View Controls & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            aria-pressed={filters.onlyConflicts}
            onClick={() => setFilter("onlyConflicts", !filters.onlyConflicts)}
            className={cn(
              "inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 font-poppins text-xs font-semibold whitespace-nowrap transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent",
              filters.onlyConflicts
                ? "border-rose-400 bg-rose-500 text-white shadow-xs"
                : "border-cpc-input-border/70 bg-white/80 text-cpc-navy-text hover:border-cpc-blue-accent/40 hover:bg-white shadow-2xs",
            )}
          >
            {filters.onlyConflicts ? (
              <Check className="h-3.5 w-3.5 shrink-0" aria-hidden />
            ) : (
              <span className="h-2 w-2 rounded-full bg-rose-500" aria-hidden />
            )}
            Conflicts only
          </button>

          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-cpc-input-border/70 bg-white/80 px-3 py-1.5 font-poppins text-xs font-semibold text-cpc-heading-soft transition-all duration-200 hover:border-cpc-blue-accent/30 hover:bg-white hover:text-cpc-navy-text shadow-2xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
            >
              <X className="h-3.5 w-3.5 shrink-0" aria-hidden />
              Clear {activeFilterCount} filter{activeFilterCount === 1 ? "" : "s"}
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5 ml-auto">
          {/* View switcher */}
          <div
            role="group"
            aria-label="Editor view"
            className="flex items-center rounded-xl border border-cpc-input-border/80 bg-cpc-section-light/60 p-1 backdrop-blur-xs shadow-2xs"
          >
            {VIEW_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                id={`schedule-view-${option.value}`}
                aria-pressed={view === option.value}
                onClick={() => setView(option.value)}
                className={cn(
                  "inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 font-poppins text-xs font-semibold transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent",
                  view === option.value
                    ? "bg-cpc-blue-accent text-white shadow-xs"
                    : "text-cpc-heading-soft hover:bg-white hover:text-cpc-navy-text",
                )}
              >
                <option.icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {option.label}
              </button>
            ))}
          </div>

          {/* Grid view options */}
          {view === "grid" && (
            <div className="flex flex-wrap items-center gap-2">
              <div
                role="group"
                aria-label="Choose room set"
                className="flex items-center rounded-xl border border-cpc-input-border/80 bg-cpc-section-light/60 p-1 backdrop-blur-xs shadow-2xs"
              >
                {(["A", "B"] as const).map((set) => (
                  <button
                    key={set}
                    type="button"
                    aria-pressed={roomSet === set}
                    onClick={() => setRoomSet(set)}
                    className={cn(
                      "cursor-pointer rounded-lg px-2.5 py-1.5 font-poppins text-xs font-semibold transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent",
                      roomSet === set
                        ? "bg-cpc-blue-accent text-white shadow-xs"
                        : "text-cpc-heading-soft hover:bg-white hover:text-cpc-navy-text",
                    )}
                  >
                    Set {set}
                  </button>
                ))}
              </div>

              <select
                id="schedule-overlay"
                aria-label="Ghost overlay"
                value={overlay.mode}
                onChange={(event) =>
                  setOverlay({ mode: event.target.value as GridOverlayMode, id: "" })
                }
                className={cn(SELECT_BASE, "w-auto py-1.5 text-xs")}
              >
                {OVERLAY_MODES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              {overlay.mode !== "none" && (
                <select
                  id="schedule-overlay-id"
                  aria-label={overlay.mode === "instructor" ? "Ghost teacher" : "Ghost room"}
                  value={overlay.id}
                  onChange={(event) => setOverlay({ mode: overlay.mode, id: event.target.value })}
                  className={cn(SELECT_BASE, "w-auto max-w-[12rem] py-1.5 text-xs")}
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
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="schedule-new-class"
              onClick={onNewClass}
              disabled={newDisabled}
              title={newDisabled ? roleReason : undefined}
              className={cn(
                "inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-cpc-blue-accent px-3.5 py-2 font-poppins text-xs font-semibold text-white shadow-xs transition-all duration-200 hover:bg-cpc-navy hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent disabled:cursor-not-allowed disabled:opacity-60",
              )}
            >
              <Plus className="h-3.5 w-3.5 shrink-0" aria-hidden />
              New class
            </button>

            <button
              type="button"
              id="schedule-duplicate"
              onClick={onDuplicate}
              disabled={duplicateDisabled}
              title={duplicateDisabled ? duplicateReason : undefined}
              className={cn(
                "inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-cpc-input-border/80 bg-white/90 px-3 py-2 font-poppins text-xs font-semibold text-cpc-navy-text shadow-2xs backdrop-blur-xs transition-all duration-200 hover:border-cpc-blue-accent/30 hover:bg-white hover:text-cpc-blue-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent disabled:cursor-not-allowed disabled:opacity-60",
              )}
            >
              <Copy className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span className="hidden sm:inline">Duplicate section</span>
              <span className="sm:hidden">Duplicate</span>
            </button>

            <button
              type="button"
              onClick={() => void reload()}
              disabled={loading}
              title="Refresh schedule"
              className={cn(
                "inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-cpc-input-border/80 bg-white/90 px-3 py-2 font-poppins text-xs font-semibold text-cpc-navy-text shadow-2xs backdrop-blur-xs transition-all duration-200 hover:border-cpc-blue-accent/30 hover:bg-white hover:text-cpc-blue-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent disabled:cursor-not-allowed disabled:opacity-60",
              )}
            >
              <RefreshCw
                className={cn(
                  "h-3.5 w-3.5 shrink-0",
                  loading && "animate-spin motion-reduce:animate-none",
                )}
                aria-hidden
              />
              <span className="hidden md:inline">{loading ? "Refreshing…" : "Refresh"}</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}