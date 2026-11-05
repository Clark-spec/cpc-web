import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type PageBannerProps = {
  title: string;
  subtitle: string;
  eyebrow?: string;
  /** Right-hand slot, usually the current date or a scope pill. */
  right?: ReactNode;
  className?: string;
};

/**
 * Light-blue wave banner used by the admin pages. It keeps the student
 * portal's rounded-card language while staying calmer than the navy hero.
 */
export function PageBanner({
  title,
  subtitle,
  eyebrow,
  right,
  className,
}: PageBannerProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl border border-cpc-tile-border/70 bg-cpc-bg px-5 py-6 sm:px-7 sm:py-7",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white/70 via-cpc-bg/40 to-cpc-section-light/30" />
      <div className="pointer-events-none absolute -top-16 -right-10 h-44 w-44 rounded-full bg-white/40" />
      <div className="pointer-events-none absolute -bottom-20 left-1/3 h-40 w-40 rounded-full bg-cpc-tile-border/20" />

      <svg
        aria-hidden
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-16 w-full text-white/50 sm:h-20"
      >
        <path
          d="M0 60 C 180 110 320 10 520 52 C 720 94 860 18 1060 48 C 1220 72 1340 34 1440 54 L1440 120 L0 120 Z"
          fill="currentColor"
        />
        <path
          d="M0 84 C 200 118 360 42 560 72 C 760 102 920 48 1120 68 C 1260 82 1360 62 1440 74 L1440 120 L0 120 Z"
          fill="currentColor"
          opacity="0.55"
        />
      </svg>

      <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          {eyebrow && (
            <p className="font-poppins text-[11px] font-bold tracking-[0.16em] text-cpc-blue-accent uppercase">
              {eyebrow}
            </p>
          )}
          <h1 className="mt-1 font-poppins text-2xl leading-tight font-bold text-cpc-navy-text sm:text-3xl">
            {title}
          </h1>
          <p className="mt-1.5 max-w-2xl font-poppins text-sm leading-relaxed text-cpc-heading-soft">
            {subtitle}
          </p>
        </div>
        {right && <div className="shrink-0">{right}</div>}
      </div>
    </section>
  );
}
