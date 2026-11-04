import { CalendarDays } from "lucide-react";

/** Shown in the subject list card when the registrar has not published a section yet. */
export function EmptySchedule({ section }: { section: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-cpc-tile-border bg-cpc-section-light/40 px-4 py-12 text-center">
      <CalendarDays className="h-9 w-9 text-cpc-muted-blue" aria-hidden />
      <p className="mt-3 font-poppins text-sm font-semibold text-cpc-navy-text">
        No schedule available for {section}
      </p>
      <p className="mt-1 max-w-md font-poppins text-xs leading-relaxed text-cpc-heading-soft">
        The registrar has not published a class schedule for this section yet. Please check back
        later or contact your registrar&rsquo;s office.
      </p>
    </div>
  );
}

/** Shown in the weekly calendar card when the section has no class entries. */
export function EmptyWeeklyCalendar() {
  return (
    <div className="px-4 py-12 text-center">
      <p className="font-poppins text-sm font-semibold text-cpc-navy-text">
        No weekly calendar to show
      </p>
      <p className="mt-1 font-poppins text-xs text-cpc-heading-soft">
        This section has no classes yet.
      </p>
    </div>
  );
}
