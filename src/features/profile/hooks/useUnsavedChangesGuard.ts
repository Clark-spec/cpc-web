import { useEffect } from "react";
import { useBlocker, type Blocker } from "react-router";

/**
 * Warns before losing unsaved profile edits:
 * - browser refresh / tab close -> native `beforeunload` prompt
 * - in-app navigation -> React Router blocker (the page renders a ConfirmDialog
 *   when `blocker.state === "blocked"`)
 *
 * Requires a data router (`createBrowserRouter` + `<RouterProvider>`), which
 * the app uses in `main.tsx`.
 */
export function useUnsavedChangesGuard(active: boolean): Blocker {
  useEffect(() => {
    if (!active) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // Chrome requires returnValue to be set for the prompt to appear.
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [active]);

  return useBlocker(
    ({ currentLocation, nextLocation }) =>
      active && currentLocation.pathname !== nextLocation.pathname,
  );
}
