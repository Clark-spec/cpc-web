import { useMemo, useRef } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/cn";
import { useScheduleAdmin } from "@/components/features/admin/schedules/ScheduleAdminContext";
import type { SectionTab } from "@/components/features/admin/schedules/types";

/**
 * Section scope tabs (spec §3).
 *
 * "All sections" exists because most real mistakes are cross-section: a teacher
 * or a room double-booked between two schedules is only visible when both are
 * on screen at once, which the section-scoped grid cannot show on its own.
 */
export function SectionTabs() {
  const { conflictsBySection, scopedSchedules, section, setSection } = useScheduleAdmin();
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const tabs = useMemo(() => {
    /* The tab list is the staff member's own scope, so "All sections" counts
     * exactly the rows that tab will reveal — not the whole college. */
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

  const activeIndex = Math.max(
    0,
    tabs.findIndex((tab) => tab.value === section),
  );

  /** Roving focus — ArrowLeft/ArrowRight walk the tablist and change the scope. */
  function handleKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const step = event.key === "ArrowRight" ? 1 : -1;
    const next = (activeIndex + step + tabs.length) % tabs.length;
    setSection(tabs[next].value);
    tabRefs.current[next]?.focus();
  }

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

      <div
        role="tablist"
        aria-label="Schedule section"
        onKeyDown={handleKeyDown}
        className="admin-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1.5 pt-0.5"
      >
        {tabs.map((tab, index) => {
          const active = section === tab.value;
          return (
            <button
              key={tab.value}
              ref={(element) => {
                tabRefs.current[index] = element;
              }}
              type="button"
              role="tab"
              aria-selected={active}
              tabIndex={active ? 0 : -1}
              onClick={() => setSection(tab.value)}
              className={cn(
                "inline-flex cursor-pointer items-center gap-2 rounded-full border px-3.5 py-2 font-poppins text-xs font-semibold whitespace-nowrap transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent",
                active
                  ? "border-cpc-blue-accent bg-cpc-blue-accent text-white shadow-xs"
                  : "border-cpc-input-border/70 bg-white/80 text-cpc-navy-text hover:border-cpc-blue-accent/40 hover:bg-white hover:text-cpc-blue-accent shadow-2xs",
              )}
            >
              <span>{tab.label}</span>
              <span
                aria-live="polite"
                className={cn(
                  "inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] leading-none font-bold tabular-nums transition-colors",
                  active ? "bg-white/20 text-white" : "bg-cpc-section-light text-cpc-blue-accent",
                )}
              >
                {tab.entries}
              </span>
              {/* The count is spelled out, so the amber/rose badge is a clear locator */}
              {tab.conflicts > 0 && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] leading-none font-bold tabular-nums",
                    active
                      ? "bg-rose-500 text-white"
                      : "bg-rose-50 text-rose-600 ring-1 ring-rose-200/80",
                  )}
                  title={`${tab.conflicts} conflict${tab.conflicts === 1 ? "" : "s"}`}
                >
                  <AlertTriangle className="h-2.5 w-2.5 shrink-0" aria-hidden />
                  {tab.conflicts}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
