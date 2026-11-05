import { useState } from "react";
import { ChevronDown, FileText } from "lucide-react";
import { cn } from "@/lib/cn";
import { SubjectsTable } from "@/shared/clearance/components/SubjectsTable";
import { EventsTable } from "@/shared/clearance/components/EventsTable";
import { useClearanceAdmin } from "../context/ClearanceAdminContext";

/**
 * Collapsible read-only Form 3: the student's subjects (with unit total) and
 * significant events, rendered with the very tables the student page uses so
 * staff and students always read the same numbers.
 */
export function Form3Preview() {
  const { selectedRecord } = useClearanceAdmin();
  const [open, setOpen] = useState(false);

  if (!selectedRecord) return null;

  const { subjects, saoEvents } = selectedRecord;
  const totalUnits = subjects.reduce((sum, subject) => sum + subject.units, 0);
  const panelId = "form3-preview-panel";

  return (
    <section aria-label="Form 3 preview" className="min-w-0">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl border border-cpc-tile-border/70 bg-white px-3.5 py-2.5 text-left transition-colors hover:bg-cpc-section-light/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
      >
        <span className="flex min-w-0 items-center gap-2">
          <FileText className="h-4 w-4 shrink-0 text-cpc-blue-accent" aria-hidden />
          <span className="min-w-0">
            <span className="block font-poppins text-xs font-bold text-cpc-navy-text">
              Form 3 preview
            </span>
            <span className="block font-poppins text-[10px] text-cpc-heading-soft">
              Read-only · {subjects.length} {subjects.length === 1 ? "subject" : "subjects"} ·{" "}
              {totalUnits} units · {saoEvents.length} {saoEvents.length === 1 ? "event" : "events"}
            </span>
          </span>
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-cpc-heading-soft transition-transform duration-200 motion-reduce:transition-none",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      {open && (
        <div
          id={panelId}
          className="mt-2 space-y-4 rounded-xl border border-cpc-tile-border/70 bg-cpc-section-light/40 p-3 sm:p-4"
        >
          <div className="min-w-0">
            <h3 className="font-poppins text-xs font-bold text-cpc-navy-text">Subjects Taken</h3>
            <p className="mt-0.5 mb-2 font-poppins text-[10px] text-cpc-heading-soft">
              What the student declared on their Form 3 this semester.
            </p>
            {subjects.length > 0 ? (
              <SubjectsTable subjects={subjects} />
            ) : (
              <p className="rounded-lg border border-dashed border-cpc-tile-border/70 px-3 py-2 font-poppins text-[11px] text-cpc-heading-soft italic">
                No subjects on file.
              </p>
            )}
          </div>

          <div className="min-w-0">
            <h3 className="font-poppins text-xs font-bold text-cpc-navy-text">
              Significant Events / SAO Activities
            </h3>
            <p className="mt-0.5 mb-2 font-poppins text-[10px] text-cpc-heading-soft">
              Attendance recorded by the SAO office.
            </p>
            {saoEvents.length > 0 ? (
              <EventsTable events={saoEvents} />
            ) : (
              <p className="rounded-lg border border-dashed border-cpc-tile-border/70 px-3 py-2 font-poppins text-[11px] text-cpc-heading-soft italic">
                No events recorded.
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
