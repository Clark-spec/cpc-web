import { Eraser, History } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  ACTIVITY_META,
  STATUS_META,
  type CalendarActivity,
} from "../data/academicCalendar";
import { CalendarEmptyState, SectionCard, ghostButtonClass } from "./CalendarPieces";

type RecentActivitiesCardProps = {
  activities: CalendarActivity[];
  onClear: () => void;
};

function formatTimestamp(at: string): string {
  return new Date(at).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Session activity log. It is intentionally empty on load: entries are only
 * created by actions the administrator performs in this browser session.
 */
export function RecentActivitiesCard({ activities, onClear }: RecentActivitiesCardProps) {
  return (
    <SectionCard
      id="recent-calendar-activities"
      title="Recent Calendar Activities"
      description="Actions from this browser session only — no fabricated audit history."
      actions={
        <button
          type="button"
          onClick={onClear}
          disabled={activities.length === 0}
          className={ghostButtonClass("disabled:cursor-not-allowed disabled:opacity-40")}
        >
          <Eraser className="h-3 w-3" aria-hidden />
          Clear log
        </button>
      }
      bodyClassName="p-3"
    >
      {activities.length === 0 ? (
        <CalendarEmptyState
          title="No calendar changes yet"
          description="Create, edit, publish, archive, or delete an event and the action will appear here."
        />
      ) : (
        <ol className="space-y-1">
          {activities.slice(0, 8).map((activity) => {
            const meta = ACTIVITY_META[activity.action];
            const Icon = meta.icon;
            return (
              <li
                key={activity.id}
                className="flex items-start gap-2 rounded-lg border border-cpc-input-border/60 bg-white/90 px-2.5 py-2"
              >
                <span
                  className={cn(
                    "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                    meta.tone,
                  )}
                  aria-hidden
                >
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-poppins text-xs leading-snug text-cpc-navy-text">
                    <span className="font-bold">{meta.label}</span> ·{" "}
                    <span className="font-semibold">{activity.eventTitle}</span>
                  </p>
                  {activity.detail && (
                    <p className="mt-0.5 font-poppins text-[11px] leading-snug text-cpc-heading-soft">
                      {activity.detail}
                    </p>
                  )}
                  <p className="mt-0.5 font-poppins text-[10px] text-cpc-heading-soft">
                    {formatTimestamp(activity.at)}
                  </p>
                </div>
                {activity.status && (
                  <span
                    className={cn(
                      "mt-0.5 shrink-0 rounded-full border px-2 py-0.5 font-poppins text-[10px] font-bold",
                      STATUS_META[activity.status].badgeClass,
                    )}
                  >
                    {STATUS_META[activity.status].label}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      )}

      {activities.length > 8 && (
        <p className="mt-1.5 flex items-center gap-1 px-1 font-poppins text-[11px] text-cpc-heading-soft">
          <History className="h-3 w-3" aria-hidden />
          Showing the 8 most recent of {activities.length} session actions.
        </p>
      )}
    </SectionCard>
  );
}
