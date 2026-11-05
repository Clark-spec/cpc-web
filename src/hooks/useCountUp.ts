import { useEffect, useRef, useState } from "react";

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Animates a number from its previous value to `target` with an ease-out
 * curve. Respects `prefers-reduced-motion` by returning the target directly.
 */
export function useCountUp(target: number, duration = 900): number {
  // Start from zero so statistics count up once when the page loads, then
  // animate between values whenever the underlying count changes.
  const [value, setValue] = useState(() => (prefersReducedMotion() ? target : 0));
  const previous = useRef(0);
  const reduced = prefersReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion()) {
      previous.current = target;
      return;
    }

    const from = previous.current;
    const started = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const progress = Math.min(1, (now - started) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(from + (target - from) * eased));
      if (progress < 1) {
        frame = window.requestAnimationFrame(tick);
      } else {
        previous.current = target;
      }
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [target, duration]);

  return reduced ? target : value;
}
