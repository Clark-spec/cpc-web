import {
  CalendarDays,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Info,
  LayoutGrid,
  List as ListIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { ACADEMIC_YEAR, type AcademicEvent } from "@/components/features/student/academic-calendar/academicCalendar";
import type { CalendarView } from "@/components/features/student/academic-calendar/useAcademicCalendar";
import { CalendarGridSkeleton } from "@/components/features/student/academic-calendar/CalendarSkeletons";
import { ListView } from "@/components/features/student/academic-calendar/ListView";
import { MonthView } from "@/components/features/student/academic-calendar/MonthView";
import { WeekView } from "@/components/features/student/academic-calendar/WeekView";

const VIEW_OPTIONS = [
  { value: "month", label: "Month", icon: LayoutGrid },
  { value: "week", label: "Week", icon: CalendarRange },
  { value: "list", label: "List", icon: ListIcon },
] as const;

type CalendarCardProps = {
  view: CalendarView;
  onChangeView: (view: CalendarView) => void;
  title: string;
  monthDate: Date;
  weekDays: Date[];
  events: AcademicEvent[];
  monthEvents: AcademicEvent[];
  loading: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
  onOpenEvent: (event: AcademicEvent) => void;
  onOpenDay: (date: Date) => void;
};

export function CalendarCard({
  view,
  onChangeView,
  title,
  monthDate,
  weekDays,
  events,
  monthEvents,
  loading,
  onPrevious,
  onNext,
  onToday,
  onOpenEvent,
  onOpenDay,
}: CalendarCardProps) {
  return (
    <section className="ac-card overflow-hidden" aria-labelledby="ac-calendar-heading">
      <div className="flex flex-col gap-3 border-b border-cpc-input-border px-4 py-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cpc-section-light text-cpc-blue-accent">
              <CalendarDays className="h-4 w-4" aria-hidden />
            </span>
            <div className="min-w-0">
              <h2
                id="ac-calendar-heading"
                className="font-poppins text-base leading-tight font-bold text-cpc-navy-text"
              >
                Academic Calendar
              </h2>
              <p className="mt-0.5 font-poppins text-[11px] text-cpc-heading-soft">
                A.Y. {ACADEMIC_YEAR} · Office of the Registrar
              </p>
            </div>
          </div>

          <div
            role="group"
            aria-label="Calendar view"
            className="flex items-center gap-1 rounded-lg border border-cpc-input-border bg-white p-1"
          >
            {VIEW_OPTIONS.map((option) => {
              const Icon = option.icon;
              const active = view === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onChangeView(option.value)}
                  className={cn(
                    "flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 font-poppins text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent",
                    active
                      ? "bg-cpc-blue-accent text-white"
                      : "text-cpc-heading-soft hover:bg-cpc-section-light hover:text-cpc-navy-text",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onPrevious}
              aria-label={view === "week" ? "Previous week" : "Previous month"}
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-cpc-input-border text-cpc-navy-text transition-colors hover:bg-cpc-section-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </button>
            <h3 className="min-w-[142px] px-1 text-center font-poppins text-sm font-semibold text-cpc-navy-text sm:min-w-[168px]">
              {title}
            </h3>
            <button
              type="button"
              onClick={onNext}
              aria-label={view === "week" ? "Next week" : "Next month"}
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-cpc-input-border text-cpc-navy-text transition-colors hover:bg-cpc-section-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
            >
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          </div>

          <button
            type="button"
            onClick={onToday}
            className="cursor-pointer rounded-lg border border-cpc-input-border px-3 py-2 font-poppins text-xs font-semibold text-cpc-navy-text transition-colors hover:bg-cpc-section-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
          >
            Today
          </button>
        </div>
      </div>

      <div className="p-3 sm:p-4" aria-busy={loading}>
        {loading ? (
          <CalendarGridSkeleton />
        ) : view === "month" ? (
          <MonthView
            monthDate={monthDate}
            events={monthEvents}
            onOpenEvent={onOpenEvent}
            onOpenDay={onOpenDay}
          />
        ) : view === "week" ? (
          <WeekView
            days={weekDays}
            events={events}
            onOpenEvent={onOpenEvent}
            onOpenDay={onOpenDay}
          />
        ) : (
          <ListView
            events={monthEvents}
            monthDate={monthDate}
            onOpenEvent={onOpenEvent}
          />
        )}

        <p className="mt-3 flex items-center justify-center gap-1.5 font-poppins text-[11px] text-cpc-heading-soft">
          <Info className="h-3.5 w-3.5 shrink-0" aria-hidden />
          Select a date or event to view its details.
        </p>
      </div>
    </section>
  );
}
