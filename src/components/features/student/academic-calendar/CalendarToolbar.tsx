import { useState } from "react";
import { CalendarRange, Download } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { ACADEMIC_YEAR } from "@/components/features/student/academic-calendar/academicCalendar";
import { downloadAcademicCalendarPdf } from "@/components/features/student/academic-calendar/calendar";
import type { AcademicCalendar } from "@/components/features/student/academic-calendar/useAcademicCalendar";

/** Academic year badge plus the full-year and PDF download controls. */
export function CalendarToolbar({ calendar }: { calendar: AcademicCalendar }) {
  const { toast } = useToast();
  const [downloading, setDownloading] = useState(false);

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

  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-cpc-input-border bg-white px-2.5 py-1 font-poppins text-[10px] font-bold tracking-[0.08em] text-cpc-blue-accent uppercase">
          <CalendarRange className="h-3 w-3" aria-hidden />
          A.Y. {ACADEMIC_YEAR}
        </span>
        <span className="font-poppins text-[11px] text-cpc-heading-soft">
          Dates may change — watch official announcements.
        </span>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={calendar.openFullYear}
          className="cpc-btn cpc-btn-secondary cpc-btn-sm"
        >
          <CalendarRange className="h-3.5 w-3.5" aria-hidden />
          View Full Year
        </button>
        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading}
          className="cpc-btn cpc-btn-primary cpc-btn-sm"
        >
          <Download className="h-3.5 w-3.5" aria-hidden />
          {downloading ? "Preparing PDF…" : "Download Calendar"}
        </button>
      </div>
    </div>
  );
}
