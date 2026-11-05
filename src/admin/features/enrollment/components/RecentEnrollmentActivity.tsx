import {
  AlertCircle,
  CheckCircle2,
  Eye,
  FileText,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatRelativeTime } from "@/shared/clearance/utils/format";
import { EmptyState } from "../../../components/EmptyState";
import {
  ENROLLMENT_STATUS_LABELS,
  type EnrollmentActivityEntry,
  type EnrollmentApplicationStatus,
} from "../../../data/enrollmentApplications";

const META: Record<
  EnrollmentApplicationStatus,
  { icon: LucideIcon; tone: string; dot: string }
> = {
  pending: { icon: FileText, tone: "bg-[#EAF1FF] text-[#4785F5]", dot: "#4785F5" },
  "for-review": { icon: Eye, tone: "bg-[#FEF4E7] text-[#F3A43B]", dot: "#F3A43B" },
  "needs-requirements": {
    icon: AlertCircle,
    tone: "bg-[#FDEDEF] text-[#EF5365]",
    dot: "#EF5365",
  },
  approved: { icon: CheckCircle2, tone: "bg-[#E9F7F1] text-[#20B77A]", dot: "#20B77A" },
  rejected: { icon: XCircle, tone: "bg-[#FDEDEF] text-[#EF5365]", dot: "#EF5365" },
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
    <ul className="divide-y divide-admin-border/70">
      {items.map((item) => {
        const meta = META[item.status];
        const Icon = meta.icon;

        return (
          <li key={item.id} className="flex items-start gap-2.5 py-2.5 first:pt-0 last:pb-0">
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
              <p className="font-poppins text-[11.5px] leading-snug font-medium text-admin-text">
                {item.message}
              </p>
              <p className="mt-0.5 truncate font-poppins text-[10px] text-admin-muted">
                {item.studentName}
                <span className="mx-1 opacity-60">·</span>
                {item.studentId}
              </p>
            </div>

            <div className="flex shrink-0 flex-col items-end gap-1">
              <time
                dateTime={item.at}
                className="font-poppins text-[9.5px] whitespace-nowrap text-admin-muted"
              >
                {formatRelativeTime(item.at)}
              </time>
              <span className="inline-flex items-center gap-1 font-poppins text-[9px] font-semibold text-admin-muted">
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
  );
}
