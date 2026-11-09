import { ChevronRight, Sparkles } from "lucide-react";
import { Link } from "react-router";
import { cn } from "@/lib/cn";

type ProfilePageHeaderProps = {
  demoMode: boolean;
  onToggleDemoMode: () => void;
};

/** Breadcrumb row with the demo-mode switch on the right. */
export function ProfilePageHeader({ demoMode, onToggleDemoMode }: ProfilePageHeaderProps) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <nav aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-1.5 font-poppins text-xs text-cpc-heading-soft">
          <li className="flex items-center gap-1.5">
            <Link
              to="/student/home"
              className="rounded transition-colors hover:text-cpc-navy-text hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
            >
              Home
            </Link>
            <ChevronRight className="h-3 w-3 text-cpc-muted-blue" aria-hidden />
          </li>
          <li className="flex items-center gap-1.5">
            <span>My Account</span>
            <ChevronRight className="h-3 w-3 text-cpc-muted-blue" aria-hidden />
          </li>
          <li>
            <span aria-current="page" className="font-semibold text-cpc-navy-text">
              Student Profile
            </span>
          </li>
        </ol>
      </nav>

      <button
        type="button"
        onClick={onToggleDemoMode}
        aria-pressed={demoMode}
        title="Toggle with Ctrl+Shift+D"
        className={cn(
          "inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 font-poppins text-[11px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent",
          demoMode
            ? "border-cpc-blue-accent bg-cpc-blue-accent text-white"
            : "border-cpc-tile-border bg-white text-cpc-heading-soft hover:bg-cpc-section-light",
        )}
      >
        <Sparkles className="h-3.5 w-3.5" aria-hidden />
        Demo mode
      </button>
    </div>
  );
}
