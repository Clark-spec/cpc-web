import { useMemo, useState, type ReactNode } from "react";
import { CalendarPlus, CalendarRange } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { PageBanner } from "@/components/common/display/PageBanner";
import { ConfirmDialog } from "@/components/common/feedback/ConfirmDialog";
import { AcademicPeriodBar } from "./AcademicPeriodBar";
import { CalendarStatCards } from "./CalendarStatCards";
import { CalendarQuickActions } from "./CalendarQuickActions";
import {
  CalendarOverview,
  type CalendarViewMode,
} from "./CalendarOverview";
import { UpcomingEventsCard } from "./UpcomingEventsCard";
import { DeadlinesCard } from "./DeadlinesCard";
import { EventManagementTable } from "./EventManagementTable";
import { CategoryLegendCard } from "./CategoryLegendCard";
import { PublicationMonitor } from "./PublicationMonitor";
import { RecentActivitiesCard } from "./RecentActivitiesCard";
import { EventFormModal, type SaveMode } from "./EventFormModal";
import {
  EventDetailsModal,
  type EventDetailAction,
} from "./EventDetailsModal";
import { DayEventsModal } from "./DayEventsModal";
import { downloadEventsCsv, printEvents } from "./calendarExport";
import { primaryButtonClass } from "./CalendarPieces";
import {
  CATEGORY_META,
  SAMPLE_EVENTS,
  STATUS_META,
  addDays,
  addMonths,
  eventDateRange,
  eventsForDate,
  formatDateShort,
  getCalendarRange,
  getCalendarStats,
  getCategoryCounts,
  getStatusCounts,
  parseDateKey,
  startOfDay,
  type AcademicYear,
  type AdminCalendarEvent,
  type CalendarActivity,
  type CalendarActivityAction,
  type EventCategory,
  type Semester,
} from "../data/academicCalendar";

type FormState = {
  editing: AdminCalendarEvent | null;
  initialDate?: string;
  nonce: number;
};

type PendingConfirm =
  | { kind: "delete"; event: AdminCalendarEvent }
  | { kind: "cancel"; event: AdminCalendarEvent }
  | { kind: "publish-all"; count: number };

const DEFAULT_YEAR: AcademicYear = "2026–2027";
const DEFAULT_SEMESTER: Semester = "2nd Semester";

function scrollToSection(id: string) {
  const target = document.getElementById(id);
  if (!target) return;
  target.scrollIntoView({
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    block: "start",
  });
}

/**
 * Admin Academic Calendar dashboard. Frontend only: one local event array feeds
 * the statistics, calendar, deadline monitor, publication queue, management
 * table, and activity log; every action mutates that shared state.
 */
