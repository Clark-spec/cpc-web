import { cn } from "@/lib/cn";

/** Shared field, table and pagination styling for the Student Accounts pages. */
export const FIELD_BASE =
  "w-full rounded-lg border border-cpc-input-border bg-white px-3 py-2 font-poppins text-xs text-cpc-navy-text placeholder:text-cpc-placeholder transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent";

export const LABEL_BASE =
  "mb-1 block font-poppins text-[10px] font-bold tracking-[0.12em] text-cpc-heading-soft uppercase";

export const SELECT_BASE = cn(FIELD_BASE, "cursor-pointer disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-cpc-heading-soft");

export const CARD_SHELL =
  "rounded-2xl border border-cpc-tile-border/70 bg-white shadow-[0_18px_50px_rgba(15,36,104,0.22)]";

export const HEADER_CELL =
  "sticky top-0 z-10 bg-cpc-section-light px-3 py-2.5 text-left font-poppins text-[10px] font-bold tracking-[0.1em] text-cpc-heading-soft uppercase whitespace-nowrap";

export const CELL = "px-3 py-3 align-middle";

export const BTN =
  "inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3.5 py-2.5 font-poppins text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent disabled:cursor-not-allowed disabled:opacity-60";

export const NAV_BUTTON =
  "inline-flex cursor-pointer items-center gap-1 rounded-lg border border-cpc-tile-border bg-white px-2.5 py-1.5 font-poppins text-[11px] font-semibold text-cpc-navy-text transition-colors hover:bg-cpc-section-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent disabled:cursor-not-allowed disabled:opacity-40";

export const ROW_ACTION =
  "inline-flex cursor-pointer items-center gap-1 rounded-lg border border-cpc-tile-border bg-white px-2 py-1.5 font-poppins text-[11px] font-semibold text-cpc-blue-accent transition-colors hover:bg-cpc-section-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent disabled:cursor-not-allowed disabled:opacity-45";

export const PAGE_SIZES = [10, 25, 50];

export function initialsOf(name: string): string {
  return name
    .split(" ")
    .map((part) => part.charAt(0))
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** "1st Year · 1A" for the directory and correction tables. */
export function sectionText(year: number, section: string): string {
  const suffix = year === 1 ? "st" : year === 2 ? "nd" : year === 3 ? "rd" : "th";
  return `${year}${suffix} Year · ${section}`;
}

export function rangeOf(totalRows: number, page: number, pageSize: number): string {
  if (totalRows === 0) return "0";
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(totalRows, page * pageSize);
  return `${start}–${end}`;
}
