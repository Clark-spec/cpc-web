import { useCallback, useState, type RefObject } from "react";
import { useToast } from "@/components/ui/toast";
import type { DayCode, ScheduleEntry, SectionId } from "@/types/schedule";
import type {
  DraftSchedule,
  DuplicateOptions,
  EntryPatch,
  ImportRowInput,
  Instructor,
  PublishOptions,
  PublishedSchedule,
  Room,
  ScheduleMasterData,
  Subject,
} from "@/types/scheduleAdmin";
import {
  bulkUpdate as bulkUpdateService,
  createSampleConflict,
  deleteEntry as deleteEntryService,
  diffPublishedAgainstDraft,
  discardDraft as discardDraftService,
  duplicateSection as duplicateSectionService,
  importRows as importRowsService,
  moveEntry as moveEntryService,
  publish as publishService,
  resetDemoData,
  restoreDraftSnapshot,
  restorePublishedSnapshot,
  restoreVersion as restoreVersionService,
  saveEntry as saveEntryService,
  saveInstructor as saveInstructorService,
  saveRoom as saveRoomService,
  saveSubject as saveSubjectService,
  type ScheduleSnapshot,
} from "@/services/scheduleAdmin";
import { entryFromFormValues } from "./entryForm";
import type { EntryFormValues } from "./types";
import type { UndoableStep } from "./useUndoAction";

type ScheduleMutationsProps = {
  actor: string;
  master: ScheduleMasterData;
  published: PublishedSchedule;
  draftRef: RefObject<DraftSchedule>;
  applyDraft: (next: DraftSchedule) => void;
  applyPublished: (next: PublishedSchedule) => void;
  armUndo: (step: UndoableStep) => void;
  load: (quiet?: boolean) => Promise<void>;
  setSnapshot: (snapshot: ScheduleSnapshot | null) => void;
  entriesBySection: (section: SectionId) => ScheduleEntry[];
  selectedEntryId: string | null;
  setSelectedEntryId: (id: string | null) => void;
};

