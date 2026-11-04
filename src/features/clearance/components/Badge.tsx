import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type BadgeTone = "success" | "warning" | "info" | "neutral" | "danger";

const toneClasses: Record<BadgeTone, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  info: "border-cpc-tile-border bg-cpc-section-light text-cpc-blue-accent",
  neutral: "border-slate-200 bg-slate-50 text-slate-600",
  danger: "border-rose-200 bg-rose-50 text-rose-700",
};

type BadgeProps = {
  tone?: BadgeTone;
  className?: string;
  children: ReactNode;
};

/** Compact status pill used across the clearance cards and tables. */
export function Badge({ tone = "neutral", className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-poppins text-[11px] leading-none font-semibold whitespace-nowrap",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
