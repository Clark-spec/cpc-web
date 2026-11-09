import { Files, LoaderCircle, PackageCheck, SearchCheck, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import type { RequestSummary } from "@/components/features/student/request-status/useRequestStatus";

type SummaryCard = {
  key: keyof RequestSummary;
  label: string;
  caption: string;
  icon: LucideIcon;
  tileClass: string;
  barClass: string;
};

const CARDS: SummaryCard[] = [
  {
    key: "total",
    label: "Total Requests",
    caption: "All submitted requests",
    icon: Files,
    tileClass: "bg-[#E8F1FF] text-sr-primary",
    barClass: "bg-sr-primary",
  },
  {
    key: "processing",
    label: "Processing",
    caption: "Currently being prepared",
    icon: LoaderCircle,
    tileClass: "bg-[#EAF1FD] text-[#3976D9]",
    barClass: "bg-[#3976D9]",
  },
  {
    key: "underReview",
    label: "Under Review",
    caption: "Waiting for office review",
    icon: SearchCheck,
    tileClass: "bg-[#FEF4E7] text-[#B7791F]",
    barClass: "bg-[#F2A23A]",
  },
  {
    key: "released",
    label: "Released",
    caption: "Completed and released",
    icon: PackageCheck,
    tileClass: "bg-[#E9F7F1] text-[#1E8A57]",
    barClass: "bg-[#24A56A]",
  },
];

type StatusSummaryCardsProps = {
  summary: RequestSummary;
  loading: boolean;
  error?: string | null;
};

export function StatusSummaryCards({ summary, loading, error }: StatusSummaryCardsProps) {
  return (
    <section
      aria-label="Request overview"
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