export function useScheduleMutations({
  actor,
  master,
  published,
  draftRef,
  applyDraft,
  applyPublished,
  armUndo,
  load,
  setSnapshot,
  entriesBySection,
  selectedEntryId,
  setSelectedEntryId,
}: ScheduleMutationsProps) {
  const { toast } = useToast();
  const [publishing, setPublishing] = useState(false);

  const mutateDraft = useCallback(
    async (message: string, run: () => Promise<DraftSchedule>, sectionForUndo: SectionId) => {
      const before = draftRef.current;
      if (!before) return;
      try {
        const next = await run();
        applyDraft(next);
        armUndo({
          message,
          revert: async () => {
            applyDraft(
              restoreDraftSnapshot(before, {
                section: sectionForUndo,
                detail: "Undid the last schedule change.",
                actor,
              }),
            );
          },
        });
      } catch {
        toast("That change didn't save. Please try again.", "error");
      }
    },
    [actor, applyDraft, armUndo, draftRef, toast],
  );

  const saveEntryValues = useCallback(
    async (values: EntryFormValues, replaceId?: string) => {
      const targetSection = values.section;
      const entry = entryFromFormValues(
        values,
        master,
        targetSection,
        entriesBySection(targetSection),
        replaceId,
      );
      await mutateDraft(
        `${entry.subjectCode} ${replaceId === undefined ? "added" : "updated"} in ${targetSection}`,
        () => saveEntryService(entry, targetSection, actor),
        targetSection,
      );
    },
    [actor, entriesBySection, master, mutateDraft],
  );

  const deleteEntry = useCallback(
    async (entry: ScheduleEntry, targetSection: SectionId) => {
      await mutateDraft(
        `Removed ${entry.subjectCode} from ${targetSection}`,
        () => deleteEntryService(entry.id, actor),
        targetSection,
      );
      if (selectedEntryId === entry.id) setSelectedEntryId(null);
    },
    [actor, mutateDraft, selectedEntryId, setSelectedEntryId],
  );

  const moveEntry = useCallback(
    async (entryId: string, patch: { startMin: number; endMin: number; days?: DayCode[] }) => {
      try {
        applyDraft(await moveEntryService(entryId, patch, actor));
      } catch {
        toast("That move didn't save. Please try again.", "error");
      }
    },
    [actor, applyDraft, toast],
  );

  const quickEdit = useCallback(
    async (
      entry: ScheduleEntry,
      targetSection: SectionId,
      patch: EntryPatch,
      label: string,
    ) => {
      await mutateDraft(
        label,
        () => bulkUpdateService([entry.id], patch, actor, targetSection),
        targetSection,
      );
    },
    [actor, mutateDraft],
  );

  const toggleStatus = useCallback(
    async (entry: ScheduleEntry, targetSection: SectionId) => {
      const status = entry.status === "active" ? "not_active" : "active";
      await quickEdit(entry, targetSection, { status }, `${entry.subjectCode} set to ${
        status === "active" ? "Active" : "Not Active"
      }`);
    },
    [quickEdit],
  );

  const bulkUpdate = useCallback(
    async (ids: string[], patch: EntryPatch, targetSection: SectionId, label: string) => {
      await mutateDraft(label, () => bulkUpdateService(ids, patch, actor, targetSection), targetSection);
    },
    [actor, mutateDraft],
  );

  const bulkDelete = useCallback(
    async (ids: string[], targetSection: SectionId) => {
      const before = draftRef.current;
      if (!before) return;
      try {
        let next = before;
        for (const id of ids) {
          next = await deleteEntryService(id, actor);
        }
        applyDraft(next);
        armUndo({
          message: `Removed ${ids.length} ${ids.length === 1 ? "class" : "classes"} from ${targetSection}`,
          revert: async () => {
            applyDraft(
              restoreDraftSnapshot(before, {
                section: targetSection,
                detail: "Undid a bulk delete.",
                actor,
              }),
            );
          },
        });
        setSelectedEntryId(null);
      } catch {
        toast("That bulk delete didn't save.", "error");
      }
    },
    [actor, applyDraft, armUndo, draftRef, setSelectedEntryId, toast],
  );

  const duplicateSection = useCallback(
    async (source: SectionId, options: DuplicateOptions) => {
      await mutateDraft(
        `Copied ${source} to ${options.targetSections.join(", ")}`,
        () => duplicateSectionService(source, options, actor),
        source,
      );
    },
    [actor, mutateDraft],
  );

  const importRows = useCallback(
    async (rows: ImportRowInput[]) => {
      const before = draftRef.current;
      const outcome = await importRowsService(rows, actor);
      applyDraft(outcome.draft);
      const imported = outcome.results.filter((item) => item.verdict !== "error").length;
      if (before) {
        armUndo({
          message: `Imported ${imported} ${imported === 1 ? "row" : "rows"}`,
          revert: async () => {
            applyDraft(
              restoreDraftSnapshot(before, {
                section: before.schedules[0]?.section ?? "BSIT-3A",
                detail: "Undid a CSV import.",
                actor,
              }),
            );
          },
        });
      }
      return { results: outcome.results };
    },
    [actor, applyDraft, armUndo, draftRef],
  );

  const publish = useCallback(
    async (options: PublishOptions) => {
      setPublishing(true);
      const previousPublished = published;
      const previousDraft = draftRef.current;
      if (!previousDraft) {
        setPublishing(false);
        return;
      }
      try {
        const next = await publishService(options, actor);
        const diffs = diffPublishedAgainstDraft(previousPublished, previousDraft);
        applyPublished(next);
        applyDraft({ ...previousDraft, baseVersion: next.version });
        const undoSection = diffs[0]?.section ?? next.schedules[0]?.section ?? "BSIT-3A";
        toast(`Version ${next.version} published.`, "success", {
          label: "Undo",
          durationMs: 8000,
          onClick: () => {
            applyPublished(
              restorePublishedSnapshot(previousPublished, {
                section: undoSection,
                detail: `Undid the publish of version ${next.version}.`,
                actor,
              }),
            );
            toast(`Back to version ${previousPublished.version}.`, "info");
          },
        });
      } catch {
        toast("Publishing failed. Nothing was sent to students.", "error");
      } finally {
        setPublishing(false);
      }
    },
    [actor, applyDraft, applyPublished, draftRef, published, toast],
  );

  const discardDraft = useCallback(async () => {
    const before = draftRef.current;
    if (!before) return;
    const targetSection = before.schedules[0]?.section ?? "BSIT-3A";
    try {
      applyDraft(await discardDraftService(actor));
      armUndo({
        message: "Draft discarded.",
        tone: "warning",
        revert: async () => {
          applyDraft(
            restoreDraftSnapshot(before, {
              section: targetSection,
              detail: "Undid a draft discard.",
              actor,
            }),
          );
        },
      });
    } catch {
      toast("The draft could not be discarded.", "error");
    }
  }, [actor, applyDraft, armUndo, draftRef, toast]);

  const restoreVersion = useCallback(
    async (version: number) => {
      const next = await restoreVersionService(version, actor);
      applyPublished(next);
      toast(`Version ${version} restored, published as version ${next.version}.`, "success");
    },
    [actor, applyPublished, toast],
  );

  const saveSubject = useCallback(
    async (subject: Subject) => {
      await saveSubjectService(subject, actor);
      await load(true);
      toast(`Subject ${subject.code} saved.`, "success");
    },
    [actor, load, toast],
  );

  const saveInstructor = useCallback(
    async (instructor: Instructor) => {
      await saveInstructorService(instructor, actor);
      await load(true);
      toast(`Instructor ${instructor.displayName} saved.`, "success");
    },
    [actor, load, toast],
  );

  const saveRoom = useCallback(
    async (room: Room) => {
      await saveRoomService(room, actor);
      await load(true);
      toast(`Room ${room.name} saved.`, "success");
    },
    [actor, load, toast],
  );

  const runDemoConflict = useCallback(async () => {
    applyDraft(await createSampleConflict(actor));
    toast("Sample conflict created in BSIT-3B.", "warning");
  }, [actor, applyDraft, toast]);

  const resetDemo = useCallback(async () => {
    const next = await resetDemoData();
    setSnapshot(next);
    if (draftRef.current) {
      draftRef.current = next.draft;
    }
    toast("Demo schedule data reset to published v7.", "info");
  }, [draftRef, setSnapshot, toast]);

  return {
    publishing,
    saveEntryValues,
    deleteEntry,
    moveEntry,
    quickEdit,
    toggleStatus,
    bulkUpdate,
    bulkDelete,
    duplicateSection,
    importRows,
    publish,
    discardDraft,
    restoreVersion,
    saveSubject,
    saveInstructor,
    saveRoom,
    runDemoConflict,
    resetDemo,
  };
}
