import { AlertTriangle, ShieldAlert } from "lucide-react";
import { PageBanner } from "@/components/common/display/PageBanner";
import { ROLE_LABELS } from "@/lib/navigation";
import { ACADEMIC_YEAR, SEMESTER } from "@/services/scheduleStudent/mockSchedules";
import { useScheduleAdmin } from "@/components/features/admin/schedules/ScheduleAdminContext";
import { LiveSyncIndicator } from "@/components/features/admin/schedules/LiveSyncIndicator";
import { cn } from "@/lib/cn";

/**
 * Page h1 + wave banner for Class Schedules.
 */
export function ScheduleBanner() {
  const { conflictCount, conflictsBySection, role, loading } = useScheduleAdmin();

  const clashSections = Object.keys(conflictsBySection).length;
  const showConflicts = !loading && conflictCount > 0;

  return (
    <>
      <PageBanner
        eyebrow={`ACADEMICS · ${SEMESTER} AY ${ACADEMIC_YEAR}`}
        title="Class Schedules"
        subtitle="Build, verify room and faculty assignments, and publish live section timetables."
        className={cn(
          "border-white/80 bg-white/75 shadow-[0_8px_30px_rgb(15,36,104,0.04)] backdrop-blur-md",
          showConflicts && "rounded-b-none border-b-0",
        )}
        right={
          <div className="flex flex-col items-start gap-2.5 sm:items-end">
            <LiveSyncIndicator />
            <p className="inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/80 px-3.5 py-1.5 font-poppins text-[11px] font-semibold text-cpc-navy-text shadow-xs backdrop-blur-sm">
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
