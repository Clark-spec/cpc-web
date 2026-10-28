import { useEffect, useState } from "react";

/** The homepage is laid out against a 1440px design frame. Narrower viewports
 *  scale the whole frame down instead of reflowing, so the proportions of the
 *  design survive; wider viewports keep it at 1:1 with full-bleed bands.
 *
 *  The frame stays `w-full`, so the width the page really gets — with or without
 *  a vertical scrollbar — is the only number that matters. Reading it as a
 *  painted width (not `clientWidth`, which can disagree with the layout) keeps
 *  the shrink uniform and makes a horizontal scrollbar impossible. */
const DESIGN_WIDTH = 1440;

function resolveScale(): number {
  const available = document.body.getBoundingClientRect().width;
  return available > 0 ? Math.min(1, available / DESIGN_WIDTH) : 1;
}

/** `zoom` factor for the page. */
export function useHomeFrame(): number {
  const [scale, setScale] = useState<number>(resolveScale);

  /* Re-measured whenever the page box changes, including the moment the vertical
     scrollbar appears or disappears after the content is laid out. */
  useEffect(() => {
    const fit = () => setScale(resolveScale());
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(document.body);
    return () => observer.disconnect();
  }, []);

  return scale;
}
