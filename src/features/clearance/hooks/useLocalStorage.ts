import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from "react";

type LocalStorageTuple<T> = readonly [T, Dispatch<SetStateAction<T>>, () => void];

/**
 * A tiny `useState` wrapper that mirrors the value into localStorage.
 *
 * - Reads once (lazily) so the first render already has the saved value.
 * - Writes on every change; storage failures (private mode, quota) are ignored
 *   so the UI keeps working even when persistence is unavailable.
 * - Returns a `reset` helper that clears the key and restores the seed value.
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T | (() => T),
): LocalStorageTuple<T> {
  const seed = useCallback(
    () => (typeof initialValue === "function" ? (initialValue as () => T)() : initialValue),
    [initialValue],
  );

  const [value, setValue] = useState<T>(() => {
    try {
      const stored = window.localStorage.getItem(key);
      if (stored !== null) {
        return JSON.parse(stored) as T;
      }
    } catch {
      // Corrupt JSON or blocked storage: fall back to the seed value.
    }
    return seed();
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignore write failures (private mode / quota exceeded).
    }
  }, [key, value]);

  const reset = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Ignore.
    }
    setValue(seed());
  }, [key, seed]);

  return [value, setValue, reset] as const;
}
