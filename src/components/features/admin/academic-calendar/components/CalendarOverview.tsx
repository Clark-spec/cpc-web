import {
  CalendarDays,
  CalendarPlus,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  List,
  MapPin,
  Printer,
} from "lucide-react";
import { cn } from "@/lib/cn";
import {
  CATEGORY_META,
  addDays,
  eventsForDate,
  formatDateLong,
  formatMonthYear,
  formatTimeRange,
  getMonthGrid,
  getWeekGrid,
  isSameMonth,
  isToday,
  parseDateKey,
  sortEvents,
  startOfDay,
  toDateKey,
  type AdminCalendarEvent,
} from "../data/academicCalendar";
import { CalendarEmptyState, EventStatusDot, secondaryButtonClass } from "./CalendarPieces";

export type CalendarViewMode = "month" | "week" | "day" | "agenda";

const VIEW_OPTIONS: Array<{ id: CalendarViewMode; label: string; icon: typeof CalendarDays }> = [
  { id: "month", label: "Month", icon: CalendarDays },
  { id: "week", label: "Week", icon: CalendarRange },
  { id: "day", label: "Day", icon: Clock3 },
  { id: "agenda", label: "Agenda", icon: List },
];

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type CalendarOverviewProps = {
  events: AdminCalendarEvent[];
  filteredCount: number;
  view: CalendarViewMode;
  anchor: Date;
  onViewChange: (view: CalendarViewMode) => void;
  onNavigate: (direction: -1 | 1) => void;
  onToday: () => void;
  onDayClick: (dateKey: string) => void;
  onEventClick: (event: AdminCalendarEvent) => void;
  onShowMore: (date: Date) => void;
  onAddEvent: () => void;
  onExport: () => void;
  onPrint: () => void;
};

