import type { CSSProperties, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export type BadgeTone = "success" | "warning" | "info" | "neutral" | "danger" | "plain";

export type BadgeSize = "sm" | "md" | "lg";

type ToneStyle = {
  pill: string;
  dotColor: string;
};

const TONE_STYLES: Record<BadgeTone, ToneStyle> = {
  success: {
    pill: "border-cpc-badge-success-border bg-cpc-badge-success-bg text-cpc-badge-success-text",
    dotColor: "var(--color-cpc-badge-success-dot)",
  },
  warning: {
    pill: "border-cpc-badge-warning-border bg-cpc-badge-warning-bg text-cpc-badge-warning-text",
    dotColor: "var(--color-cpc-badge-warning-dot)",
  },
  info: {
    pill: "border-cpc-badge-info-border bg-cpc-badge-info-bg text-cpc-badge-info-text",
    dotColor: "var(--color-cpc-badge-info-dot)",
  },
  danger: {
    pill: "border-cpc-badge-danger-border bg-cpc-badge-danger-bg text-cpc-badge-danger-text",
    dotColor: "var(--color-cpc-badge-danger-dot)",
  },
  neutral: {
    pill: "border-cpc-badge-neutral-border bg-cpc-badge-neutral-bg text-cpc-badge-neutral-text",
    dotColor: "var(--color-cpc-badge-neutral-dot)",
  },
  /** Custom-coloured tag: shape and size only, colours come from `className`. */
  plain: { pill: "border-transparent", dotColor: "currentColor" },
};

const SIZE_STYLES: Record<
  BadgeSize,
  { pill: string; dot: string; icon: string }
> = {
  sm: { pill: "h-5 px-2 text-[11px]", dot: "h-1.5 w-1.5", icon: "h-3 w-3" },
  md: { pill: "h-6 px-3 text-[12px]", dot: "h-1.5 w-1.5", icon: "h-3 w-3" },
  lg: { pill: "h-7 px-3.5 text-[13px]", dot: "h-[7px] w-[7px]", icon: "h-3.5 w-3.5" },
};

type BadgeProps = {
  /** Semantic tone. Use `plain` only for tags that bring their own colours. */
  tone?: BadgeTone;
  size?: BadgeSize;
  /** Refined status dot (default). Ignored when `icon` is provided. */
  dot?: boolean;
  /** Small leading icon shown instead of the dot. */
  icon?: LucideIcon;
  /** Soft pulse reserved for in-progress statuses. */
  pulse?: boolean;
  /** Gentle lift for badges that open something. */
  interactive?: boolean;
  /** Overrides the dot colour (category tags keep their own hue). */
  dotColor?: string;
  className?: string;
  title?: string;
  children: ReactNode;
};

/**
 * Single status pill for the whole portal: one shape, one type scale and one
 * tone-to-meaning mapping. Sizes: `sm` (tables, dense lists), `md` (default),
 * `lg` (modal headers and detail views).
 */
export function Badge({
  tone = "neutral",
  size = "md",
  dot = true,
  icon: Icon,
  pulse = false,
  interactive = false,
  dotColor,
  className,
  title,
  children,
}: BadgeProps) {
  const toneStyle = TONE_STYLES[tone];
  const sizeStyle = SIZE_STYLES[size];
  const dotFill = dotColor ?? toneStyle.dotColor;

  return (
    <span
      title={title}
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full border font-poppins leading-none font-semibold tracking-[0.01em] whitespace-nowrap align-middle transition-[background-color,box-shadow,translate] duration-150",
        sizeStyle.pill,
        toneStyle.pill,
        interactive &&
          "cursor-pointer hover:-translate-y-px hover:shadow-sm active:translate-y-0",
        className,
      )}
    >
      {Icon ? (
        <Icon className={cn(sizeStyle.icon, "shrink-0")} aria-hidden />
      ) : dot ? (
        <span
          aria-hidden
          className={cn(
            "shrink-0 rounded-full",
            sizeStyle.dot,
            pulse && "animate-pulse motion-reduce:animate-none",
          )}
          style={
            {
              backgroundColor: dotFill,
              boxShadow: `0 0 0 3px color-mix(in srgb, ${dotFill} 20%, transparent)`,
            } as CSSProperties
          }
        />
      ) : null}
      {children}
    </span>
  );
}
