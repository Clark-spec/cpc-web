import { useEffect, useState } from "react";
import { useHomeFrame } from "@/components/features/student/home/use-home-frame";

/**
 * The Home page is laid out against a 1440px frame and scales the whole page
 * down with `zoom`. The shared chrome (top bar, navbar, footer) follows the
 * same scale on the wider pages so its height and type sizes match Home, but
 * it stops scaling below the desktop breakpoint where the navbar switches to
 * the mobile menu and full-size touch targets matter more.
 */
const DESKTOP_QUERY = "(min-width: 1024px)";

function isDesktop(): boolean {
  return typeof window !== "undefined" && window.matchMedia(DESKTOP_QUERY).matches;
}

export function useChromeFrame(): number {
  const scale = useHomeFrame();
  const [desktop, setDesktop] = useState(isDesktop);

  useEffect(() => {
    const query = window.matchMedia(DESKTOP_QUERY);
    const update = () => setDesktop(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return desktop ? scale : 1;
}
