import { useMemo } from "react";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/cn";
import { useScheduleAdmin } from "@/components/features/admin/schedules/ScheduleAdminContext";
import { SectionCascadeSelect } from "@/components/common/selection/SectionCascadeSelect";
import type { SectionTab } from "@/components/features/admin/schedules/types";
import type { SectionId } from "@/types/schedule";

/**
 * Section scope picker (spec §3).
 *
 * The tab strip used to list every in-scope section horizontally. The cascade
 * keeps the same section state but groups it by department and year level, so
 * a dean with many sections does not have to scroll sideways to reach one.
 */
export function SectionTabs() {
  const { conflictsBySection, scopedSchedules, section, setSection } = useScheduleAdmin();

  const tabs = useMemo(() => {
    /* The options are the staff member's own scope, so "All sections" counts
     * exactly the rows that choice will reveal — not the whole college. */
    const scoped = scopedSchedules.map((schedule) => ({
      id: schedule.section,
      entries: schedule.entries.length,
      conflicts: conflictsBySection[schedule.section] ?? 0,
    }));

    return [
      {
        value: "all" as SectionTab,
        label: "All sections",
        entries: scoped.reduce((total, item) => total + item.entries, 0),
        conflicts: scoped.reduce((total, item) => total + item.conflicts, 0),
      },
      ...scoped.map((item) => ({
        value: item.id as SectionTab,
        label: item.id,
        entries: item.entries,
        conflicts: item.conflicts,
      })),
    ];
  }, [conflictsBySection, scopedSchedules]);

  const sections = useMemo(
    () => Array.from(new Set(scopedSchedules.map((schedule) => schedule.section))),
    [scopedSchedules],
  );
  const tabByValue = useMemo(() => new Map(tabs.map((tab) => [tab.value, tab])), [tabs]);

  const optionMeta = (value: SectionId | "all") => {
    const tab = tabByValue.get(value);
    if (!tab) return null;
    return (
      <span className="inline-flex items-center gap-1">
        <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-cpc-section-light px-1.5 py-0.5 text-[10px] leading-none font-bold text-cpc-blue-accent tabular-nums">
          {tab.entries}
        </span>
        {tab.conflicts > 0 && (
          <span
            className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-1.5 py-0.5 text-[10px] leading-none font-bold text-rose-600 tabular-nums ring-1 ring-rose-200/80"
            title={`${tab.conflicts} conflict${tab.conflicts === 1 ? "" : "s"}`}
          >
            <AlertTriangle className="h-2.5 w-2.5 shrink-0" aria-hidden />
            {tab.conflicts}
          </span>
        )}
      </span>
    );
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between px-0.5">
        <span className="font-poppins text-[10px] font-bold tracking-[0.12em] text-cpc-heading-soft uppercase">
          Section Scope
        </span>
        <span className="font-poppins text-xs font-semibold text-cpc-blue-accent">
          {tabs.length} {tabs.length === 1 ? "Section" : "Sections"}
        </span>
      </div>

      <SectionCascadeSelect
        value={section}
        onChange={(next) => setSection(next === "all" ? "all" : next)}
        sections={sections}
        showAll
        allLabel="All sections"
        optionMeta={optionMeta}
        ariaLabel="Schedule section scope"
        className={cn("w-full sm:max-w-[320px]")}
        menuClassName="sm:w-[320px]"
      />
    </div>
  );
}
