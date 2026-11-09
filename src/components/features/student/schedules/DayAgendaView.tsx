import { useMemo, useState } from "react";
import { CalendarX2 } from "lucide-react";
import { cn } from "@/lib/cn";
import type { DayCode, RoomSet, ScheduleEntry } from "@/types/schedule";
import { getSubjectColor } from "@/lib/scheduleColors";
import {
  DAY_CODES,
  DAY_FULL,
  DAY_INDEX,
  DAY_LABELS,
  addDays,
  daysToLabel,
  formatLongDate,
  formatTimeRange,
} from "@/lib/scheduleTime";
import { StatusBadge } from "@/components/features/student/schedules/Badge";

type DayAgendaViewProps = {
  entries: ScheduleEntry[];
  weekStart: Date;
  today: DayCode | null;
  roomSet: RoomSet;
  onOpenEntry: (entry: ScheduleEntry) => void;
};

/** Mobile layout: day tabs + a vertical list of that day's classes. */
export function DayAgendaView({
  entries,
  weekStart,
  today,
  roomSet,
  onOpenEntry,
}: DayAgendaViewProps) {
  const [selectedDay, setSelectedDay] = useState<DayCode>(() => today ?? "MON");

  const dayEntries = useMemo(
    () =>
      entries
        .filter((entry) => entry.days.includes(selectedDay))
        .sort((a, b) => a.startMin - b.startMin || a.endMin - b.endMin),
    [entries, selectedDay],
  );

  const selectedDate = addDays(weekStart, DAY_INDEX[selectedDay] - 1);

  return (
    <div>
      <div
        role="tablist"
        aria-label="Choose a class day"
        className="flex gap-1.5 overflow-x-auto pb-2"
      >
        {DAY_CODES.map((day) => {
          const date = addDays(weekStart, DAY_INDEX[day] - 1);
          const selected = selectedDay === day;
          return (
            <button
              key={day}
              type="button"
              role="tab"
              id={`agenda-tab-${day}`}
              aria-selected={selected}
              aria-controls={`agenda-panel-${day}`}
              onClick={() => setSelectedDay(day)}
              className={cn(
                "flex min-w-[58px] shrink-0 cursor-pointer flex-col items-center rounded-xl border px-3 py-2 font-poppins transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent",
                selected
                  ? "border-cpc-blue-accent bg-cpc-blue-accent text-white"
                  : "border-cpc-input-border bg-white text-cpc-navy-text hover:bg-cpc-section-light",
              )}
            >
              <span className="text-[10px] font-semibold tracking-[0.08em] uppercase">
                {DAY_LABELS[day]}
              </span>
              <span className={cn("text-base font-bold", today === day && !selected && "text-cpc-blue-accent")}>
                {date.getDate()}
              </span>
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`agenda-panel-${selectedDay}`}
        aria-labelledby={`agenda-tab-${selectedDay}`}
        className="mt-3 space-y-3"
      >
        <p className="font-poppins text-xs text-cpc-heading-soft">
          {formatLongDate(selectedDate)} · {dayEntries.length}{" "}
          {dayEntries.length === 1 ? "class" : "classes"}
        </p>

        {dayEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-cpc-tile-border bg-white px-4 py-10 text-center">
            <CalendarX2 className="h-8 w-8 text-cpc-muted-blue" aria-hidden />
            <p className="mt-2 font-poppins text-sm font-semibold text-cpc-navy-text">
              No classes on {DAY_FULL[selectedDay]}
            </p>
            <p className="mt-1 font-poppins text-xs text-cpc-heading-soft">
              Pick another day to see its schedule.
            </p>
          </div>
        ) : (
          dayEntries.map((entry) => {
            const color = getSubjectColor(entry.colorKey);
            const room = roomSet === "A" ? entry.roomSetA : entry.roomSetB;
            return (
              <button
                key={entry.id}
                type="button"
                onClick={() => onOpenEntry(entry)}
                className={cn(
                  "w-full cursor-pointer rounded-xl border border-l-4 bg-white p-4 text-left shadow-[0_6px_18px_rgba(27,47,158,0.05)] transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent motion-reduce:transition-none",
                  entry.status === "not_active"
                    ? "border-cpc-input-border border-dashed"
                    : "border-cpc-input-border",
                  color.accent,
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 font-poppins text-sm font-bold text-cpc-navy-text">
                      <span className={cn("h-2 w-2 shrink-0 rounded-full", color.dot)} aria-hidden />
                      {entry.subjectCode}
                    </p>
                    <p className="mt-0.5 font-poppins text-xs leading-snug text-cpc-heading-soft">
                      {entry.title}
                    </p>
                  </div>
                  <StatusBadge status={entry.status} />
                </div>

                <p className="mt-3 font-poppins text-sm font-semibold text-cpc-blue-accent">
                  {formatTimeRange(entry.startMin, entry.endMin)}
                </p>

                <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2">
                  <div>
                    <dt className="font-poppins text-[10px] font-semibold tracking-[0.1em] text-cpc-heading-soft uppercase">
                      Room
                    </dt>
                    <dd className="font-poppins text-xs text-cpc-navy-text">{room}</dd>
                  </div>
                  <div>
                    <dt className="font-poppins text-[10px] font-semibold tracking-[0.1em] text-cpc-heading-soft uppercase">
                      Days
                    </dt>
                    <dd className="font-poppins text-xs text-cpc-navy-text">
                      {daysToLabel(entry.days)}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-poppins text-[10px] font-semibold tracking-[0.1em] text-cpc-heading-soft uppercase">
                      Instructor
                    </dt>
                    <dd className="font-poppins text-xs text-cpc-navy-text">{entry.instructor}</dd>
                  </div>
                  <div>
                    <dt className="font-poppins text-[10px] font-semibold tracking-[0.1em] text-cpc-heading-soft uppercase">
                      Units
                    </dt>
                    <dd className="font-poppins text-xs text-cpc-navy-text">{entry.units}</dd>
                  </div>
                </dl>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
