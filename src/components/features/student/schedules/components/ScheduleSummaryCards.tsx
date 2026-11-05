import { BookOpen, CalendarDays, Clock, GraduationCap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useCurrentTime } from "../hooks/useCurrentTime";
import { useSchedule } from "../hooks/useSchedule";
import type { ScheduleEntry, SectionSchedule } from "../types";
import {
  DAY_LABELS,
  addDays,
  dayFromDate,
  formatTime,
  minutesSinceMidnight,
} from "../utils/time";

type ScheduleSummaryCardsProps = {
  schedule: SectionSchedule;
};

type NextClass = {
  entry: ScheduleEntry;
  when: string;
};

function findNextClass(entries: ScheduleEntry[], now: Date): NextClass | null {
  const today = dayFromDate(now);
  const nowMinutes = minutesSinceMidnight(now);

  if (today) {
    const laterToday = entries
      .filter((entry) => entry.days.includes(today) && entry.startMin > nowMinutes)
      .sort((a, b) => a.startMin - b.startMin);
    if (laterToday[0]) return { entry: laterToday[0], when: "Today" };
  }

  // Look ahead up to a week; Sunday is skipped because there are no classes.
  for (let offset = 1; offset <= 7; offset += 1) {
    const day = dayFromDate(addDays(now, offset));
    if (!day) continue;
    const candidates = entries
      .filter((entry) => entry.days.includes(day))
      .sort((a, b) => a.startMin - b.startMin);
    if (candidates[0]) {
      return {
        entry: candidates[0],
        when: offset === 1 ? "Tomorrow" : DAY_LABELS[day],
      };
    }
  }

  return null;
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  hint,
  compact = false,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint: string;
  compact?: boolean;
}) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-cpc-input-border bg-white p-4 shadow-[0_6px_18px_rgba(27,47,158,0.05)]">
      <div className="flex items-start justify-between gap-2">
        <p className="font-poppins text-[10px] font-semibold tracking-[0.12em] text-cpc-heading-soft uppercase">
          {label}
        </p>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cpc-section-light text-cpc-blue-accent">
          <Icon className="h-4 w-4" aria-hidden />
        </span>
      </div>
      <p
        className={
          compact
            ? "mt-2 font-poppins text-sm leading-snug font-bold text-cpc-navy-text"
            : "mt-2 font-poppins text-xl leading-tight font-bold text-cpc-navy-text"
        }
      >
        {value}
      </p>
      <p className="mt-1 font-poppins text-[11px] leading-snug text-cpc-heading-soft">{hint}</p>
    </div>
  );
}

/** Four computed cards above the subject table. */
export function ScheduleSummaryCards({ schedule }: ScheduleSummaryCardsProps) {
  const now = useCurrentTime();
  const { roomSet } = useSchedule();

  const entries = schedule.entries;
  const totalUnits = entries.reduce((sum, entry) => sum + entry.units, 0);
  const classDays = new Set(entries.flatMap((entry) => entry.days)).size;
  const nextClass = findNextClass(
    entries.filter((entry) => entry.status === "active"),
    now,
  );

  const nextRoom = nextClass
    ? roomSet === "A"
      ? nextClass.entry.roomSetA
      : nextClass.entry.roomSetB
    : null;

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <SummaryCard
        icon={BookOpen}
        label="Total Subjects"
        value={String(entries.length)}
        hint="Subjects in this section"
      />
      <SummaryCard
        icon={GraduationCap}
        label="Total Units"
        value={String(totalUnits)}
        hint="Sum of all subject units"
      />
      <SummaryCard
        icon={CalendarDays}
        label="Class Days"
        value={String(classDays)}
        hint="Meeting days per week"
      />
      <SummaryCard
        icon={Clock}
        label="Next Class"
        compact
        value={
          nextClass
            ? `${nextClass.entry.subjectCode} · ${nextClass.when} ${formatTime(nextClass.entry.startMin)} · ${nextRoom}`
            : "No upcoming class"
        }
        hint={nextClass ? `Room set ${roomSet}` : "Enjoy the break"}
      />
    </div>
  );
}
