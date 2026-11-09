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

/** White dashboard card with the shared 10px radius, border and header. */
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
        "overflow-hidden rounded-[10px] border border-admin-border bg-admin-card shadow-[0_2px_12px_rgba(24,52,111,0.04)]",
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2 px-4 pt-3.5 pb-3">
        <div className="min-w-0">
          <h2 className="font-poppins text-[15px] leading-tight font-semibold text-admin-text">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-0.5 font-poppins text-[11px] leading-snug text-admin-muted">
              {subtitle}
            </p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div className={cn("px-4 pb-4", bodyClassName)}>{children}</div>
    </section>
  );
}
