/**
 * One pastel palette per subject. The backgrounds stay light and every block
 * uses `text-cpc-navy-text`, which keeps the event text at WCAG AA contrast.
 * The legend reads from the same map, so calendar and legend never drift apart.
 */
export type SubjectColor = {
  key: string;
  /** Block surface + border tint. */
  block: string;
  /** 4px left accent bar. */
  accent: string;
  /** Legend / modal dot. */
  dot: string;
  /** Idle legend chip. */
  chip: string;
  /** Legend chip while this subject is the active filter. */
  chipActive: string;
};

const palette: Record<string, SubjectColor> = {
  blue: {
    key: "blue",
    block: "border-blue-200 bg-blue-50 text-cpc-navy-text",
    accent: "border-l-blue-500",
    dot: "bg-blue-500",
    chip: "border-blue-200 bg-white hover:bg-blue-50",
    chipActive: "border-blue-500 bg-blue-50 ring-2 ring-blue-200",
  },
  emerald: {
    key: "emerald",
    block: "border-emerald-200 bg-emerald-50 text-cpc-navy-text",
    accent: "border-l-emerald-500",
    dot: "bg-emerald-500",
    chip: "border-emerald-200 bg-white hover:bg-emerald-50",
    chipActive: "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200",
  },
  violet: {
    key: "violet",
    block: "border-violet-200 bg-violet-50 text-cpc-navy-text",
    accent: "border-l-violet-500",
    dot: "bg-violet-500",
    chip: "border-violet-200 bg-white hover:bg-violet-50",
    chipActive: "border-violet-500 bg-violet-50 ring-2 ring-violet-200",
  },
  amber: {
    key: "amber",
    block: "border-amber-200 bg-amber-50 text-cpc-navy-text",
    accent: "border-l-amber-500",
    dot: "bg-amber-500",
    chip: "border-amber-200 bg-white hover:bg-amber-50",
    chipActive: "border-amber-500 bg-amber-50 ring-2 ring-amber-200",
  },
  rose: {
    key: "rose",
    block: "border-rose-200 bg-rose-50 text-cpc-navy-text",
    accent: "border-l-rose-500",
    dot: "bg-rose-500",
    chip: "border-rose-200 bg-white hover:bg-rose-50",
    chipActive: "border-rose-500 bg-rose-50 ring-2 ring-rose-200",
  },
  sky: {
    key: "sky",
    block: "border-sky-200 bg-sky-50 text-cpc-navy-text",
    accent: "border-l-sky-500",
    dot: "bg-sky-500",
    chip: "border-sky-200 bg-white hover:bg-sky-50",
    chipActive: "border-sky-500 bg-sky-50 ring-2 ring-sky-200",
  },
  teal: {
    key: "teal",
    block: "border-teal-200 bg-teal-50 text-cpc-navy-text",
    accent: "border-l-teal-500",
    dot: "bg-teal-500",
    chip: "border-teal-200 bg-white hover:bg-teal-50",
    chipActive: "border-teal-500 bg-teal-50 ring-2 ring-teal-200",
  },
  orange: {
    key: "orange",
    block: "border-orange-200 bg-orange-50 text-cpc-navy-text",
    accent: "border-l-orange-500",
    dot: "bg-orange-500",
    chip: "border-orange-200 bg-white hover:bg-orange-50",
    chipActive: "border-orange-500 bg-orange-50 ring-2 ring-orange-200",
  },
  indigo: {
    key: "indigo",
    block: "border-indigo-200 bg-indigo-50 text-cpc-navy-text",
    accent: "border-l-indigo-500",
    dot: "bg-indigo-500",
    chip: "border-indigo-200 bg-white hover:bg-indigo-50",
    chipActive: "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200",
  },
};

export function getSubjectColor(colorKey: string): SubjectColor {
  return palette[colorKey] ?? palette.blue;
}

export const SUBJECT_COLOR_KEYS = Object.keys(palette);
