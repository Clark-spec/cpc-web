import { useEffect, useState } from "react";

/** Holds the first-paint skeleton for `delayMs`, matching the rest of the portal. */
export function useInitialSkeleton(delayMs = 800): boolean {
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setInitializing(false), delayMs);
    return () => window.clearTimeout(timer);
  }, [delayMs]);

  return initializing;
}
