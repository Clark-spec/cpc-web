import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import { ArrowLeft, Check, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  groupSections,
  parseSectionId,
  YEAR_LEVEL_LABELS,
  type ProgramId,
  type YearLevel,
} from "@/services/scheduleStudent/mockSchedules";
import type { SectionId } from "@/types/schedule";

export type SectionCascadeSelectProps = {
  value: SectionId | "all";
  onChange: (value: SectionId | "all") => void;
  sections: SectionId[];
  /** Adds the pinned "All sections" choice at the department level. */
  showAll?: boolean;
  allLabel?: string;
  /** Highlights the student's own section in the final level. */
  mySection?: SectionId;
  /** Extra badge content, e.g. class count or conflicts in the admin portal. */
  optionMeta?: (value: SectionId | "all") => ReactNode;
  ariaLabel?: string;
  className?: string;
  menuClassName?: string;
};

type MenuLevel = "program" | "year" | "section";

type MenuItem = {
  id: string;
  label: string;
  kind: "all" | "program" | "year" | "section";
  section?: SectionId;
};

/**
 * Shared department → year level → section picker. The trigger still shows
 * the full section id; only the menu is arranged as a drill-down.
 */
export function SectionCascadeSelect({
  value,
  onChange,
  sections,
  showAll = false,
  allLabel = "All sections",
  mySection,
  optionMeta,
  ariaLabel,
  className,
  menuClassName,
}: SectionCascadeSelectProps) {
  const groups = useMemo(() => groupSections(sections), [sections]);
  const parsedValue = useMemo(() => parseSectionId(value), [value]);

  const [open, setOpen] = useState(false);
  const [level, setLevel] = useState<MenuLevel>("program");
  const [program, setProgram] = useState<ProgramId | null>(parsedValue?.program ?? null);
  const [year, setYear] = useState<YearLevel | null>(parsedValue?.year ?? null);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);
  const baseId = useId();
  const triggerId = `${baseId}-trigger`;
  const listboxId = `${baseId}-listbox`;
  const optionId = (id: string) => `${listboxId}-option-${id}`;

  const currentGroup = useMemo(
    () => groups.find((group) => group.program === program) ?? null,
    [groups, program],
  );
  const currentYear = useMemo(
    () => currentGroup?.years.find((item) => item.year === year) ?? null,
    [currentGroup, year],
  );

  const items = useMemo<MenuItem[]>(() => {
    const allItems: MenuItem[] = showAll ? [{ id: "all", label: allLabel, kind: "all" }] : [];

    if (level === "program") {
      return [
        ...allItems,
        ...groups.map((group) => ({
          id: group.program,
          label: group.program,
          kind: "program" as const,
        })),
      ];
    }
    if (level === "year") {
      return (
        currentGroup?.years.map((item) => ({
          id: String(item.year),
          label: YEAR_LEVEL_LABELS[item.year],
          kind: "year" as const,
        })) ?? []
      );
    }
    return (
      currentYear?.sections.map((section) => ({
        id: section,
        label: section.split("-")[1] ?? section,
        kind: "section" as const,
        section,
      })) ?? []
    );
  }, [showAll, allLabel, level, groups, currentGroup, currentYear]);

  useEffect(() => {
    if (open) listRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (activeIndex >= items.length) setActiveIndex(0);
  }, [activeIndex, items.length]);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  function closeAndReturnFocus() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  function openMenu() {
    const parsed = parseSectionId(value);
    const initialProgram = parsed?.program ?? groups[0]?.program ?? null;
    setProgram(initialProgram);
    setYear(parsed?.year ?? null);
    setLevel("program");
    setActiveIndex(
      value === "all"
        ? 0
        : Math.max(0, groups.findIndex((group) => group.program === initialProgram) + (showAll ? 1 : 0)),
    );
    setOpen(true);
  }

  function select(next: SectionId | "all") {
    onChange(next);
    closeAndReturnFocus();
  }

  function goBack() {
    if (level === "section") {
      setLevel("year");
      setActiveIndex(Math.max(0, currentGroup?.years.findIndex((item) => item.year === year) ?? 0));
      return;
    }
    if (level === "year") {
      setLevel("program");
      setActiveIndex(
        Math.max(0, groups.findIndex((group) => group.program === program) + (showAll ? 1 : 0)),
      );
    }
  }

  function activate(index: number) {
    const item = items[index];
    if (!item) return;

    if (item.kind === "all") {
      select("all");
      return;
    }

    if (item.kind === "program") {
      const nextProgram = item.id as ProgramId;
      const group = groups.find((entry) => entry.program === nextProgram);
      setProgram(nextProgram);
      setLevel("year");
      setActiveIndex(Math.max(0, group?.years.findIndex((entry) => entry.year === parsedValue?.year) ?? 0));
      return;
    }

    if (item.kind === "year") {
      const nextYear = Number(item.id) as YearLevel;
      const group = groups.find((entry) => entry.program === program);
      const sectionsForYear = group?.years.find((entry) => entry.year === nextYear)?.sections ?? [];
      setYear(nextYear);
      setLevel("section");
      setActiveIndex(Math.max(0, sectionsForYear.indexOf(value as SectionId)));
      return;
    }

    if (item.section) select(item.section);
  }

  function handleTriggerKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      openMenu();
    }
  }

  function handleListKeyDown(event: ReactKeyboardEvent<HTMLUListElement>) {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        if (items.length > 0) setActiveIndex((current) => (current + 1) % items.length);
        break;
      case "ArrowUp":
        event.preventDefault();
        if (items.length > 0) setActiveIndex((current) => (current - 1 + items.length) % items.length);
        break;
      case "Home":
        event.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        event.preventDefault();
        setActiveIndex(items.length - 1);
        break;
      case "ArrowRight":
        event.preventDefault();
        if (level !== "section") activate(activeIndex);
        break;
      case "ArrowLeft":
      case "Backspace":
        if (level !== "program") {
          event.preventDefault();
          goBack();
        }
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        activate(activeIndex);
        break;
      case "Escape":
        event.preventDefault();
        if (level === "program") closeAndReturnFocus();
        else goBack();
        break;
      case "Tab":
        setOpen(false);
        break;
      default:
        break;
    }
  }

  return (
    <div ref={containerRef} className={cn("relative w-full sm:w-auto", className)}>
      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => (open ? closeAndReturnFocus() : openMenu())}
        onKeyDown={handleTriggerKeyDown}
        className={cn(
          "flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl border bg-white px-3.5 py-2 font-poppins text-xs font-semibold text-cpc-navy-text shadow-sm transition-all sm:min-w-[200px]",
          open
            ? "border-cpc-blue-accent ring-2 ring-cpc-blue-accent/20"
            : "border-cpc-input-border hover:border-cpc-blue-accent/40",
        )}
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate">{value === "all" ? allLabel : value}</span>
          {value === mySection && (
            <span className="rounded-full bg-cpc-section-light px-2 py-0.5 text-[10px] font-semibold text-cpc-blue-accent">
              My section
            </span>
          )}
          {optionMeta?.(value)}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-cpc-heading-soft transition-transform duration-200",
            open && "rotate-180 text-cpc-blue-accent",
          )}
          aria-hidden
        />
      </button>

      {open && (
        <div
          className={cn(
            "absolute top-full right-0 z-40 mt-1.5 w-full min-w-[210px] rounded-xl border border-cpc-input-border bg-white p-1 shadow-[0_18px_40px_rgba(27,47,158,0.18)] sm:w-64",
            menuClassName,
          )}
        >
          {level !== "program" && (
            <div className="mb-1 flex items-center gap-2 border-b border-cpc-input-border/60 px-2 py-1.5">
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={goBack}
                className="inline-flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 font-poppins text-[11px] font-semibold text-cpc-blue-accent transition-colors hover:bg-cpc-section-light focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-cpc-blue-accent"
              >
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
                Back
              </button>
              <span className="truncate font-poppins text-[11px] font-semibold text-cpc-heading-soft">
                {level === "section"
                  ? `${program}${year ? ` · ${YEAR_LEVEL_LABELS[year]}` : ""}`
                  : program}
              </span>
            </div>
          )}

          <ul
            ref={listRef}
            id={listboxId}
            role="listbox"
            aria-labelledby={triggerId}
            aria-activedescendant={items[activeIndex] ? optionId(items[activeIndex].id) : undefined}
            tabIndex={-1}
            onKeyDown={handleListKeyDown}
            className="max-h-60 overflow-y-auto outline-none"
          >
            {items.map((item, index) => {
              const active = index === activeIndex;
              const selected =
                (item.kind === "all" && value === "all") ||
                (item.kind === "section" && item.section === value);
              return (
                <li
                  key={item.id}
                  id={optionId(item.id)}
                  role="option"
                  aria-selected={selected}
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => activate(index)}
                  className={cn(
                    "flex cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2 font-poppins text-sm transition-colors",
                    active ? "bg-cpc-section-light text-cpc-blue-accent" : "text-cpc-navy-text",
                  )}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="truncate">{item.label}</span>
                    {item.kind === "section" && item.section === mySection && (
                      <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-cpc-blue-accent shadow-xs">
                        My section
                      </span>
                    )}
                    {(item.kind === "all" || item.kind === "section") &&
                      optionMeta?.(item.kind === "all" ? "all" : (item.section as SectionId))}
                  </span>
                  {level === "section" || item.kind === "all" ? (
                    selected && <Check className="h-4 w-4 shrink-0 text-cpc-blue-accent" aria-hidden />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 text-cpc-heading-soft/60" aria-hidden />
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
