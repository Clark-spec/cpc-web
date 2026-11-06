import { useMemo, useRef } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { cn } from "@/lib/cn";
import { useScheduleAdmin } from "../context/ScheduleAdminContext";
import type { SectionTab } from "../types";

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
    <div
      role="tablist"
      aria-label="Schedule section"
      onKeyDown={handleKeyDown}
      className="admin-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1"
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
              "inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3.5 py-2 font-poppins text-xs font-semibold whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent",
              active
                ? "border-cpc-blue-accent bg-cpc-blue-accent text-white"
                : "border-cpc-tile-border/70 bg-white text-cpc-navy-text hover:bg-cpc-section-light",
            )}
          >
            {tab.label}
            <span
              aria-live="polite"
              className={cn(
                "inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] leading-none font-bold tabular-nums",
                active ? "bg-white/25 text-white" : "bg-cpc-section-light text-cpc-blue-accent",
              )}
            >
              {tab.entries}
            </span>
            {/* The count is spelled out, so the amber dot is a locator, not the message. */}
            {tab.conflicts > 0 && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] leading-none font-bold tabular-nums",
                  active ? "bg-white/25 text-white" : "bg-amber-50 text-amber-700",
                )}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden />
                {tab.conflicts} clash{tab.conflicts === 1 ? "" : "es"}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
