import { useMemo } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatTimeRange } from "@/utils/scheduleTime";
import { useScheduleAdmin } from "../context/ScheduleAdminContext";
import { KIND_GROUPS } from "../utils/conflictKinds";
import type { Conflict } from "../types";

/**
 * Conflict panel (spec §9).
 *
 * The engine behind this lives in `utils/conflicts.ts` and explains itself
 * there: two classes collide only when `aStart < bEnd && bStart < aEnd`, so a
 * class ending at 13:00 and the next starting at 13:00 are legal, and ONLINE is
 * exempt from the room rule because nobody occupies a room that does not exist.
 * This component only decides what to show: the clashes are grouped by the rule
 * they broke, because the fix differs — a section clash is a timetable mistake,
 * a teacher clash is a workload one, a room clash is a capacity one.
 *
 * `conflicts` is already scoped to the classes on screen, so a dean never sees
 * another department's mess and an instructor never sees the whole college.
 */
export function ConflictPanel() {
  const { conflicts, draft, filters, section, setFilters, selectEntry } = useScheduleAdmin();

  const codeById = useMemo(() => {
    const map = new Map<string, string>();
    for (const schedule of draft.schedules) {
      for (const entry of schedule.entries) {
        map.set(entry.id, `${entry.subjectCode} (${schedule.section})`);
      }
    }
    return map;
  }, [draft.schedules]);

  const groups = useMemo(
    () =>
      KIND_GROUPS.map((group) => ({
        ...group,
        items: conflicts.filter((conflict) => conflict.kind === group.kind),
      })).filter((group) => group.items.length > 0),
    [conflicts],
  );

  if (conflicts.length === 0) {
    return (
      <section
        aria-label="Schedule conflicts"
        className="rounded-2xl border border-cpc-tile-border/70 bg-white p-4 shadow-[0_18px_50px_rgba(15,36,104,0.22)]"
      >
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
          <p className="font-poppins text-sm font-semibold text-cpc-navy-text">
            No conflicts in {section === "all" ? "these sections" : section}
          </p>
        </div>
        <p className="mt-1 font-poppins text-xs text-cpc-heading-soft">
          Every class fits its room, its teacher and its section.
        </p>
      </section>
    );
  }

  return (
    <section
      aria-label="Schedule conflicts"
      className="rounded-2xl border border-cpc-tile-border/70 bg-white shadow-[0_18px_50px_rgba(15,36,104,0.22)]"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cpc-tile-border/70 px-4 py-3">
        <p className="font-poppins text-sm font-semibold text-cpc-navy-text" aria-live="polite">
          {conflicts.length} conflict{conflicts.length === 1 ? "" : "s"} to resolve
        </p>
        <button
          type="button"
          aria-pressed={filters.onlyConflicts}
          onClick={() => setFilters({ ...filters, onlyConflicts: !filters.onlyConflicts })}
          className="cursor-pointer rounded-lg border border-cpc-tile-border bg-white px-3 py-1.5 font-poppins text-[11px] font-semibold text-cpc-navy-text transition-colors hover:bg-cpc-section-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
        >
          {filters.onlyConflicts ? "Show every class" : "Show only clashing classes"}
        </button>
      </div>

      <ul className="divide-y divide-cpc-tile-border/70">
        {groups.map((group) => (
          <li key={group.kind} className="p-4">
            <p className="font-poppins text-[10px] font-bold tracking-[0.12em] text-cpc-heading-soft uppercase">
              {group.label}
            </p>
            <p className="mt-0.5 font-poppins text-[11px] text-cpc-muted-blue">{group.hint}</p>

            <ul className="mt-2 space-y-2">
              {group.items.map((conflict) => (
                <ConflictRow
                  key={conflict.id}
                  conflict={conflict}
                  labelFor={(entryId) => codeById.get(entryId) ?? "this class"}
                  onGo={selectEntry}
                />
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </section>
  );
}

type ConflictRowProps = {
  conflict: Conflict;
  labelFor: (entryId: string) => string;
  onGo: (entryId: string) => void;
};

function ConflictRow({ conflict, labelFor, onGo }: ConflictRowProps) {
  return (
    <li
      className={cn(
        "flex flex-wrap items-start justify-between gap-2 rounded-xl border border-rose-200 bg-rose-50/60 px-3 py-2",
      )}
    >
      <div className="min-w-0">
        <p className="font-poppins text-xs font-semibold text-cpc-navy-text">
          {conflict.day} · {formatTimeRange(conflict.startMin, conflict.endMin)}
        </p>
        <p className="mt-0.5 font-poppins text-[11px] text-cpc-heading-soft">{conflict.message}</p>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-1.5">
        {conflict.entryIds.map((entryId) => (
          <button
            key={entryId}
            type="button"
            onClick={() => onGo(entryId)}
            aria-label={`Go to ${labelFor(entryId)}`}
            className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-cpc-tile-border bg-white px-2 py-1 font-poppins text-[11px] font-semibold text-cpc-navy-text transition-colors hover:bg-cpc-section-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
          >
            <span className="max-w-[9rem] truncate">{labelFor(entryId)}</span>
            <ArrowRight className="h-3 w-3 shrink-0" aria-hidden />
          </button>
        ))}
      </div>
    </li>
  );
}
