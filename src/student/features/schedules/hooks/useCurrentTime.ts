import { useEffect, useState } from "react";

/**
 * Returns the current time and refreshes it once a minute, so the red "now"
 * line and the "Next class" summary stay accurate without re-rendering the
 * page on every tick. The tick also refreshes when the tab becomes visible
 * again after being backgrounded.
 */
export function useCurrentTime(intervalMs = 60_000): Date {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const tick = () => setNow(new Date());
    const timer = window.setInterval(tick, intervalMs);
    const handleVisibility = () => {
      if (document.visibilityState === "visible") tick();
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [intervalMs]);

  return now;
}
