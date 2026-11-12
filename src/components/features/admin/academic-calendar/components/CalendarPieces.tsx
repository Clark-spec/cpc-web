/* eslint-disable react-refresh/only-export-components */
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { CalendarHeart } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  CATEGORY_META,
  STATUS_META,
  type AdminCalendarEvent,
  type EventCategory,
  type EventStatus,
} from "../data/academicCalendar";

/*
 * Shared form/button styling for the calendar modals and filters. Aligned to
 * the admin Clearance Requests design language: cpc palette, font-poppins,
 * text-xs controls, rounded-2xl cards and the shared badge sizing.
 */

export const fieldLabelClass =
  "mb-1 block font-poppins text-[10px] font-bold tracking-[0.12em] text-cpc-heading-soft uppercase";

export const inputClass =
  "w-full rounded-lg border border-cpc-input-border bg-white px-3 py-2 font-poppins text-xs text-cpc-navy-text placeholder:text-cpc-placeholder transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent";

export const textareaClass = `${inputClass} min-h-[76px] resize-y leading-relaxed`;

export function primaryButtonClass(extra?: string) {
  return cn(
    "inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-cpc-blue-accent bg-cpc-blue-accent px-3 py-2 font-poppins text-xs font-semibold whitespace-nowrap text-white transition-colors hover:bg-cpc-blue-accent/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent disabled:cursor-not-allowed disabled:opacity-60",
    extra,
  );
}

export function secondaryButtonClass(extra?: string) {
  return cn(
    "inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-cpc-tile-border bg-white px-3 py-2 font-poppins text-xs font-semibold whitespace-nowrap text-cpc-navy-text transition-colors hover:bg-cpc-section-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent disabled:cursor-not-allowed disabled:opacity-60",
    extra,
  );
}

export function ghostButtonClass(extra?: string) {
  return cn(
    "inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 font-poppins text-[11px] font-semibold text-cpc-blue-accent transition-colors hover:bg-cpc-section-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent",
    extra,
  );
}

/* -------------------------------------------------------------------------- */
/* Small display pieces                                                       */
/* -------------------------------------------------------------------------- */

export function CategoryBadge({
  category,
  compact = false,
  className,
}: {
  category: EventCategory;
  compact?: boolean;
  className?: string;
}) {
  const meta = CATEGORY_META[category];
  const Icon = meta.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-poppins text-[11px] leading-none font-semibold whitespace-nowrap",
        meta.badgeClass,
        className,
      )}
    >
      <Icon className="h-3 w-3 shrink-0" aria-hidden />
      {compact ? meta.shortLabel : meta.label}
    </span>
  );
}

export function StatusBadge({
  status,
  className,
}: {
  status: EventStatus;
  className?: string;
}) {
  const meta = STATUS_META[status];
  const Icon = meta.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-poppins text-[11px] leading-none font-semibold whitespace-nowrap",
        meta.badgeClass,
        className,
      )}
    >
      <Icon className="h-3 w-3 shrink-0" aria-hidden />
      {meta.label}
    </span>
  );
}

export function EventStatusDot({ status }: { status: EventStatus }) {
  return (
    <span
      className={cn("inline-block h-1.5 w-1.5 shrink-0 rounded-full", STATUS_META[status].dotClass)}
      title={STATUS_META[status].label}
      aria-label={STATUS_META[status].label}
    />
  );
}

export function SectionCard({
  id,
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
}: {
  id?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section
      id={id}
      className={cn(
        "scroll-mt-24 overflow-hidden rounded-2xl border border-white/80 bg-white/90 shadow-[0_8px_30px_rgb(15,36,104,0.05)] backdrop-blur-md",
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-cpc-input-border/60 bg-gradient-to-r from-cpc-section-light/70 to-white/60 px-4 py-3.5">
        <div className="min-w-0">
          <h2 className="font-poppins text-sm leading-tight font-bold text-cpc-navy-text">
            {title}
          </h2>
          {description && (
            <p className="mt-0.5 font-poppins text-[11px] leading-snug text-cpc-heading-soft">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-1.5">{actions}</div>}
      </div>
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

export function EventTypeIcon({ event, className }: { event: AdminCalendarEvent; className?: string }) {
  const meta = CATEGORY_META[event.category];
  const Icon = meta.icon;
  return (
    <span
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border",
        meta.softClass,
        meta.borderClass,
        meta.textClass,
        className,
      )}
      aria-hidden
    >
      <Icon className="h-4 w-4" />
    </span>
  );
}

export function CalendarEmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-5 py-10 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-cpc-section-light text-cpc-blue-accent">
        <CalendarHeart className="h-5 w-5" aria-hidden />
      </span>
      <p className="font-poppins text-sm font-semibold text-cpc-navy-text">{title}</p>
      {description && (
        <p className="max-w-xs font-poppins text-xs leading-relaxed text-cpc-heading-soft">
          {description}
        </p>
      )}
      {action}
    </div>
  );
}

export type ActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
};