import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { SECTION_IDS } from "@/services/scheduleStudent/mockSchedules";
import { useSchedule } from "@/components/features/student/schedules/useSchedule";
import type { SectionId } from "@/types/schedule";

type SectionSelectProps = {
  value: SectionId;
  onChange: (section: SectionId) => void;
};

/**
 * Accessible listbox for the student's sections.
 */
export function SectionSelect({ value, onChange }: SectionSelectProps) {
  const { mySection, sections: contextSections } = useSchedule();
  const sections = contextSections.length > 0 ? contextSections : SECTION_IDS;

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(() =>
    Math.max(0, sections.indexOf(value)),
  );
  const containerRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);
  const baseId = useId();
  const triggerId = `${baseId}-trigger`;
  const listboxId = `${baseId}-listbox`;
  const optionId = (section: SectionId) => `${listboxId}-option-${section}`;

  useEffect(() => {
    if (open) listRef.current?.focus();
  }, [open]);

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

  function openMenu(index = sections.indexOf(value)) {
    setActiveIndex(Math.max(0, index));
    setOpen(true);
  }

  function select(next: SectionId) {
    onChange(next);
    closeAndReturnFocus();
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
        setActiveIndex((current) => (current + 1) % sections.length);
        break;
      case "ArrowUp":
        event.preventDefault();
        setActiveIndex((current) => (current - 1 + sections.length) % sections.length);
        break;
      case "Home":
        event.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        event.preventDefault();
        setActiveIndex(sections.length - 1);
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        select(sections[activeIndex]);
        break;
      case "Escape":
        event.preventDefault();
        closeAndReturnFocus();
        break;
      case "Tab":
        setOpen(false);
        break;
      default:
        break;
    }
  }

  return (
    <div ref={containerRef} className="relative w-full sm:w-auto">
      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={handleTriggerKeyDown}
        className={cn(
          "flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl border bg-white px-3.5 py-2 font-poppins text-xs font-semibold text-cpc-navy-text shadow-sm transition-all sm:min-w-[200px]",
          open
            ? "border-cpc-blue-accent ring-2 ring-cpc-blue-accent/20"
            : "border-cpc-input-border hover:border-cpc-blue-accent/40",
        )}
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate">{value}</span>
          {value === mySection && (
            <span className="rounded-full bg-cpc-section-light px-2 py-0.5 text-[10px] font-semibold text-cpc-blue-accent">
              My section
            </span>
          )}
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
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          aria-labelledby={triggerId}
          aria-activedescendant={optionId(sections[activeIndex])}
          tabIndex={-1}
          onKeyDown={handleListKeyDown}
          className="absolute top-full right-0 z-40 mt-1.5 max-h-64 w-full min-w-[210px] overflow-y-auto rounded-xl border border-cpc-input-border bg-white p-1 shadow-[0_18px_40px_rgba(27,47,158,0.18)] outline-none sm:w-64"
        >
          {sections.map((section, index) => {
            const selected = section === value;
            const active = index === activeIndex;
            return (
              <li
                key={section}
                id={optionId(section)}
                role="option"
                aria-selected={selected}
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => select(section)}
                className={cn(
                  "flex cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2 font-poppins text-sm transition-colors",
                  active ? "bg-cpc-section-light text-cpc-blue-accent" : "text-cpc-navy-text",
                )}
              >
                <span className="flex items-center gap-2">
                  {section}
                  {section === mySection && (
                    <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-cpc-blue-accent shadow-xs">
                      My section
                    </span>
                  )}
                </span>
                {selected && <Check className="h-4 w-4 shrink-0 text-cpc-blue-accent" aria-hidden />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
