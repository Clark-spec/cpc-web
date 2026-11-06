import { AlertTriangle, ShieldAlert } from "lucide-react";
import { PageBanner } from "@/components/ui/admin/PageBanner";
import { ROLE_LABELS } from "@/config/navigation";
import { ACADEMIC_YEAR, SEMESTER } from "@/data/mockSchedules";
import { useScheduleAdmin } from "../context/ScheduleAdminContext";
import { LiveSyncIndicator } from "./LiveSyncIndicator";

/**
 * Page h1 + wave banner.
 *
 * The conflict strip rides under the same card because a clash is a property of
 * the whole timetable, not of the section on screen: an instructor double-booked
 * across BSIT-3A and BSIT-3C is invisible while either tab is open on its own.
 */
export function ScheduleBanner() {
  const { conflictCount, conflictsBySection, role, loading } = useScheduleAdmin();

  const clashSections = Object.keys(conflictsBySection).length;
  const showConflicts = !loading && conflictCount > 0;

  return (
    <>
      <PageBanner
        title="Class Schedules"
        subtitle="Build, check and publish the section timetables students see."
        eyebrow={`${SEMESTER} · AY ${ACADEMIC_YEAR}`}
        right={
          <div className="flex flex-col items-start gap-2.5 sm:items-end">
            <LiveSyncIndicator />
            <p className="inline-flex items-center gap-1.5 rounded-full border border-cpc-tile-border/70 bg-white px-3 py-1.5 font-poppins text-[11px] font-semibold text-cpc-navy-text">
              <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-cpc-blue-accent" aria-hidden />
              {ROLE_LABELS[role]}
            </p>
          </div>
        }
      />

      {showConflicts && (
        <div
          role="status"
          aria-live="polite"
          className="-mt-px flex items-start gap-2 rounded-b-2xl border border-t-0 border-amber-200 bg-amber-50 px-5 py-2.5 sm:px-7"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden />
          <p className="font-poppins text-xs leading-relaxed font-semibold text-amber-700">
            {conflictCount === 1
              ? "1 schedule conflict"
              : `${conflictCount} schedule conflicts`}
            {" across "}
            {clashSections === 1 ? "1 section" : `${clashSections} sections`}
            {" — review them before publishing."}
          </p>
        </div>
      )}
    </>
  );
}
