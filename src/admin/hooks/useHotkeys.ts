import { useEffect, useRef } from "react";

type HotkeyHandler = (event: KeyboardEvent) => void;

/**
 * Registers global keyboard shortcuts such as `ctrl+b`, `ctrl+k` and
 * `ctrl+shift+d`. Modifier combos still fire while an input is focused, which
 * is what lets Ctrl+K work from the command palette itself.
 */
export function useHotkeys(
  bindings: Record<string, HotkeyHandler>,
  enabled = true,
): void {
  const bindingsRef = useRef(bindings);

  useEffect(() => {
    bindingsRef.current = bindings;
  }, [bindings]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT" ||
        target?.isContentEditable === true;

      const combo = [
        event.ctrlKey || event.metaKey ? "ctrl" : "",
        event.shiftKey ? "shift" : "",
        event.altKey ? "alt" : "",
        event.key.toLowerCase(),
      ]
        .filter(Boolean)
        .join("+");

      const handler = bindingsRef.current[combo];
      if (!handler) return;

      // Plain letters should not hijack typing.
      if (isTyping && !event.ctrlKey && !event.metaKey && !event.altKey) return;

      handler(event);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled]);
}
