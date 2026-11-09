import { useCallback, useRef, useState } from "react";
import type { DayCode, ScheduleEntry, SectionId } from "@/types/schedule";
import { ErrorCard } from "@/components/common/feedback/ErrorCard";
import { DAY_END_MIN } from "@/lib/scheduleTime";
import { useScheduleAdmin } from "@/components/features/admin/schedules/ScheduleAdminContext";
import type { EntryFormValues } from "@/components/features/admin/schedules/types";
import { ConflictPanel } from "@/components/features/admin/schedules/ConflictPanel";
import { DuplicateScheduleModal } from "@/components/features/admin/schedules/DuplicateScheduleModal";
import { EntryFormModal } from "@/components/features/admin/schedules/EntryFormModal";
import { PublishStatusBar } from "@/components/features/admin/schedules/PublishStatusBar";
import { ScheduleBanner } from "@/components/features/admin/schedules/ScheduleBanner";
import { ScheduleGridEditor } from "@/components/features/admin/schedules/ScheduleGridEditor";
import { ScheduleKpiStrip } from "@/components/features/admin/schedules/ScheduleKpiStrip";
import { ScheduleTable } from "@/components/features/admin/schedules/ScheduleTable";
import { ScheduleToolbar } from "@/components/features/admin/schedules/ScheduleToolbar";

/** How much of the day a click on empty canvas reserves before the form opens. */
const NEW_CLASS_MIN = 60;

type FormState = {
  open: boolean;
  /** `null` is a new class; an id is that row. */
  entryId: string | null;
  /** What the click left behind: a day and a half hour, sometimes both. */
  preset?: Partial<EntryFormValues>;
};

/**
 * The staff Class Schedules page.
 *
 * (1) Nothing here owns data. The banner, the status bar, the KPI strip and the
 * list all read the same context, so one draft edit repaints every part of the
 * page at once, and a publish in another tab arrives through the same path.
 * (2) The page keeps no scroll-position hacks or local copies of the filters:
 * the section, view and filters live in the URL, so this component is a pure
 * function of the store plus the address bar.
 */
export function ScheduleWorkspace() {
  const { error, reload, section, sectionsForRole, selectEntry, view } = useScheduleAdmin();
  const searchRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<FormState>({ open: false, entryId: null });
  const [duplicateSource, setDuplicateSource] = useState<SectionId | null>(null);

  /* "All sections" gives no single home for a new class, so it falls back to
   * the first section this role owns — the same rule the grid canvas uses. */
  const defaultSection: SectionId = section === "all" ? sectionsForRole[0] : section;

  const openEntry = useCallback(
    (entry: ScheduleEntry) => {
      selectEntry(entry.id);
      setForm({ open: true, entryId: entry.id });
    },
    [selectEntry],
  );

  const openEntryById = useCallback(
    (entryId: string) => {
      selectEntry(entryId);
      setForm({ open: true, entryId });
    },
    [selectEntry],
  );

  /** A toolbar click opens a blank row; a click on the grid opens a filled one. */
  const openNewClass = useCallback(
    (slot?: { day: DayCode; startMin: number; section: SectionId }) => {
      setForm({
        open: true,
        entryId: null,
        preset:
          slot === undefined
            ? undefined
            : {
                section: slot.section,
                days: [slot.day],
                startMin: slot.startMin,
                endMin: Math.min(slot.startMin + NEW_CLASS_MIN, DAY_END_MIN),
              },
      });
    },
    [],
  );

  const closeForm = useCallback(() => setForm({ open: false, entryId: null }), []);

  if (error) {
    return (
      <div className="space-y-6">
        <ScheduleBanner />
        <ErrorCard message={error} onRetry={() => void reload()} />
      </div>
    );
  }

  return (
    <div className="relative space-y-6">
      {/* Ambient background glows — purely decorative, aria-hidden */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 -left-16 h-72 w-72 rounded-full bg-cpc-blue-accent/5 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/3 -right-16 h-64 w-64 rounded-full bg-cpc-navy/4 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-10 left-1/4 h-56 w-56 rounded-full bg-emerald-500/4 blur-3xl"
      />

      <ScheduleBanner />

      <PublishStatusBar />

      <ScheduleKpiStrip />

      {/* ScheduleToolbar now contains SectionTabs as its first row */}
      <ScheduleToolbar
        searchInputRef={searchRef}
        onNewClass={() => openNewClass()}
        onDuplicate={() => setDuplicateSource(defaultSection)}
      />

      {view === "grid" ? (
        <ScheduleGridEditor onOpenEntry={openEntry} onCreateAt={openNewClass} />
      ) : (
        <ScheduleTable onEdit={openEntryById} />
      )}

      <ConflictPanel />

      <EntryFormModal
        open={form.open}
        onClose={closeForm}
        entryId={form.entryId}
        preset={form.preset}
        defaultSection={defaultSection}
      />

      {duplicateSource !== null && (
        <DuplicateScheduleModal
          open
          onClose={() => setDuplicateSource(null)}
          source={duplicateSource}
        />
      )}
    </div>
  );
}
