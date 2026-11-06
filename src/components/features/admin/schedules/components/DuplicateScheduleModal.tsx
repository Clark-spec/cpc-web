import { useMemo, useState } from "react";
import { Copy, AlertTriangle } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/cn";
import { useScheduleAdmin } from "../context/ScheduleAdminContext";
import type { DuplicateMode, SectionId } from "../types";
import { BTN_NEUTRAL, BTN_PRIMARY, HINT_TEXT_BASE, LABEL_BASE } from "../utils/formStyles";

const MODES: { value: DuplicateMode; label: string; hint: string }[] = [
  {
    value: "replace",
    label: "Replace the target's classes",
    hint: "The target section ends up with exactly this list.",
  },
  {
    value: "merge",
    label: "Add to the target",
    hint: "The target keeps what it already has and gains these classes.",
  },
];

type DuplicateScheduleModalProps = {
  open: boolean;
  onClose: () => void;
  /** The section the list is copied from — the one the page is looking at. */
  source: SectionId;
};

/**
 * Copy one section's timetable onto another (spec §10).
 *
 * The two switches that decide the blast radius are kept in the open instead
 * of hidden behind a default: `mode` says whether the target's own classes
 * survive, and the keep-instructors / keep-rooms pair says whether the copy
 * drags people and doors along or only the shape of the week. A fresh section
 * usually wants the shape; a section swapping its adviser usually wants the
 * shape plus the rooms and its own teachers.
 *
 * Only sections the signed-in staff member may edit are offered as targets, so
 * a registrar's copy never lands on a block the dean has locked.
 */
export function DuplicateScheduleModal({ open, onClose, source }: DuplicateScheduleModalProps) {
  const { canEditSection, duplicateSection, entriesBySection, sectionsForRole } =
    useScheduleAdmin();

  const [targets, setTargets] = useState<SectionId[]>([]);
  const [mode, setMode] = useState<DuplicateMode>("replace");
  const [keepInstructors, setKeepInstructors] = useState(true);
  const [keepRooms, setKeepRooms] = useState(true);
  const [busy, setBusy] = useState(false);

  const sourceCount = entriesBySection(source).length;
  const choices = useMemo(
    () => sectionsForRole.filter((item) => item !== source && canEditSection(item)),
    [canEditSection, sectionsForRole, source],
  );

  /** Targets that are not empty, and so stand to lose rows under "replace". */
  const overwritten = targets.filter((section) => entriesBySection(section).length > 0);

  const toggle = (section: SectionId) =>
    setTargets((current) =>
      current.includes(section)
        ? current.filter((item) => item !== section)
        : [...current, section].sort(),
    );

  const run = async () => {
    setBusy(true);
    await duplicateSection(source, { targetSections: targets, mode, keepInstructors, keepRooms });
    setBusy(false);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} labelledBy="duplicate-title" className="sm:max-w-xl">
      <div className="p-5 sm:p-6">
        <h2
          id="duplicate-title"
          className="flex items-center gap-2 font-poppins text-base font-bold text-cpc-navy-text"
        >
          <Copy className="h-4 w-4 shrink-0 text-cpc-blue-accent" aria-hidden />
          Duplicate {source}
        </h2>
        <p className="mt-1 font-poppins text-xs text-cpc-heading-soft">
          {sourceCount} {sourceCount === 1 ? "class" : "classes"} will be copied. The copy only
          touches the draft — students keep seeing the published version until someone publishes.
        </p>

        <div className="mt-4">
          <span className={LABEL_BASE} id="duplicate-targets-label">
            Copy into
          </span>
          {choices.length === 0 ? (
            <p className={HINT_TEXT_BASE}>
              No other section is open for editing under your role.
            </p>
          ) : (
            <div
              role="group"
              aria-labelledby="duplicate-targets-label"
              className="flex flex-wrap gap-2"
            >
              {choices.map((section) => {
                const selected = targets.includes(section);
                const existing = entriesBySection(section).length;
                return (
                  <button
                    key={section}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggle(section)}
                    className={cn(
                      "inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-2 font-poppins text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent",
                      selected
                        ? "border-cpc-blue-accent bg-cpc-blue-accent text-white"
                        : "border-cpc-input-border bg-white text-cpc-navy-text hover:bg-cpc-section-light",
                    )}
                  >
                    {section}
                    <span
                      className={cn(
                        "font-poppins text-[10px] font-bold tabular-nums",
                        selected ? "text-white/80" : "text-cpc-heading-soft",
                      )}
                    >
                      {existing} now
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <fieldset className="mt-4 border-0 p-0">
          <legend className={LABEL_BASE}>What happens to the target</legend>
          <div className="space-y-2">
            {MODES.map((option) => (
              <label
                key={option.value}
                className={cn(
                  "flex cursor-pointer items-start gap-2 rounded-lg border border-cpc-input-border bg-white px-3 py-2 transition-colors hover:bg-cpc-section-light focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-cpc-blue-accent",
                )}
              >
                <input
                  type="radio"
                  name="duplicate-mode"
                  value={option.value}
                  checked={mode === option.value}
                  onChange={() => setMode(option.value)}
                  className="mt-0.5 h-3.5 w-3.5 cursor-pointer accent-cpc-blue-accent"
                />
                <span className="min-w-0">
                  <span className="block font-poppins text-xs font-semibold text-cpc-navy-text">
                    {option.label}
                  </span>
                  <span className="block font-poppins text-[11px] text-cpc-heading-soft">
                    {option.hint}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="mt-4 space-y-2">
          <label className="flex cursor-pointer items-center gap-2 font-poppins text-xs text-cpc-navy-text">
            <input
              type="checkbox"
              checked={keepInstructors}
              onChange={(event) => setKeepInstructors(event.target.checked)}
              className="h-3.5 w-3.5 cursor-pointer accent-cpc-blue-accent"
            />
            Keep the same teachers
          </label>
          <label className="flex cursor-pointer items-center gap-2 font-poppins text-xs text-cpc-navy-text">
            <input
              type="checkbox"
              checked={keepRooms}
              onChange={(event) => setKeepRooms(event.target.checked)}
              className="h-3.5 w-3.5 cursor-pointer accent-cpc-blue-accent"
            />
            Keep the same rooms
          </label>
          {!keepInstructors && (
            <p className={HINT_TEXT_BASE}>
              Teachers are left blank so each section can be filled in afterwards.
            </p>
          )}
        </div>

        {mode === "replace" && overwritten.length > 0 && (
          <p className="mt-3 flex items-start gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 font-poppins text-[11px] font-semibold text-rose-700">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            {overwritten.join(", ")}{" "}
            {overwritten.length === 1 ? "loses" : "lose"} their current classes.
          </p>
        )}

        <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
          <button type="button" onClick={onClose} className={BTN_NEUTRAL}>
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void run()}
            disabled={busy || targets.length === 0 || sourceCount === 0}
            className={BTN_PRIMARY}
          >
            {busy ? "Copying…" : `Copy to ${targets.length} section${targets.length === 1 ? "" : "s"}`}
          </button>
        </div>
      </div>
    </Modal>
  );
}
