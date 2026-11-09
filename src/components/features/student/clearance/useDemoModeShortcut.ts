import { useEffect } from "react";
import { useClearance } from "@/components/features/student/clearance/ClearanceContext";

/** Registers Ctrl/Cmd + Shift + D as the demo-mode toggle. */
export function useDemoModeShortcut(): void {
  const { toggleDemoMode } = useClearance();

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === "d") {
        event.preventDefault();
        toggleDemoMode();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [toggleDemoMode]);
}