function viewTitle(view: CalendarViewMode, anchor: Date): string {
  if (view === "month") return formatMonthYear(anchor);
  if (view === "day") {
    return anchor.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }
  if (view === "week") {
    const days = getWeekGrid(anchor);
    const first = days[0];
    const last = days[6];
    if (first.getMonth() === last.getMonth()) {
      return `${first.toLocaleDateString("en-US", { month: "long" })} ${first.getDate()} – ${last.getDate()}, ${last.getFullYear()}`;
    }
    return `${first.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${last.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
  }
  return `Agenda · ${anchor.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} onward`;
}

function CalendarEventChip({
  event,
  onOpen,
  compact = true,
}: {
  event: AdminCalendarEvent;
  onOpen: (event: AdminCalendarEvent) => void;
  compact?: boolean;
}) {
  const meta = CATEGORY_META[event.category];
  const cancelled = event.status === "cancelled";

  return (
    <button
      type="button"
      onClick={(clickEvent) => {
        clickEvent.stopPropagation();
        onOpen(event);
      }}
      title={`${event.title} · ${meta.label} · ${formatTimeRange(event)}`}
      aria-label={`Open event ${event.title}. ${meta.label}. ${formatTimeRange(event)}.`}
      className={cn(
        "group flex w-full items-center gap-1 rounded-md border px-1 py-[3px] text-left font-poppins leading-none transition-colors hover:brightness-[0.97] focus-visible:outline-1 focus-visible:outline-offset-1 focus-visible:outline-cpc-blue-accent",
        meta.badgeClass,
        compact ? "text-[10px]" : "text-[11px]",
        cancelled && "opacity-60",
        event.status === "archived" && "opacity-55",
      )}
    >
      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", meta.dotClass)} aria-hidden />
      <span className={cn("min-w-0 flex-1 truncate font-semibold", cancelled && "line-through")}>
        {event.title}
      </span>
      {!event.allDay && event.startTime && (
        <span className="hidden shrink-0 text-[9px] font-medium opacity-75 xl:inline">
          {formatTimeRange(event).split(" – ")[0]}
        </span>
      )}
      <EventStatusDot status={event.status} />
    </button>
  );
}

function MonthView({
  events,
  anchor,
  onDayClick,
  onEventClick,
  onShowMore,
}: {
  events: AdminCalendarEvent[];
  anchor: Date;
  onDayClick: (dateKey: string) => void;
  onEventClick: (event: AdminCalendarEvent) => void;
  onShowMore: (date: Date) => void;
}) {
  const grid = getMonthGrid(anchor);
  const maxVisible = 2;

  return (
    <div className="admin-scrollbar overflow-x-auto">
      <div className="min-w-[660px]">
        <div className="grid grid-cols-7 border-b border-cpc-tile-border/60 bg-cpc-section-light">
          {WEEKDAY_LABELS.map((label) => (
            <div
              key={label}
              className="px-2 py-2 text-center font-poppins text-[10px] font-bold tracking-[0.1em] text-cpc-heading-soft uppercase"
            >
              {label}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {grid.map((date) => {
            const key = toDateKey(date);
            const inMonth = isSameMonth(date, anchor);
            const dayEvents = eventsForDate(events, date);
            const today = isToday(date);

            return (
              <div
                key={key}
                onClick={() => onDayClick(key)}
                className={cn(
                  "group relative min-h-[104px] cursor-pointer border-r border-b border-cpc-tile-border/60 p-1.5 transition-colors last:border-r-0 hover:bg-cpc-section-light/55",
                  !inMonth && "bg-cpc-section-light/35",
                )}
              >
                <div className="mb-1 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={(click) => {
                      click.stopPropagation();
                      onDayClick(key);
                    }}
                    aria-label={`Add event on ${formatDateLong(date)}`}
                    className={cn(
                      "flex h-6 min-w-6 items-center justify-center rounded-full px-1 font-poppins text-xs leading-none font-semibold transition-colors",
                      today
                        ? "bg-cpc-blue-accent text-white"
                        : inMonth
                          ? "text-cpc-navy-text hover:bg-cpc-section-light"
                          : "text-cpc-heading-soft/70 hover:bg-cpc-section-light",
                    )}
                  >
                    {date.getDate()}
                  </button>
                  {dayEvents.length > 0 && (
                    <span className="font-poppins text-[10px] font-semibold text-cpc-heading-soft">
                      {dayEvents.length}
                    </span>
                  )}
                </div>

                <div className="space-y-[3px]">
                  {dayEvents.slice(0, maxVisible).map((event) => (
                    <CalendarEventChip key={`${event.id}-${key}`} event={event} onOpen={onEventClick} />
                  ))}
                  {dayEvents.length > maxVisible && (
                    <button
                      type="button"
                      onClick={(click) => {
                        click.stopPropagation();
                        onShowMore(date);
                      }}
                      className="w-full rounded-md px-1 py-0.5 text-left font-poppins text-[10px] font-semibold text-cpc-blue-accent hover:bg-cpc-section-light"
                    >
                      +{dayEvents.length - maxVisible} more
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={(click) => {
                    click.stopPropagation();
                    onDayClick(key);
                  }}
                  aria-label={`Create event on ${formatDateLong(date)}`}
                  className="absolute right-1 bottom-1 hidden h-5 w-5 items-center justify-center rounded-md bg-cpc-section-light text-cpc-blue-accent transition-colors group-hover:flex hover:bg-cpc-blue-accent hover:text-white"
                >
                  <CalendarPlus className="h-3 w-3" aria-hidden />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function WeekView({
  events,
  anchor,
  onDayClick,
  onEventClick,
}: {
  events: AdminCalendarEvent[];
  anchor: Date;
  onDayClick: (dateKey: string) => void;
  onEventClick: (event: AdminCalendarEvent) => void;
}) {
  const days = getWeekGrid(anchor);

  return (
    <div className="admin-scrollbar overflow-x-auto">
      <div className="grid min-w-[720px] grid-cols-7">
        {days.map((date) => {
          const dayEvents = eventsForDate(events, date);
          const today = isToday(date);
          return (
            <div key={toDateKey(date)} className="min-h-[300px] border-r border-cpc-tile-border/60 last:border-r-0">
              <button
                type="button"
                onClick={() => onDayClick(toDateKey(date))}
                className={cn(
                  "flex w-full flex-col items-center gap-0.5 border-b border-cpc-tile-border/60 px-1 py-2 transition-colors hover:bg-cpc-section-light",
                  today && "bg-cpc-section-light/60",
                )}
              >
                <span className="font-poppins text-[10px] font-bold tracking-[0.1em] text-cpc-heading-soft uppercase">
                  {WEEKDAY_LABELS[date.getDay()]}
                </span>
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full font-poppins text-sm font-bold",
                    today ? "bg-cpc-blue-accent text-white" : "text-cpc-navy-text",
                  )}
                >
                  {date.getDate()}
                </span>
              </button>

              <div className="space-y-1 p-1.5">
                {dayEvents.map((event) => {
                  const meta = CATEGORY_META[event.category];
                  return (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => onEventClick(event)}
                      className={cn(
                        "w-full rounded-lg border border-l-[3px] p-1.5 text-left transition-all hover:-translate-y-px hover:shadow-sm focus-visible:outline-2 focus-visible:outline-cpc-blue-accent",
                        meta.borderClass,
                        meta.softClass,
                        event.status === "cancelled" && "opacity-60",
                      )}
                      style={{ borderLeftColor: meta.hex }}
                    >
                      <span className="flex items-center gap-1">
                        <span className={cn("h-1.5 w-1.5 rounded-full", meta.dotClass)} aria-hidden />
                        <span className="truncate font-poppins text-[10px] font-bold tracking-[0.03em] text-cpc-heading-soft uppercase">
                          {meta.shortLabel}
                        </span>
                        <EventStatusDot status={event.status} />
                      </span>
                      <span
                        className={cn(
                          "mt-0.5 block font-poppins text-[11px] leading-tight font-semibold text-cpc-navy-text",
                          event.status === "cancelled" && "line-through",
                        )}
                      >
                        {event.title}
                      </span>
                      <span className="mt-0.5 block font-poppins text-[10px] text-cpc-heading-soft">
                        {formatTimeRange(event)}
                      </span>
                    </button>
                  );
                })}

                {dayEvents.length === 0 && (
                  <button
                    type="button"
                    onClick={() => onDayClick(toDateKey(date))}
                    className="flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-cpc-tile-border py-3 font-poppins text-[11px] font-medium text-cpc-heading-soft transition-colors hover:border-cpc-blue-accent/40 hover:text-cpc-blue-accent"
                  >
                    <CalendarPlus className="h-3.5 w-3.5" aria-hidden />
                    Add event
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DayView({
  events,
  anchor,
  onDayClick,
  onEventClick,
}: {
  events: AdminCalendarEvent[];
  anchor: Date;
  onDayClick: (dateKey: string) => void;
  onEventClick: (event: AdminCalendarEvent) => void;
}) {
  const dayEvents = eventsForDate(events, anchor);

  return (
    <div className="p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-poppins text-sm font-semibold text-cpc-navy-text">{formatDateLong(anchor)}</p>
          <p className="mt-0.5 font-poppins text-[11px] text-cpc-heading-soft">
            {dayEvents.length} {dayEvents.length === 1 ? "event" : "events"} scheduled
          </p>
        </div>
        <button
          type="button"
          onClick={() => onDayClick(toDateKey(anchor))}
          className={secondaryButtonClass()}
        >
          <CalendarPlus className="h-3.5 w-3.5" aria-hidden />
          Add Event on This Date
        </button>
      </div>

      {dayEvents.length === 0 ? (
        <CalendarEmptyState
          title="No events on this date"
          description="Click a date or use Add Event to schedule an academic activity."
        />
      ) : (
        <ul className="space-y-1.5">
          {dayEvents.map((event) => {
            const meta = CATEGORY_META[event.category];
            return (
              <li key={event.id}>
                <button
                  type="button"
                  onClick={() => onEventClick(event)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-lg border border-l-[3px] p-2.5 text-left transition-all hover:-translate-y-px hover:shadow-sm focus-visible:outline-2 focus-visible:outline-cpc-blue-accent",
                    meta.borderClass,
                    meta.softClass,
                  )}
                  style={{ borderLeftColor: meta.hex }}
                >
                  <span className="w-[92px] shrink-0 font-poppins text-[11px] leading-snug font-semibold text-cpc-heading-soft">
                    {formatTimeRange(event)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={cn(
                          "font-poppins text-xs font-semibold text-cpc-navy-text",
                          event.status === "cancelled" && "line-through",
                        )}
                      >
                        {event.title}
                      </span>
                      <EventStatusDot status={event.status} />
                    </span>
                    <span className="mt-1 flex flex-wrap items-center gap-2 font-poppins text-[11px] text-cpc-heading-soft">
                      <span className={cn("inline-flex items-center gap-1 font-semibold", meta.textClass)}>
                        <meta.icon className="h-3 w-3" aria-hidden />
                        {meta.label}
                      </span>
                      {event.location && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" aria-hidden />
                          {event.location}
                        </span>
                      )}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function AgendaView({
  events,
  anchor,
  onEventClick,
}: {
  events: AdminCalendarEvent[];
  anchor: Date;
  onEventClick: (event: AdminCalendarEvent) => void;
}) {
  const from = startOfDay(anchor).getTime();
  const to = startOfDay(addDays(anchor, 60)).getTime();
  const upcoming = sortEvents(
    events.filter((event) => {
      const start = parseDateKey(event.startDate).getTime();
      const end = parseDateKey(event.endDate ?? event.startDate).getTime();
      return end >= from && start <= to;
    }),
  );

  if (upcoming.length === 0) {
    return (
      <CalendarEmptyState
        title="Nothing on the agenda"
        description="No events fall within the next 60 days for the selected academic period."
      />
    );
  }

  const groups = new Map<string, AdminCalendarEvent[]>();
  for (const event of upcoming) {
    const list = groups.get(event.startDate) ?? [];
    list.push(event);
    groups.set(event.startDate, list);
  }

  return (
    <div className="max-h-[520px] overflow-y-auto p-3 admin-scrollbar">
      <ol className="space-y-4">
        {Array.from(groups.entries()).map(([dateKey, group]) => {
          const date = new Date(`${dateKey}T00:00:00`);
          return (
            <li key={dateKey}>
              <div className="mb-1.5 flex items-center gap-2">
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-lg border",
                    isToday(date)
                      ? "border-cpc-blue-accent bg-cpc-blue-accent text-white"
                      : "border-cpc-tile-border bg-cpc-section-light text-cpc-navy-text",
                  )}
                >
                  <span className="font-poppins text-[9px] font-bold tracking-[0.04em] uppercase opacity-75">
                    {date.toLocaleDateString("en-US", { month: "short" })}
                  </span>
                  <span className="font-poppins text-xs leading-none font-bold">{date.getDate()}</span>
                </span>
                <div className="min-w-0">
                  <p className="font-poppins text-xs font-semibold text-cpc-navy-text">
                    {date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                  </p>
                  <p className="font-poppins text-[11px] text-cpc-heading-soft">
                    {group.length} {group.length === 1 ? "event" : "events"}
                  </p>
                </div>
              </div>
              <div className="space-y-1 pl-11">
                {group.map((event) => {
                  const meta = CATEGORY_META[event.category];
                  return (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => onEventClick(event)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-lg border border-l-[3px] px-2.5 py-1.5 text-left transition-all hover:-translate-y-px hover:shadow-sm focus-visible:outline-2 focus-visible:outline-cpc-blue-accent",
                        meta.borderClass,
                        meta.softClass,
                        event.status === "cancelled" && "opacity-60",
                      )}
                      style={{ borderLeftColor: meta.hex }}
                    >
                      <span className="w-[80px] shrink-0 font-poppins text-[10px] font-semibold text-cpc-heading-soft">
                        {formatTimeRange(event)}
                      </span>
                      <span
                        className={cn(
                          "min-w-0 flex-1 truncate font-poppins text-xs font-semibold text-cpc-navy-text",
                          event.status === "cancelled" && "line-through",
                        )}
                      >
                        {event.title}
                      </span>
                      <span className="hidden font-poppins text-[10px] font-semibold text-cpc-heading-soft sm:inline">
                        {meta.shortLabel}
                      </span>
                      <EventStatusDot status={event.status} />
                    </button>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/** Interactive month/week/day/agenda calendar. All data arrives pre-filtered. */
export function CalendarOverview({
  events,
  filteredCount,
  view,
  anchor,
  onViewChange,
  onNavigate,
  onToday,
  onDayClick,
  onEventClick,
  onShowMore,
  onAddEvent,
  onExport,
  onPrint,
}: CalendarOverviewProps) {
  return (
    <section
      id="calendar-overview"
      aria-labelledby="calendar-overview-heading"
      className="scroll-mt-24 overflow-hidden rounded-2xl border border-cpc-tile-border/70 bg-white shadow-[0_18px_50px_rgba(15,36,104,0.22)]"
    >
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-cpc-tile-border/60 px-4 py-3">
        <div className="min-w-0">
          <h2
            id="calendar-overview-heading"
            className="font-poppins text-sm leading-tight font-semibold text-cpc-navy-text"
          >
            Calendar Overview
          </h2>
          <p className="mt-0.5 font-poppins text-[11px] leading-snug text-cpc-heading-soft">
            {filteredCount} {filteredCount === 1 ? "event" : "events"} visible with the current
            academic period and category filters.
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Calendar view"
          className="inline-flex rounded-lg border border-cpc-tile-border bg-cpc-section-light p-0.5"
        >
          {VIEW_OPTIONS.map((option) => {
            const Icon = option.icon;
            const active = option.id === view;
            return (
              <button
                key={option.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onViewChange(option.id)}
                className={cn(
                  "inline-flex cursor-pointer items-center gap-1 rounded-md px-2.5 py-1.5 font-poppins text-[11px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-cpc-blue-accent",
                  active
                    ? "bg-white text-cpc-blue-accent shadow-sm"
                    : "text-cpc-heading-soft hover:text-cpc-navy-text",
                )}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden />
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cpc-tile-border/60 px-3 py-2.5">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onNavigate(-1)}
            aria-label={`Previous ${view}`}
            className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-cpc-tile-border bg-white text-cpc-navy-text transition-colors hover:bg-cpc-section-light focus-visible:outline-2 focus-visible:outline-cpc-blue-accent"
          >
            <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => onNavigate(1)}
            aria-label={`Next ${view}`}
            className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-cpc-tile-border bg-white text-cpc-navy-text transition-colors hover:bg-cpc-section-light focus-visible:outline-2 focus-visible:outline-cpc-blue-accent"
          >
            <ChevronRight className="h-3.5 w-3.5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={onToday}
            className="ml-1 inline-flex h-7 cursor-pointer items-center rounded-lg border border-cpc-tile-border bg-white px-2.5 font-poppins text-[11px] font-semibold text-cpc-navy-text transition-colors hover:bg-cpc-section-light focus-visible:outline-2 focus-visible:outline-cpc-blue-accent"
          >
            Today
          </button>
          <p className="ml-2 font-poppins text-sm font-semibold text-cpc-navy-text">
            {viewTitle(view, anchor)}
          </p>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onAddEvent}
            className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-cpc-blue-accent px-2.5 py-1.5 font-poppins text-[11px] font-semibold text-white transition-colors hover:bg-cpc-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
          >
            <CalendarPlus className="h-3.5 w-3.5" aria-hidden />
            Add Event
          </button>
          <button
            type="button"
            onClick={onExport}
            aria-label="Export calendar as CSV"
            title="Export calendar as CSV"
            className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-cpc-tile-border bg-white text-cpc-navy-text transition-colors hover:bg-cpc-section-light focus-visible:outline-2 focus-visible:outline-cpc-blue-accent"
          >
            <Download className="h-3.5 w-3.5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={onPrint}
            aria-label="Print calendar"
            title="Print calendar"
            className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-cpc-tile-border bg-white text-cpc-navy-text transition-colors hover:bg-cpc-section-light focus-visible:outline-2 focus-visible:outline-cpc-blue-accent"
          >
            <Printer className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>
      </div>

      {view === "month" && (
        <MonthView
          events={events.filter((event) => event.status !== "archived")}
          anchor={anchor}
          onDayClick={onDayClick}
          onEventClick={onEventClick}
          onShowMore={onShowMore}
        />
      )}
      {view === "week" && (
        <WeekView
          events={events.filter((event) => event.status !== "archived")}
          anchor={anchor}
          onDayClick={onDayClick}
          onEventClick={onEventClick}
        />
      )}
      {view === "day" && (
        <DayView
          events={events.filter((event) => event.status !== "archived")}
          anchor={anchor}
          onDayClick={onDayClick}
          onEventClick={onEventClick}
        />
      )}
      {view === "agenda" && (
        <AgendaView
          events={events.filter((event) => event.status !== "archived")}
          anchor={anchor}
          onEventClick={onEventClick}
        />
      )}

      {events.filter((event) => event.status !== "archived").length === 0 && (
        <div className="border-t border-cpc-tile-border/60 px-4 py-2.5 font-poppins text-[11px] text-cpc-heading-soft">
          Tip: relax the category, academic year, or semester filters to bring events back into the
          calendar.
        </div>
      )}
    </section>
  );
}