import { CalendarDays } from "lucide-react";
import { cn } from "@/lib/cn";
import { useSchedule } from "@/components/features/student/schedules/useSchedule";
import type { ScheduleEntry } from "@/types/schedule";
import { getSubjectColor } from "@/lib/scheduleColors";
import { daysToLabel, formatTimeRange } from "@/lib/scheduleTime";
import { StatusBadge } from "@/components/features/student/schedules/Badge";
import { Modal } from "@/components/ui/modal";

type SubjectDetailsModalProps = {
  entry: ScheduleEntry | null;
  onClose: () => void;
};

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-poppins text-[10px] font-semibold tracking-[0.1em] text-cpc-heading-soft uppercase">
        {label}
      </dt>
      <dd className="mt-0.5 font-poppins text-sm text-cpc-navy-text">{value}</dd>
    </div>
  );
}

/** Full subject details, opened from a table row, agenda card or calendar block. */
export function SubjectDetailsModal({ entry, onClose }: SubjectDetailsModalProps) {
  const { highlightEntry, roomSet } = useSchedule();

  if (!entry) return null;

  const color = getSubjectColor(entry.colorKey);

  function handleViewInCalendar() {
    if (!entry) return;
    onClose();
    // Let the dialog unmount and restore focus before scrolling.
    window.setTimeout(() => highlightEntry(entry.id), 60);
  }

  return (
    <Modal open onClose={onClose} labelledBy="subject-details-title">
      <div className="border-b border-cpc-input-border bg-cpc-section-light p-5 pr-12">
        <div className="flex items-center gap-2">
          <span className={cn("h-3 w-3 rounded-full", color.dot)} aria-hidden />
          <span className="font-poppins text-xs font-semibold tracking-[0.1em] text-cpc-heading-soft uppercase">
            {entry.subjectCode}
          </span>
          <StatusBadge status={entry.status} />
        </div>
        <h2
          id="subject-details-title"
          className="mt-2 font-poppins text-lg leading-snug font-semibold text-cpc-navy-text"
        >
          {entry.title}
        </h2>
      </div>

      <div className="p-5">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
          <Detail label="Instructor" value={entry.instructor} />
          <Detail label="Units" value={`${entry.units} units`} />
          <Detail label="Days" value={daysToLabel(entry.days)} />
          <Detail label="Time" value={formatTimeRange(entry.startMin, entry.endMin)} />
          <div>
            <dt className="font-poppins text-[10px] font-semibold tracking-[0.1em] text-cpc-heading-soft uppercase">
              Room · Set A
            </dt>
            <dd className="mt-0.5 flex items-center gap-1.5 font-poppins text-sm text-cpc-navy-text">
              {entry.roomSetA}
              {roomSet === "A" && (
                <span className="rounded-full bg-cpc-section-light px-2 py-0.5 text-[10px] font-semibold text-cpc-blue-accent">
                  Showing
                </span>
              )}
            </dd>
          </div>
          <div>
            <dt className="font-poppins text-[10px] font-semibold tracking-[0.1em] text-cpc-heading-soft uppercase">
              Room · Set B
            </dt>
            <dd className="mt-0.5 flex items-center gap-1.5 font-poppins text-sm text-cpc-navy-text">
              {entry.roomSetB}
              {roomSet === "B" && (
                <span className="rounded-full bg-cpc-section-light px-2 py-0.5 text-[10px] font-semibold text-cpc-blue-accent">
                  Showing
                </span>
              )}
            </dd>
          </div>
        </dl>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="cpc-btn cpc-btn-secondary"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleViewInCalendar}
            className="cpc-btn cpc-btn-primary"
          >
            <CalendarDays className="h-4 w-4" aria-hidden />
            View in calendar
          </button>
        </div>
      </div>
    </Modal>
  );
}
