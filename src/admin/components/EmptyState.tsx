import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 px-6 py-10 text-center",
        className,
      )}
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-cpc-section-light text-cpc-blue-accent">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <p className="font-poppins text-sm font-semibold text-cpc-navy-text">{title}</p>
      {description && (
        <p className="max-w-sm font-poppins text-xs leading-relaxed text-cpc-heading-soft">
          {description}
        </p>
      )}
      {action}
    </div>
  );
}
