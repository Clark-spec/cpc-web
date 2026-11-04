import { useCallback, useEffect, useState } from "react";

/** Demo panel visibility, toggled by button or by Ctrl/Cmd + Shift + D. */
export function useDemoModeToggle() {
  const [demoMode, setDemoMode] = useState(false);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (
        (event.ctrlKey || event.metaKey) &&
        event.shiftKey &&
        event.key.toLowerCase() === "d"
      ) {
        event.preventDefault();
        setDemoMode((previous) => !previous);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const toggleDemoMode = useCallback(() => setDemoMode((previous) => !previous), []);

  return { demoMode, toggleDemoMode };
}
