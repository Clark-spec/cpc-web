import {
  AlertCircle,
  CheckCircle2,
  Eye,
  FileText,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatRelativeTime } from "@/lib/format";
import { EmptyState } from "@/components/common/display/EmptyState";
import {
  ENROLLMENT_STATUS_LABELS,
  type EnrollmentActivityEntry,
  type EnrollmentApplicationStatus,
} from "@/services/enrollmentAdmin";

const META: Record<
  EnrollmentApplicationStatus,
  { icon: LucideIcon; tone: string; dot: string }
> = {
  pending: { icon: FileText, tone: "bg-cpc-section-light text-cpc-blue-accent", dot: "#2b4bd1" },
  "for-review": { icon: Eye, tone: "bg-amber-50 text-amber-600", dot: "#d97706" },
  "needs-requirements": {
    icon: AlertCircle,
    tone: "bg-rose-50 text-rose-600",
    dot: "#e11d48",
  },
  approved: { icon: CheckCircle2, tone: "bg-emerald-50 text-emerald-600", dot: "#059669" },
  rejected: { icon: XCircle, tone: "bg-rose-50 text-rose-600", dot: "#e11d48" },
};

/** Compact feed of the newest applicant movements. */
export function RecentEnrollmentActivity({ items }: { items: EnrollmentActivityEntry[] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        title="No enrollment activity yet"
        description="Applicant submissions and decisions will appear here as they happen."
      />
    );
  }

  return (
    <div className="flex h-full flex-col justify-between">
      <ul className="space-y-1">
        {items.map((item) => {
          const meta = META[item.status];
          const Icon = meta.icon;

          return (
            <li
              key={item.id}
              className="group flex items-start gap-3 rounded-xl p-2.5 transition-all duration-200 hover:bg-white/60 hover:shadow-2xs"
            >
              <span
                className={cn(
                  "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl shadow-xs transition-transform duration-200 group-hover:scale-105",
                  meta.tone,
                )}
                aria-hidden
              >
                <Icon className="h-4 w-4" />
              </span>

              <div className="min-w-0 flex-1">
                <p className="font-poppins text-xs leading-snug font-semibold text-cpc-navy-text">
                  {item.message}
                </p>
                <p className="mt-0.5 truncate font-poppins text-[10.5px] text-cpc-heading-soft">
                  {item.studentName}
                  <span className="mx-1.5 opacity-50">·</span>
                  {item.studentId}
                </p>
              </div>

              <div className="flex shrink-0 flex-col items-end gap-1">
                <time
                  dateTime={item.at}
                  className="font-poppins text-[10px] whitespace-nowrap text-cpc-heading-soft"
                >
                  {formatRelativeTime(item.at)}
                </time>
                <span className="inline-flex items-center gap-1 rounded-full border border-white/80 bg-white/70 px-2 py-0.5 font-poppins text-[9.5px] font-semibold text-cpc-navy-text shadow-2xs backdrop-blur-xs">
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: meta.dot }}
                    aria-hidden
                  />
                  {ENROLLMENT_STATUS_LABELS[item.status]}
                </span>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-3 flex items-center justify-between border-t border-cpc-tile-border/40 pt-2.5 font-poppins text-[11px] text-cpc-heading-soft">
        <span className="truncate">Showing latest activity</span>
        <span className="font-semibold text-cpc-blue-accent">Live queue</span>
      </div>
    </div>
  );
}
