import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { useCurrentTime } from "@/components/features/student/schedules/useCurrentTime";
import { useSchedule } from "@/components/features/student/schedules/useSchedule";
import type { DayCode, ScheduleEntry, SectionSchedule } from "@/types/schedule";
import { layoutEvents, type PositionedEvent } from "@/lib/layoutEvents";
import {
  DAY_CODES,
  DAY_END_MIN,
  DAY_INDEX,
  DAY_START_MIN,
  HOUR_HEIGHT,
  addDays,
  dayFromDate,
  formatHourLabel,
  formatWeekRange,
  formatWeekdayDate,
  isSameDate,
  minutesSinceMidnight,
  startOfWeek,
} from "@/lib/scheduleTime";
import { CalendarEventBlock } from "@/components/features/student/schedules/CalendarEventBlock";
import { DayAgendaView } from "@/components/features/student/schedules/DayAgendaView";

type WeeklyCalendarProps = {
  schedule: SectionSchedule;
  onOpenEntry: (entry: ScheduleEntry) => void;
};

/** Tracks the md breakpoint so we only render one calendar variant at a time. */
function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches,
  );

  useEffect(() => {
    const query = window.matchMedia("(min-width: 768px)");
    const update = () => setIsDesktop(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return isDesktop;
}

type WeekGridProps = {
  schedule: SectionSchedule;
  weekStart: Date;
  roomSet: "A" | "B";
  now: Date;
  today: DayCode | null;
  showNowLine: boolean;
  nowTop: number;
  activeColorKey: string | null;
  highlightedId: string | null;
  onOpenEntry: (entry: ScheduleEntry) => void;
};

/**
 * The desktop grid.
 *
 * PIXEL MATH
 * The visible window is 7:00 AM (420 min) to 8:00 PM (1200 min) and one hour
 * is 64px. A block's top and height therefore are:
 *   top    = (startMin - 420) / 60 * 64
 *   height = (endMin - startMin) / 60 * 64
 * Grid lines and hour labels use the same formula, which is why a label sits
 * exactly on its line. `layoutEvents` adds the overlap lanes, and each block
 * then insets itself by 2px so back-to-back classes never touch.
 */
function WeekGrid({
  schedule,
  weekStart,
  roomSet,
  now,
  today,
  showNowLine,
  nowTop,
  activeColorKey,
  highlightedId,
  onOpenEntry,
}: WeekGridProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const totalHeight = ((DAY_END_MIN - DAY_START_MIN) / 60) * HOUR_HEIGHT;
  // 7..20 inclusive: the labels and the grid lines share these values.
  const hours = Array.from({ length: 14 }, (_, index) => 7 + index);

  const positionedByDay = useMemo(() => {
    const map = new Map<DayCode, PositionedEvent[]>();
    for (const day of DAY_CODES) {
      map.set(day, layoutEvents(schedule.entries, day));
    }
    return map;
  }, [schedule.entries]);

  return (
    <div className="overflow-hidden rounded-xl border border-cpc-input-border bg-white">
      <div className="max-h-[680px] overflow-auto print:max-h-none print:overflow-visible">
        <div className="relative min-w-[720px] print:min-w-0">
          {/* Sticky day header */}
          <div className="sticky top-0 z-30 flex border-b border-cpc-input-border bg-cpc-section-light">
            <div className="sticky left-0 z-40 w-16 shrink-0 border-r border-cpc-input-border bg-cpc-section-light" />
            {DAY_CODES.map((day) => {
              const date = addDays(weekStart, DAY_INDEX[day] - 1);
              const isToday = today === day && isSameDate(date, now);
              return (
                <div
                  key={day}
                  className={cn(
                    "min-w-0 flex-1 border-r border-cpc-input-border px-1 py-2.5 text-center last:border-r-0",
                    isToday && "bg-cpc-blue-accent/5",
                  )}
                >
                  <p
                    className={cn(
                      "truncate font-poppins text-[11px] font-semibold",
                      isToday ? "text-cpc-blue-accent" : "text-cpc-heading-soft",
                    )}
                  >
                    {formatWeekdayDate(date)}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="flex">
            {/* Sticky time axis */}
            <div className="sticky left-0 z-20 w-16 shrink-0 border-r border-cpc-input-border bg-white">
              <div className="relative" style={{ height: totalHeight }}>
                {hours.map((hour) => {
                  const top = ((hour * 60 - DAY_START_MIN) / 60) * HOUR_HEIGHT;
                  // Center labels on their grid line, except the first/last so
                  // they stay inside the scroll box instead of being clipped.
                  const offset =
                    hour === 7
                      ? "translate-y-0"
                      : hour === 20
                        ? "-translate-y-full"
                        : "-translate-y-1/2";
                  return (
                    <span
                      key={hour}
                      className={cn(
                        "absolute right-1.5 font-poppins text-[10px] whitespace-nowrap text-cpc-heading-soft",
                        offset,
                      )}
                      style={{ top }}
                    >
                      {formatHourLabel(hour)}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Day columns */}
            <div className="flex flex-1">
              {DAY_CODES.map((day) => {
                const positioned = positionedByDay.get(day) ?? [];
                const date = addDays(weekStart, DAY_INDEX[day] - 1);
                const isToday = today === day && isSameDate(date, now);

                return (
                  <div
                    key={day}
                    className="relative min-w-0 flex-1 overflow-hidden border-r border-cpc-input-border last:border-r-0"
                  >
                    <div className="relative" style={{ height: totalHeight }}>
                      {hours.map((hour) => {
                        const top = ((hour * 60 - DAY_START_MIN) / 60) * HOUR_HEIGHT;
                        return (
                          <div
                            key={hour}
                            className="pointer-events-none absolute inset-x-0 border-t border-cpc-input-border/60"
                            style={{ top }}
                            aria-hidden
                          />
                        );
                      })}

                      {isToday && (
                        <div
                          className="pointer-events-none absolute inset-0 bg-cpc-blue-accent/[0.03]"
                          aria-hidden
                        />
                      )}

                      {positioned.length === 0 && (
                        <p className="absolute inset-x-0 top-6 text-center font-poppins text-[10px] text-cpc-muted-blue">
                          No classes
                        </p>
                      )}

                      {positioned.map((item) => {
                        const room =
                          roomSet === "A" ? item.entry.roomSetA : item.entry.roomSetB;
                        const dimmed =
                          (hoveredId !== null && hoveredId !== item.entry.id) ||
                          (activeColorKey !== null && activeColorKey !== item.entry.colorKey);

                        return (
                          <CalendarEventBlock
                            key={item.entry.id}
                            positioned={item}
                            room={room}
                            dimmed={dimmed}
                            highlighted={highlightedId === item.entry.id}
                            onOpen={onOpenEntry}
                            onHover={setHoveredId}
                          />
                        );
                      })}

                      {isToday && showNowLine && (
                        <div
                          className="pointer-events-none absolute inset-x-0 z-20"
                          style={{ top: nowTop }}
                          aria-hidden
                        >
                          <div className="relative h-0.5 w-full bg-rose-500">
                            <span className="absolute -top-1 -left-1 h-2 w-2 rounded-full bg-rose-500" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Weekly schedule card body: toolbar + desktop grid / mobile agenda. */
export function WeeklyCalendar({ schedule, onOpenEntry }: WeeklyCalendarProps) {
  const {
    roomSet,
    setRoomSet,
    weekOffset,
    setWeekOffset,
    goToThisWeek,
    activeColorKey,
    highlightedId,
  } = useSchedule();
  const now = useCurrentTime();
  const isDesktop = useIsDesktop();
  const [mobileView, setMobileView] = useState<"agenda" | "week">("agenda");

  const weekStart = useMemo(() => startOfWeek(now, weekOffset), [now, weekOffset]);
  const today = dayFromDate(now);
  const nowMinutes = minutesSinceMidnight(now);
  const showNowLine = nowMinutes >= DAY_START_MIN && nowMinutes <= DAY_END_MIN;
  const nowTop = ((nowMinutes - DAY_START_MIN) / 60) * HOUR_HEIGHT;

  return (
    <div id="weekly-calendar" className="scroll-mt-24">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 border-b border-cpc-input-border p-4 print:hidden lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Previous week"
              onClick={() => setWeekOffset(weekOffset - 1)}
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-cpc-input-border text-cpc-navy-text transition-colors hover:bg-cpc-section-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </button>
            <button
              type="button"
              onClick={goToThisWeek}
              className="cursor-pointer rounded-lg border border-cpc-input-border px-3 py-2 font-poppins text-xs font-semibold text-cpc-navy-text transition-colors hover:bg-cpc-section-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
            >
              Today
            </button>
            <button
              type="button"
              aria-label="Next week"
              onClick={() => setWeekOffset(weekOffset + 1)}
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-cpc-input-border text-cpc-navy-text transition-colors hover:bg-cpc-section-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
            >
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
          <p className="font-poppins text-sm font-semibold text-cpc-navy-text">
            {formatWeekRange(weekStart)}
          </p>
        </div>

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

          <button
            type="button"
            onClick={() =>
              setMobileView((current) => (current === "agenda" ? "week" : "agenda"))
            }
            className="cpc-btn cpc-btn-secondary cpc-btn-sm md:hidden"
          >
            {mobileView === "agenda" ? "Week view" : "Day view"}
          </button>
        </div>
      </div>

      <div className="p-3 sm:p-4">
        {isDesktop ? (
          <WeekGrid
            schedule={schedule}
            weekStart={weekStart}
            roomSet={roomSet}
            now={now}
            today={today}
            showNowLine={showNowLine}
            nowTop={nowTop}
            activeColorKey={activeColorKey}
            highlightedId={highlightedId}
            onOpenEntry={onOpenEntry}
          />
        ) : mobileView === "week" ? (
          <div className="overflow-x-auto">
            <WeekGrid
              schedule={schedule}
              weekStart={weekStart}
              roomSet={roomSet}
              now={now}
              today={today}
              showNowLine={showNowLine}
              nowTop={nowTop}
              activeColorKey={activeColorKey}
              highlightedId={highlightedId}
              onOpenEntry={onOpenEntry}
            />
          </div>
        ) : (
          <DayAgendaView
            entries={schedule.entries}
            weekStart={weekStart}
            today={today}
            roomSet={roomSet}
            onOpenEntry={onOpenEntry}
          />
        )}
      </div>
    </div>
  );
}
