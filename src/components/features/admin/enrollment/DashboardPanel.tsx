import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type DashboardPanelProps = {
  title: string;
  subtitle?: string;
  /** Right-hand header slot, usually a link or a small control. */
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
};

/** White dashboard card with the shared glassmorphism styling, border and header. */
export function DashboardPanel({
  title,
  subtitle,
  action,
  children,
  className,
  bodyClassName,
}: DashboardPanelProps) {
  return (
    <section
      className={cn(
        "flex flex-col justify-between overflow-hidden rounded-2xl border border-white/80 bg-white/75 shadow-[0_8px_30px_rgb(15,36,104,0.04)] backdrop-blur-md transition-all duration-200 hover:shadow-[0_16px_40px_rgba(15,36,104,0.08)]",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cpc-tile-border/50 bg-white/40 px-5 py-4 backdrop-blur-xs">
        <div className="min-w-0">
          <h2 className="font-poppins text-sm font-semibold text-cpc-navy-text">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-0.5 font-poppins text-[11px] leading-snug text-cpc-heading-soft">
              {subtitle}
            </p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div className={cn("flex flex-1 flex-col justify-between p-5", bodyClassName)}>
        {children}
      </div>
    </section>
  );
}
