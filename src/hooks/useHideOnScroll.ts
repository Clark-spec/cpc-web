import { useEffect, useRef, useState } from "react";

type HideOnScrollOptions = {
  /** Scroll distance (px) before the header may hide. Keeps it visible at the top. */
  offset?: number;
  /** Minimum scroll delta (px) before flipping direction. Damps trackpad jitter. */
  delta?: number;
};

/**
 * Tracks scroll direction and reports whether a sticky header should hide.
 * Hides while scrolling down past `offset`, shows again on any upward scroll.
 */
export function useHideOnScroll({ offset = 80, delta = 6 }: HideOnScrollOptions = {}): boolean {
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    lastY.current = window.scrollY;

    const update = () => {
      const y = Math.max(0, window.scrollY);
      const diff = y - lastY.current;
      ticking.current = false;

      if (Math.abs(diff) < delta) return;
      lastY.current = y;

      if (y <= offset) {
        setHidden(false);
        return;
      }
      setHidden(diff > 0);
    };

    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      window.requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [offset, delta]);

  return hidden;
}
