import { useCallback, useMemo } from "react";
import type { DraftSchedule, PublishedSchedule, SectionPublishDiff } from "@/types/scheduleAdmin";
import type { SectionId } from "@/types/schedule";
import { diffPublishedAgainstDraft } from "@/services/scheduleAdmin";

export type ScheduleDraftState = {
  /** How many entries differ from the published copy — the "Unpublished changes (5)" number. */
  dirtyCount: number;
  dirty: boolean;
  diff: SectionPublishDiff[];
  changedSections: SectionId[];
  /** The published version this draft is measured against. */
  baseVersion: number;
};

/**
 * Draft state is derived, never stored: the count and the diff always come from
 * comparing the draft with PUBLISHED, so a change made in another tab cannot
 * leave this tab showing a stale "3 unpublished changes".
 */
export function useScheduleDraft(
  draft: DraftSchedule,
  published: PublishedSchedule,
): ScheduleDraftState {
  const diff = useMemo(() => diffPublishedAgainstDraft(published, draft), [published, draft]);

  return useMemo(() => {
    const dirtyCount = diff.reduce(
      (total, section) => total + section.added.length + section.edited.length + section.removed.length,
      0,
    );
    return {
      dirtyCount,
      dirty: dirtyCount > 0,
      diff,
      changedSections: diff.map((section) => section.section),
      baseVersion: draft.baseVersion,
    };
  }, [diff, draft.baseVersion]);
}

/** Kept for the router blocker and `beforeunload`, which only need a yes/no. */
export function useUnsavedGuard(state: ScheduleDraftState): {
  warnOnLeave: (event: BeforeUnloadEvent) => void;
  message: string;
} {
  const warnOnLeave = useCallback(
    (event: BeforeUnloadEvent) => {
      if (!state.dirty) return;
      event.preventDefault();
      event.returnValue = "";
    },
    [state.dirty],
  );

  // Memoised because the provider keeps this object in its context value: an
  // unmemoised return would re-render every consumer on every parent render.
  return useMemo(
    () => ({
      warnOnLeave,
      message: state.dirty
        ? `You have ${state.dirtyCount} unpublished ${
            state.dirtyCount === 1 ? "change" : "changes"
          }. Publish or discard before leaving.`
        : "",
    }),
    [state.dirty, state.dirtyCount, warnOnLeave],
  );
}
