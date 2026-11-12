/**
 * Shared field styling for the admin schedule forms.
 *
 * The toolbar, the entry form, the master-data forms and the CSV import all
 * draw the same control, so the strings live once here: a field that looks
 * different somewhere is a bug, not a design.
 */
import { cn } from "@/lib/cn";

export const FIELD_BASE =
  "w-full rounded-lg border border-cpc-input-border bg-white px-3 py-2 font-poppins text-xs text-cpc-navy-text placeholder:text-cpc-placeholder transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent";

export const LABEL_BASE =
  "mb-1 block font-poppins text-[10px] font-bold tracking-[0.12em] text-cpc-heading-soft uppercase";

export const SELECT_BASE = cn(FIELD_BASE, "cursor-pointer");

/** What a rejected value looks like: a ring as well as a sentence. */
export const INVALID_BASE = "border-rose-400 ring-1 ring-rose-200";

export const ERROR_TEXT_BASE =
  "mt-1 font-poppins text-[11px] font-semibold text-rose-700";

export const HINT_TEXT_BASE = "mt-1 font-poppins text-[11px] text-cpc-heading-soft";

export const DISABLED_BASE = "disabled:cursor-not-allowed disabled:opacity-60";

/** The schedule module's button scale: compact so a toolbar row never grows. */
export const BTN = "cpc-btn cpc-btn-sm";

export const BTN_PRIMARY = `${BTN} cpc-btn-primary`;

export const BTN_ROSE = `${BTN} bg-rose-50 text-rose-700 hover:bg-rose-100`;

export const BTN_NEUTRAL = `${BTN} cpc-btn-secondary`;
