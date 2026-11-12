import {
  CheckCircle2,
  Clock,
  Files,
  SearchCheck,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";
import type { ComplaintSummary } from "@/components/features/student/complaint-status/useComplaintStatus";

type SummaryCard = {
  key: keyof ComplaintSummary;
  label: string;
  caption: string;
  icon: LucideIcon;
  tileClass: string;
  barClass: string;
};

const CARDS: SummaryCard[] = [
  {
    key: "total",
    label: "Total Complaints",
    caption: "All complaints you filed",
    icon: Files,
    tileClass: "bg-[#E8F1FF] text-sr-primary",
    barClass: "bg-sr-primary",
  },
  {
    key: "pending",
    label: "Pending",
    caption: "Waiting for office action",
    icon: Clock,
    tileClass: "bg-[#FEF4E7] text-[#B7791F]",
    barClass: "bg-[#F2A23A]",
  },
  {
    key: "inReview",
    label: "In Review",
    caption: "Being reviewed by the office",
    icon: SearchCheck,
    tileClass: "bg-[#EAF1FD] text-[#3976D9]",
    barClass: "bg-[#3976D9]",
  },
  {
    key: "resolved",
    label: "Resolved",
    caption: "Reviewed and resolved",
    icon: CheckCircle2,
    tileClass: "bg-[#E9F7F1] text-[#1E8A57]",
    barClass: "bg-[#24A56A]",
  },
];

type ComplaintStatusSummaryProps = {
  summary: ComplaintSummary;
  loading: boolean;
  error?: string | null;
};

export function ComplaintStatusSummary({
  summary,
  loading,
  error,
}: ComplaintStatusSummaryProps) {
  return (
    <section
      aria-label="Complaint overview"
      aria-busy={loading}
      className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4"
    >
      {CARDS.map((card) => {
        const Icon = card.icon;
        return (
          <article
            key={card.key}
            className="sr-card relative overflow-hidden px-4 pt-4 pb-3.5 transition-shadow hover:shadow-[0_6px_20px_rgba(23,43,92,0.08)]"
          >
            <span className={cn("absolute inset-x-0 top-0 h-[3px]", card.barClass)} aria-hidden />
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-poppins text-[10px] leading-[14px] font-semibold tracking-[0.07em] text-sr-muted uppercase sm:text-[10.5px]">
                  {card.label}
                </p>
                {loading ? (
                  <span
                    className="mt-2 block h-[24px] w-[34px] animate-pulse rounded bg-sr-section"
                    aria-hidden
                  />
                ) : (
                  <p
                    className={cn(
                      "mt-1 font-poppins text-[24px] leading-[28px] font-bold sm:text-[26px]",
                      error ? "text-sr-muted" : "text-sr-text",
                    )}
                    aria-label={`${card.label}: ${error ? "unavailable" : summary[card.key]}`}
                  >
                    {error ? "—" : summary[card.key]}
                  </p>
                )}
              </div>
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                  card.tileClass,
                )}
                aria-hidden
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
              </span>
            </div>
            <p className="mt-1.5 font-poppins text-[10px] leading-[14px] text-sr-muted">
              {card.caption}
            </p>
          </article>
        );
      })}
    </section>
  );
}