export default function AcademicCalendarPage() {
  const { toast } = useToast();

  const [events, setEvents] = useState<AdminCalendarEvent[]>(() => SAMPLE_EVENTS);
  const [activities, setActivities] = useState<CalendarActivity[]>([]);
  const [year, setYear] = useState<AcademicYear>(DEFAULT_YEAR);
  const [semester, setSemester] = useState<Semester | "All Semesters">(DEFAULT_SEMESTER);
  const [view, setView] = useState<CalendarViewMode>("month");
  const [anchor, setAnchor] = useState<Date>(() => startOfDay(new Date()));
  const [hiddenCategories, setHiddenCategories] = useState<EventCategory[]>([]);
  const [form, setForm] = useState<FormState | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [dayOpen, setDayOpen] = useState<Date | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null);

  const periodEvents = useMemo(
    () =>
      events.filter(
        (event) =>
          event.academicYear === year &&
          (semester === "All Semesters" || event.semester === semester),
      ),
    [events, year, semester],
  );

  const visibleEvents = useMemo(
    () => periodEvents.filter((event) => !hiddenCategories.includes(event.category)),
    [periodEvents, hiddenCategories],
  );

  const stats = useMemo(() => getCalendarStats(periodEvents), [periodEvents]);
  const statusCounts = useMemo(() => getStatusCounts(periodEvents), [periodEvents]);
  const categoryCounts = useMemo(() => getCategoryCounts(periodEvents), [periodEvents]);
  const range = useMemo(() => getCalendarRange(periodEvents), [periodEvents]);

  const viewing = viewingId ? (events.find((event) => event.id === viewingId) ?? null) : null;
  const dayEvents = dayOpen ? eventsForDate(visibleEvents, dayOpen) : [];
  const draftCount = periodEvents.filter((event) => event.status === "draft").length;

  const logActivity = (
    action: CalendarActivityAction,
    event: AdminCalendarEvent,
    detail: string,
    status?: AdminCalendarEvent["status"],
  ) => {
    setActivities((current) =>
      [
        {
          id: crypto.randomUUID(),
          action,
          eventTitle: event.title,
          detail,
          at: new Date().toISOString(),
          status,
        },
        ...current,
      ].slice(0, 30),
    );
  };

  const openCreate = (initialDate?: string) => {
    setViewingId(null);
    setForm({ editing: null, initialDate, nonce: Date.now() });
  };

  const openEdit = (event: AdminCalendarEvent) => {
    setViewingId(null);
    setDayOpen(null);
    setForm({ editing: event, nonce: Date.now() });
  };

  const handleSave = (event: AdminCalendarEvent, mode: SaveMode) => {
    const existing = events.find((entry) => entry.id === event.id);

    setEvents((current) =>
      existing
        ? current.map((entry) => (entry.id === event.id ? event : entry))
        : [...current, event],
    );

    if (existing) {
      if (existing.startDate !== event.startDate) {
        logActivity(
          "moved",
          event,
          `Moved from ${formatDateShort(parseDateKey(existing.startDate))} to ${formatDateShort(
            parseDateKey(event.startDate),
          )}`,
          event.status,
        );
      } else {
        logActivity(
          "updated",
          event,
          `Saved as ${STATUS_META[event.status].label.toLowerCase()}`,
          event.status,
        );
      }
    } else {
      logActivity(
        "created",
        event,
        `${CATEGORY_META[event.category].label} · ${eventDateRange(event)}`,
        event.status,
      );
    }

    setForm(null);
    toast(
      existing
        ? `"${event.title}" updated.`
        : `"${event.title}" added to the academic calendar${mode === "draft" ? " as a draft" : ""}.`,
      "success",
    );

    if (existing && existing.status !== event.status && event.status === "published") {
      logActivity("published", event, "Marked visible to students", "published");
    }
  };

  const applyStatus = (
    event: AdminCalendarEvent,
    status: AdminCalendarEvent["status"],
    action: CalendarActivityAction,
    detail: string,
  ) => {
    setEvents((current) =>
      current.map((entry) =>
        entry.id === event.id ? { ...entry, status, updatedAt: new Date().toISOString() } : entry,
      ),
    );
    logActivity(action, event, detail, status);
  };

  const publishEvent = (event: AdminCalendarEvent) => {
    if (event.status === "published") return;
    applyStatus(event, "published", "published", "Marked visible to students");
    toast(`"${event.title}" is now published.`, "success");
  };

  const unpublishEvent = (event: AdminCalendarEvent) => {
    if (event.status !== "published") return;
    applyStatus(event, "draft", "unpublished", "Returned to draft");
    toast(`"${event.title}" moved back to draft.`, "info");
  };

  const archiveEvent = (event: AdminCalendarEvent) => {
    if (event.status === "archived") {
      applyStatus(event, "draft", "restored", "Restored from archive as a draft");
      toast(`"${event.title}" restored as a draft.`, "success");
      return;
    }
    applyStatus(event, "archived", "archived", "Removed from the active calendar");
    toast(`"${event.title}" archived.`, "info");
  };

  const handleTogglePublish = (event: AdminCalendarEvent) => {
    if (event.status === "published") unpublishEvent(event);
    else publishEvent(event);
  };

  const handleDetailAction = (action: EventDetailAction, event: AdminCalendarEvent) => {
    switch (action) {
      case "publish":
        publishEvent(event);
        break;
      case "unpublish":
        unpublishEvent(event);
        break;
      case "archive":
        archiveEvent(event);
        break;
      case "restore":
        applyStatus(event, "draft", "restored", "Restored as a draft");
        toast(`"${event.title}" restored as a draft.`, "success");
        break;
      case "cancel":
        setPendingConfirm({ kind: "cancel", event });
        break;
      case "delete":
        setPendingConfirm({ kind: "delete", event });
        break;
    }
  };

  const handleDayClick = (dateKey: string) => {
    const date = parseDateKey(dateKey);
    const existing = eventsForDate(visibleEvents, date);
    if (existing.length > 0) {
      setDayOpen(date);
      return;
    }
    openCreate(dateKey);
  };

  const navigate = (direction: -1 | 1) => {
    setAnchor((current) => {
      if (view === "month") return addMonths(current, direction);
      if (view === "week") return addDays(current, direction * 7);
      if (view === "day") return addDays(current, direction);
      return addDays(current, direction * 30);
    });
  };

  const toggleCategory = (category: EventCategory) => {
    setHiddenCategories((current) =>
      current.includes(category)
        ? current.filter((entry) => entry !== category)
        : [...current, category],
    );
  };

  const resetPeriod = () => {
    setYear(DEFAULT_YEAR);
    setSemester(DEFAULT_SEMESTER);
    setHiddenCategories([]);
    setAnchor(startOfDay(new Date()));
  };

  const handleExportCalendar = () => {
    if (visibleEvents.length === 0) {
      toast("No events match the current calendar filters.", "warning");
      return;
    }
    downloadEventsCsv(
      visibleEvents,
      `academic-calendar-${year}-${semester === "All Semesters" ? "all-semesters" : semester}`,
    );
    toast(`Exported ${visibleEvents.length} calendar events as CSV.`, "success");
  };

  const handlePrintCalendar = () => {
    printEvents(
      visibleEvents,
      `Academic Calendar · A.Y. ${year}`,
      `${semester} · ${range}`,
    );
  };

  const handleExportList = (list: AdminCalendarEvent[]) => {
    if (list.length === 0) {
      toast("No events match the table filters to export.", "warning");
      return;
    }
    downloadEventsCsv(list, "academic-events-list");
    toast(`Exported ${list.length} events from the management table.`, "success");
  };

  const handlePrintList = (list: AdminCalendarEvent[]) => {
    if (list.length === 0) {
      toast("No events match the table filters to print.", "warning");
      return;
    }
    printEvents(
      list,
      "Academic Events List",
      "All matching records from the event management table, including drafts and archived events.",
    );
  };

  const handlePublishCalendar = () => {
    const drafts = periodEvents.filter((event) => event.status === "draft");
    if (drafts.length === 0) {
      toast("There are no draft events to publish in this academic period.", "info");
      return;
    }
    setPendingConfirm({ kind: "publish-all", count: drafts.length });
  };

  const confirmPending = () => {
    if (!pendingConfirm) return;

    if (pendingConfirm.kind === "delete") {
      const event = pendingConfirm.event;
      setEvents((current) => current.filter((entry) => entry.id !== event.id));
      setViewingId((current) => (current === event.id ? null : current));
      logActivity("deleted", event, "Removed from the calendar", undefined);
      toast(`"${event.title}" deleted.`, "info");
    }

    if (pendingConfirm.kind === "cancel") {
      const event = pendingConfirm.event;
      applyStatus(event, "cancelled", "cancelled", "Event will not take place");
      toast(`"${event.title}" marked as cancelled.`, "warning");
    }

    if (pendingConfirm.kind === "publish-all") {
      const drafts = periodEvents.filter((event) => event.status === "draft");
      setEvents((current) =>
        current.map((entry) =>
          drafts.some((draft) => draft.id === entry.id)
            ? { ...entry, status: "published", updatedAt: new Date().toISOString() }
            : entry,
        ),
      );
      drafts.forEach((event) =>
        logActivity("published", event, "Published from the bulk publish action", "published"),
      );
      toast(`${drafts.length} draft event${drafts.length === 1 ? "" : "s"} published.`, "success");
    }

    setPendingConfirm(null);
  };

  const confirmCopy = (() => {
    if (!pendingConfirm) {
      return { title: "", description: null as ReactNode, confirmLabel: "Confirm", danger: false };
    }
    if (pendingConfirm.kind === "delete") {
      return {
        title: "Delete this calendar event?",
        description: (
          <>
            <span className="font-semibold text-cpc-navy-text">{pendingConfirm.event.title}</span> will
            be removed from the demo calendar. Statistics, deadlines, and publication counts update
            immediately. This cannot be undone in this session.
          </>
        ),
        confirmLabel: "Delete Event",
        danger: true,
      };
    }
    if (pendingConfirm.kind === "cancel") {
      return {
        title: "Mark this event as cancelled?",
        description: (
          <>
            <span className="font-semibold text-cpc-navy-text">{pendingConfirm.event.title}</span> will
            stay in the calendar with a cancelled status so students and staff can see it will not
            take place. You can restore it later.
          </>
        ),
        confirmLabel: "Cancel Event",
        danger: true,
      };
    }
    return {
      title: "Publish the calendar?",
      description: (
        <>
          {pendingConfirm.count} draft event{pendingConfirm.count === 1 ? "" : "s"} in A.Y. {year} ·{" "}
          {semester} will be marked as published for the student calendar preview. Pending-review
          events are not changed.
        </>
      ),
      confirmLabel: "Publish Drafts",
      danger: false,
    };
  })();

  return (
    <div className="relative space-y-6">
      {/* Ambient background glows — decorative only */}
      <div aria-hidden className="pointer-events-none absolute -top-16 -left-16 h-72 w-72 rounded-full bg-cpc-blue-accent/5 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute top-1/4 -right-16 h-64 w-64 rounded-full bg-purple-500/4 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute bottom-20 left-1/3 h-56 w-56 rounded-full bg-emerald-500/4 blur-3xl" />

      <PageBanner
        title="Academic Calendar"
        subtitle="Create, edit, publish, and manage school events and important dates."
        right={
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-cpc-tile-border bg-white/85 px-3 py-1.5 font-poppins text-[10px] font-bold tracking-[0.04em] text-cpc-blue-accent uppercase">
              <CalendarRange className="h-3.5 w-3.5 text-cpc-blue-accent" aria-hidden />
              A.Y. {year} · {semester}
            </span>
            <button type="button" onClick={() => openCreate()} className={primaryButtonClass()}>
              <CalendarPlus className="h-3.5 w-3.5" aria-hidden />
              Add Event
            </button>
          </div>
        }
      />

      <AcademicPeriodBar
        year={year}
        semester={semester}
        range={range}
        eventCount={periodEvents.length}
        onYearChange={setYear}
        onSemesterChange={setSemester}
        onReset={resetPeriod}
      />

      <section aria-labelledby="calendar-statistics-heading" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 px-0.5">
          <div>
            <h2
              id="calendar-statistics-heading"
              className="font-poppins text-sm font-bold tracking-tight text-cpc-navy-text"
            >
              Academic Calendar Statistics
            </h2>
            <p className="mt-0.5 font-poppins text-[11px] leading-snug text-cpc-heading-soft">
              Live counts from the shared event dataset for A.Y. {year} · {semester}, updated after
              every change.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/70 px-2.5 py-1 font-poppins text-[10.5px] font-semibold text-cpc-heading-soft shadow-2xs backdrop-blur-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
            Live sync active
          </span>
        </div>
        <CalendarStatCards stats={stats} />
      </section>

      <CalendarQuickActions
        draftCount={draftCount}
        onAddEvent={() => openCreate()}
        onEditEvent={() => {
          scrollToSection("academic-event-management");
          window.setTimeout(() => document.getElementById("event-search")?.focus(), 350);
          toast("Pick an event from the management table to edit.", "info");
        }}
        onViewAllEvents={() => {
          scrollToSection("academic-event-management");
          window.setTimeout(() => document.getElementById("event-search")?.focus(), 350);
        }}
        onManageCategories={() => scrollToSection("calendar-legend")}
        onPublishCalendar={handlePublishCalendar}
        onExport={handleExportCalendar}
        onPrint={handlePrintCalendar}
      />

      {/* Calendar Overview — full width */}
      <CalendarOverview
        events={visibleEvents}
        filteredCount={visibleEvents.length}
        view={view}
        anchor={anchor}
        onViewChange={setView}
        onNavigate={navigate}
        onToday={() => setAnchor(startOfDay(new Date()))}
        onDayClick={handleDayClick}
        onEventClick={(event) => setViewingId(event.id)}
        onShowMore={(date) => setDayOpen(date)}
        onAddEvent={() => openCreate()}
        onExport={handleExportCalendar}
        onPrint={handlePrintCalendar}
      />

      {/* Upcoming Events + Deadlines — below the calendar in a 2-column layout */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-2">
        <UpcomingEventsCard
          events={periodEvents}
          onSelect={(event) => setViewingId(event.id)}
          onViewAll={() => {
            scrollToSection("academic-event-management");
            window.setTimeout(() => document.getElementById("event-search")?.focus(), 350);
          }}
          onAddEvent={() => openCreate()}
        />
        <DeadlinesCard
          events={periodEvents}
          onSelect={(event) => setViewingId(event.id)}
          onViewAll={() => {
            scrollToSection("academic-event-management");
            window.setTimeout(() => document.getElementById("event-search")?.focus(), 350);
          }}
        />
      </div>

      <EventManagementTable
        events={events}
        onAdd={() => openCreate()}
        onView={(event) => setViewingId(event.id)}
        onEdit={openEdit}
        onTogglePublish={handleTogglePublish}
        onArchive={archiveEvent}
        onDelete={(event) => setPendingConfirm({ kind: "delete", event })}
        onExport={handleExportList}
        onPrint={handlePrintList}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <CategoryLegendCard
          counts={categoryCounts}
          hidden={hiddenCategories}
          onToggle={toggleCategory}
          onShowAll={() => setHiddenCategories([])}
        />
        <PublicationMonitor
          statusCounts={statusCounts}
          events={periodEvents}
          onPublish={publishEvent}
          onView={(event) => setViewingId(event.id)}
          onViewAllPending={() => {
            scrollToSection("academic-event-management");
            window.setTimeout(() => document.getElementById("event-search")?.focus(), 350);
            toast("Use the status filter to review pending events.", "info");
          }}
        />
      </div>

      <RecentActivitiesCard activities={activities} onClear={() => setActivities([])} />

      <p className="px-1 pb-1 font-poppins text-[11px] leading-snug text-cpc-heading-soft">
        Frontend preview for A.Y. {year} · {semester}. All {events.length} records are illustrative
        sample data. Changes stay in this browser session and are never written to a server,
        database, or API. Publication status only affects this demo calendar.
      </p>

      {form && (
        <EventFormModal
          key={form.nonce}
          editing={form.editing}
          initialDate={form.initialDate}
          initialYear={year}
          initialSemester={semester === "All Semesters" ? DEFAULT_SEMESTER : semester}
          onClose={() => setForm(null)}
          onSave={handleSave}
        />
      )}

      {viewing && (
        <EventDetailsModal
          key={viewing.id}
          event={viewing}
          onClose={() => setViewingId(null)}
          onEdit={openEdit}
          onAction={handleDetailAction}
        />
      )}

      {dayOpen && (
        <DayEventsModal
          date={dayOpen}
          events={dayEvents}
          onClose={() => setDayOpen(null)}
          onSelect={(event) => {
            setDayOpen(null);
            setViewingId(event.id);
          }}
          onAdd={(dateKey) => {
            setDayOpen(null);
            openCreate(dateKey);
          }}
        />
      )}

      <ConfirmDialog
        id="calendar-confirm-title"
        open={pendingConfirm !== null}
        onClose={() => setPendingConfirm(null)}
        onConfirm={confirmPending}
        danger={confirmCopy.danger}
        title={confirmCopy.title}
        confirmLabel={confirmCopy.confirmLabel}
        description={confirmCopy.description}
      />
    </div>
  );
}
