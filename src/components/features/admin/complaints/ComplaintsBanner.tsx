import { Inbox } from "lucide-react";
import { PageBanner } from "@/components/common/display/PageBanner";

type ComplaintsBannerProps = {
  openCount: number;
};

/** Page h1 + wave banner, matching the clearance desk's hero treatment. */
export function ComplaintsBanner({ openCount }: ComplaintsBannerProps) {
  return (
    <PageBanner
      title="Complaints"
      subtitle="Review, track, and resolve complaints submitted by students through the portal"
      right={
        <div className="flex items-center gap-2.5 rounded-xl border border-white/80 bg-white/80 px-3.5 py-2.5 shadow-[0_10px_30px_rgba(15,36,104,0.08)] backdrop-blur">
          <span
            aria-hidden
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cpc-section-light text-cpc-blue-accent"
          >
            <Inbox className="h-4 w-4" />
          </span>
          <div>
            <p className="font-poppins text-[10px] font-bold tracking-[0.12em] text-cpc-heading-soft uppercase">
              Open cases
            </p>
            <p className="font-poppins text-sm leading-none font-bold text-cpc-navy-text tabular-nums">
              {openCount}
            </p>
          </div>
        </div>
      }
    />
  );
}
