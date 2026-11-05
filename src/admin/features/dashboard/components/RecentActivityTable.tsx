import { useMemo, useState } from "react";
import {
  ClipboardList,
  Megaphone,
  MessageSquareWarning,
  ShieldCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatDateTime, formatRelativeTime } from "@/utils/format";
import { StatusBadge } from "../../../components/StatusBadge";
import { EmptyState } from "../../../components/EmptyState";
import type { ActivityItem, ActivityStudent, ActivityType } from "@/types/admin";

const TYPE_ICONS: Record<ActivityType, LucideIcon> = {
  enrollment: ClipboardList,
  clearance: ShieldCheck,
  complaint: MessageSquareWarning,
  announcement: Megaphone,
};

const TYPE_TONES: Record<ActivityType, string> = {
  enrollment: "bg-cpc-section-light text-cpc-blue-accent",
  clearance: "bg-emerald-50 text-emerald-600",
  complaint: "bg-rose-50 text-rose-600",
  announcement: "bg-amber-50 text-amber-600",
};

type FilterId = "all" | ActivityType;

const FILTERS: Array<{ id: FilterId; label: string }> = [
  { id: "all", label: "All" },
  { id: "enrollment", label: "Enrollment" },
  { id: "clearance", label: "Clearance" },
  { id: "complaint", label: "Complaints" },
  { id: "announcement", label: "Announcements" },
];

/** Rows shown before the feed has to be expanded with "View all". */
const PREVIEW_ROWS = 4;

type RecentActivityTableProps = {
  items: ActivityItem[];
  onOpenStudent: (student: ActivityStudent) => void;
};

/** Recent activity feed with type filters and a student quick-view trigger. */
export function RecentActivityTable({ items, onOpenStudent }: RecentActivityTableProps) {
  const [filter, setFilter] = useState<FilterId>("all");
  const [showAll, setShowAll] = useState(false);

  const filtered = useMemo(
    () => (filter === "all" ? items : items.filter((item) => item.type === filter)),
    [filter, items],
  );

  const hidden = Math.max(filtered.length - PREVIEW_ROWS, 0);
  const visible = showAll || hidden === 0 ? filtered : filtered.slice(0, PREVIEW_ROWS);

  return (
    <div className="pb-2">
      <div className="flex flex-wrap items-center gap-1.5 border-b border-cpc-tile-border/60 px-4 py-3">
        <span className="mr-1 font-poppins text-[10px] font-bold tracking-[0.12em] text-cpc-heading-soft uppercase">
          Filter
        </span>
        {FILTERS.map((entry) => {
          const active = filter === entry.id;
          const count =
            entry.id === "all"
              ? items.length
              : items.filter((item) => item.type === entry.id).length;

          return (
            <button
              key={entry.id}
              type="button"
              onClick={() => setFilter(entry.id)}
              aria-pressed={active}
              className={cn(
                "inline-flex cursor-pointer items-center gap-1 rounded-full border px-2.5 py-1 font-poppins text-[11px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent",
                active
                  ? "border-cpc-blue-accent bg-cpc-blue-accent text-white"
                  : "border-cpc-tile-border bg-white text-cpc-heading-soft hover:bg-cpc-section-light",
              )}
            >
              {entry.label}
              <span
                className={cn(
                  "rounded-full px-1 text-[9px] leading-tight font-bold",
                  active ? "bg-white/20 text-white" : "bg-cpc-section-light text-cpc-blue-accent",
                )}
              >
                {count}
              </span>
            </button>
          );
        })}

        {hidden > 0 && (
          <button
            type="button"
            onClick={() => setShowAll((previous) => !previous)}
            aria-expanded={showAll}
            className="ml-auto cursor-pointer font-poppins text-[11px] font-semibold text-cpc-blue-accent underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
          >
            {showAll ? "Show less" : `View all (+${hidden})`}
          </button>
        )}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          title="No activity in this filter"
          description="New enrollment, clearance, complaint and announcement events will appear here."
        />
      ) : (
        <>
          {/* Table on wide screens; scrolls inside the card so it can never spill over the border. */}
          <div className="hidden max-h-80 overflow-auto sm:block">
            <table className="w-full border-collapse">
              <caption className="sr-only">
                Recent admin activity, newest first. Selecting a user opens their quick view.
              </caption>
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-cpc-tile-border/60 bg-cpc-section-light/60">
                  <th
                    scope="col"
                    className="px-4 py-2 text-left font-poppins text-[10px] font-bold tracking-[0.1em] text-cpc-heading-soft uppercase whitespace-nowrap"
                  >
                    Time
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-2 text-left font-poppins text-[10px] font-bold tracking-[0.1em] text-cpc-heading-soft uppercase"
                  >
                    Activity
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-2 text-left font-poppins text-[10px] font-bold tracking-[0.1em] text-cpc-heading-soft uppercase"
                  >
                    User
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-2 text-left font-poppins text-[10px] font-bold tracking-[0.1em] text-cpc-heading-soft uppercase"
                  >
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cpc-tile-border/50">
                {visible.map((item) => {
                  const Icon = TYPE_ICONS[item.type];
                  return (
                    <tr key={item.id} className="transition-colors hover:bg-cpc-section-light/30">
                      <td className="px-4 py-2.5 align-top">
                        <time
                          dateTime={item.createdAt}
                          title={formatDateTime(item.createdAt)}
                          className="font-poppins text-[11px] whitespace-nowrap text-cpc-heading-soft"
                        >
                          {formatRelativeTime(item.createdAt)}
                        </time>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-start gap-2.5">
                          <span
                            className={cn(
                              "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                              TYPE_TONES[item.type],
                            )}
                          >
                            <Icon className="h-3.5 w-3.5" aria-hidden />
                          </span>
                          <p className="min-w-0 font-poppins text-xs font-medium text-cpc-navy-text">
                            {item.message}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 align-top">
                        {item.student ? (
                          <button
                            type="button"
                            onClick={() => onOpenStudent(item.student as ActivityStudent)}
                            className="cursor-pointer text-left font-poppins text-xs font-semibold text-cpc-blue-accent underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
                          >
                            {item.student.name}
                            <span className="block font-poppins text-[10px] font-normal text-cpc-heading-soft">
                              {item.student.id}
                            </span>
                          </button>
                        ) : (
                          <span className="font-poppins text-xs text-cpc-heading-soft">
                            {item.actor}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 align-top">
                        <StatusBadge status={item.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Cards on phones. */}
          <ul className="divide-y divide-cpc-tile-border/50 sm:hidden">
            {visible.map((item) => {
              const Icon = TYPE_ICONS[item.type];
              return (
                <li key={item.id} className="px-4 py-3">
                  <div className="flex items-start gap-2.5">
                    <span
                      className={cn(
                        "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                        TYPE_TONES[item.type],
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-poppins text-xs font-medium text-cpc-navy-text">
                        {item.message}
                      </p>
                      <p className="font-poppins text-[10px] text-cpc-heading-soft">
                        by {item.actor}
                      </p>

                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <StatusBadge status={item.status} />
                        <time
                          dateTime={item.createdAt}
                          title={formatDateTime(item.createdAt)}
                          className="font-poppins text-[10px] text-cpc-heading-soft"
                        >
                          {formatRelativeTime(item.createdAt)}
                        </time>
                      </div>

                      {item.student && (
                        <button
                          type="button"
                          onClick={() => onOpenStudent(item.student as ActivityStudent)}
                          className="mt-1.5 cursor-pointer font-poppins text-[11px] font-semibold text-cpc-blue-accent underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
                        >
                          View {item.student.name}
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
