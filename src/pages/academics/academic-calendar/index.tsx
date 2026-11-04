import { useState } from "react";
import { CalendarRange, Download } from "lucide-react";
import cpcBg from "@/assets/cpc-bg2.png";
import { PageHeroBanner } from "@/components/common/page-hero-banner";
import { PortalFooter } from "@/components/common/portal-footer";
import { PortalHeader } from "@/components/common/portal-header";
import { ToastProvider, useToast } from "@/components/ui/toast";
import { AcademicReminders } from "@/features/academic-calendar/components/AcademicReminders";
import { CalendarCard } from "@/features/academic-calendar/components/CalendarCard";
import { CalendarLegend } from "@/features/academic-calendar/components/CalendarLegend";
import { DayEventsModal } from "@/features/academic-calendar/components/DayEventsModal";
import { EventDetailsModal } from "@/features/academic-calendar/components/EventDetailsModal";
import { FullYearModal } from "@/features/academic-calendar/components/FullYearModal";
import { KeyAcademicDates } from "@/features/academic-calendar/components/KeyAcademicDates";
import { UpcomingDates } from "@/features/academic-calendar/components/UpcomingDates";
import {
  ACADEMIC_YEAR,
  type AcademicEvent,
} from "@/features/academic-calendar/data/academicCalendar";
import { useAcademicCalendar } from "@/features/academic-calendar/hooks/useAcademicCalendar";
import {
  downloadAcademicCalendarPdf,
  eventsForDate,
  formatMonthYear,
} from "@/features/academic-calendar/lib/calendar";

/** Route: /academics/academic-calendar — frontend-only sample data. */
export default function AcademicCalendarPage() {
  return (
    <ToastProvider>
      <AcademicCalendarContent />
    </ToastProvider>
  );
}

function AcademicCalendarContent() {
  const calendar = useAcademicCalendar();
  const { toast } = useToast();
  const [downloading, setDownloading] = useState(false);

  const monthLabel = formatMonthYear(calendar.anchor);
  const dayEvents =
    calendar.selectedDate === null
      ? []
      : eventsForDate(calendar.events, calendar.selectedDate);

  const handleDownload = () => {
    setDownloading(true);
    // Let the pressed state paint before the synchronous PDF build.
    window.setTimeout(() => {
      try {
        const fileName = downloadAcademicCalendarPdf(calendar.events, ACADEMIC_YEAR);
        toast(`Downloaded ${fileName}`, "success");
      } catch {
        toast("The calendar PDF could not be generated. Please try again.", "error");
      } finally {
        setDownloading(false);
      }
    }, 80);
  };

  const handleOpenEventFromDay = (event: AcademicEvent) => {
    calendar.closeDay();
    calendar.openEvent(event);
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-white font-poppins">
      <PortalHeader />

      <div className="print:hidden">
        <PageHeroBanner
          breadcrumbItems={[
            { label: "Home", href: "/student/home" },
            { label: "Academics", href: null },
            { label: "Academic Calendar", href: null },
          ]}
          eyebrow="ACADEMICS / ACADEMIC CALENDAR"
          title="Academic Calendar"
          subtitle="View important academic dates and school activities."
          backgroundImage={cpcBg}
        />
      </div>

      <main className="w-full bg-ac-page">
        <div className="mx-auto w-full max-w-[1280px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-ac-border bg-white px-2.5 py-1 font-poppins text-[9px] font-bold tracking-[0.08em] text-ac-primary uppercase">
                <CalendarRange className="h-3 w-3" aria-hidden />
                A.Y. {ACADEMIC_YEAR}
              </span>
              <span className="font-poppins text-[10px] text-ac-muted">
                Dates may change — watch official announcements.
              </span>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={calendar.openFullYear}
                className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-ac-border bg-white px-3 py-2 font-poppins text-[10.5px] font-semibold text-ac-text transition-colors hover:border-ac-primary/30 hover:bg-ac-section focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ac-primary"
              >
                <CalendarRange className="h-3.5 w-3.5" aria-hidden />
                View Full Year
              </button>
              <button
                type="button"
                onClick={handleDownload}
                disabled={downloading}
                className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-ac-primary px-3 py-2 font-poppins text-[10.5px] font-semibold text-white transition-colors hover:bg-ac-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ac-primary disabled:cursor-wait disabled:opacity-70"
              >
                <Download className="h-3.5 w-3.5" aria-hidden />
                {downloading ? "Preparing PDF…" : "Download Calendar"}
              </button>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.9fr)_minmax(0,1fr)] xl:gap-5">
            <div className="min-w-0 space-y-4 xl:space-y-5">
              <CalendarCard
                view={calendar.view}
                onChangeView={calendar.setView}
                title={calendar.title}
                monthDate={calendar.anchor}
                weekDays={calendar.weekDays}
                events={calendar.events}
                monthEvents={calendar.monthEvents}
                loading={calendar.loading}
                onPrevious={calendar.goPrevious}
                onNext={calendar.goNext}
                onToday={calendar.goToday}
                onOpenEvent={calendar.openEvent}
                onOpenDay={calendar.openDay}
              />

              <KeyAcademicDates
                dates={calendar.keyDates}
                monthLabel={monthLabel}
                loading={calendar.loading}
                onOpenEvent={calendar.openEvent}
              />
            </div>

            <div className="min-w-0 space-y-4 xl:space-y-5">
              <UpcomingDates
                events={calendar.upcoming}
                monthLabel={monthLabel}
                loading={calendar.loading}
                onOpenEvent={calendar.openEvent}
              />
              <AcademicReminders
                reminders={calendar.reminders}
                onOpenEvent={calendar.openEvent}
              />
              <CalendarLegend />
            </div>
          </div>
        </div>
      </main>

      <PortalFooter />

      <EventDetailsModal
        event={calendar.selectedEvent}
        onClose={calendar.closeEvent}
        onViewDay={(date) => {
          calendar.closeEvent();
          calendar.openDay(date);
        }}
      />
      <DayEventsModal
        date={calendar.selectedDate}
        events={dayEvents}
        onClose={calendar.closeDay}
        onOpenEvent={handleOpenEventFromDay}
      />
      <FullYearModal
        open={calendar.fullYearOpen}
        year={calendar.fullYear}
        events={calendar.events}
        onChangeYear={(delta) => calendar.setFullYear(calendar.fullYear + delta)}
        onSelectMonth={calendar.selectMonth}
        onClose={calendar.closeFullYear}
      />
    </div>
  );
}
