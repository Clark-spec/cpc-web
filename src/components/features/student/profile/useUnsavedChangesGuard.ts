import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Shape of the object returned by this hook — mirrors the subset of
 * React Router's `Blocker` interface that `ProfileDialogs` consumes.
 */
export type UnsavedChangesBlocker = {
  state: "blocked" | "unblocked";
  reset: () => void;
  proceed: () => void;
};

/**
 * Warns before losing unsaved profile edits:
 * - browser refresh / tab close  → native `beforeunload` prompt
 * - in-app navigation            → intercepts `history.pushState` /
 *   `history.replaceState` and the `popstate` event, then shows a
 *   ConfirmDialog via the returned blocker object.
 *
 * This implementation does NOT use React Router's `useBlocker` because the
 * app mixes a data router (outer wildcard) with nested JSX `<Routes>` — a
 * hybrid that makes `useBlocker` unable to resolve the current route ID and
 * causes an infinite render loop.  Intercepting the History API directly
 * works in any router setup and produces identical UX.
 */
export function useUnsavedChangesGuard(active: boolean): UnsavedChangesBlocker {
  const [blockerState, setBlockerState] = useState<"blocked" | "unblocked">(
    "unblocked",
  );

  // Pending navigation captured while the dialog is open.
  const pendingNav = useRef<(() => void) | null>(null);

  // ── beforeunload (refresh / tab-close) ───────────────────────────────────
  useEffect(() => {
    if (!active) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [active]);

  // ── history.pushState / replaceState patch ───────────────────────────────
  useEffect(() => {
    if (!active) return;

    const originalPush = history.pushState.bind(history);
    const originalReplace = history.replaceState.bind(history);

    const intercept =
      (original: typeof history.pushState) =>
      (data: unknown, unused: string, url?: string | URL | null) => {
        const next = url ? new URL(String(url), location.href).pathname : null;
        if (next && next !== location.pathname) {
          // Block and remember what to do if the user confirms.
          pendingNav.current = () => original(data, unused, url);
          setBlockerState("blocked");
        } else {
          original(data, unused, url);
        }
      };

    history.pushState = intercept(originalPush);
    history.replaceState = intercept(originalReplace);

    return () => {
      history.pushState = originalPush;
      history.replaceState = originalReplace;
    };
  }, [active]);

  // ── popstate (browser back / forward) ───────────────────────────────────
  useEffect(() => {
    if (!active) return;

    const handlePopState = (event: PopStateEvent) => {
      // Re-push the current entry so we stay on this page while the dialog
      // is open, then let proceed() actually go back/forward.
      const currentState = event.state;
      history.pushState(currentState, "");
      pendingNav.current = () => history.go(-1);
      setBlockerState("blocked");
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [active]);

  // ── Reset blocker when guard becomes inactive ────────────────────────────
  useEffect(() => {
    if (!active) {
      pendingNav.current = null;
      setBlockerState("unblocked");
    }
  }, [active]);

  const reset = useCallback(() => {
    pendingNav.current = null;
    setBlockerState("unblocked");
  }, []);

  const proceed = useCallback(() => {
    const nav = pendingNav.current;
    pendingNav.current = null;
    setBlockerState("unblocked");
    nav?.();
  }, []);

  return { state: blockerState, reset, proceed };
}
