import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "react-router";
import { useSidebar } from "@/context/SidebarContext";
import { Sidebar } from "./Sidebar";

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Slide-in navigation drawer for screens below `lg`. */
export function MobileDrawer() {
  const { mobileOpen, closeMobile } = useSidebar();
  const { pathname } = useLocation();
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  // A route change always dismisses the drawer.
  useEffect(() => {
    closeMobile();
  }, [closeMobile, pathname]);

  useEffect(() => {
    if (!mobileOpen) return;

    previousFocus.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const panel = panelRef.current;
    const focusables = (): HTMLElement[] =>
      Array.from(panel?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []).filter(
        (element) => element.offsetParent !== null,
      );

    const first = focusables()[0];
    if (first) first.focus();
    else panel?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMobile();
        return;
      }
      if (event.key !== "Tab") return;

      const list = focusables();
      if (list.length === 0) {
        event.preventDefault();
        return;
      }

      const firstEl = list[0];
      const lastEl = list[list.length - 1];

      if (event.shiftKey && document.activeElement === firstEl) {
        event.preventDefault();
        lastEl.focus();
      } else if (!event.shiftKey && document.activeElement === lastEl) {
        event.preventDefault();
        firstEl.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus.current?.focus();
    };
  }, [closeMobile, mobileOpen]);

  if (!mobileOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 lg:hidden">
      <div
        className="admin-drawer-backdrop absolute inset-0 bg-cpc-navy-deep/50 backdrop-blur-sm"
        onClick={closeMobile}
        aria-hidden
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Admin navigation menu"
        tabIndex={-1}
        className="admin-drawer relative h-full w-[280px] max-w-[85vw] bg-white shadow-[0_24px_80px_rgba(15,36,104,0.35)] outline-none"
      >
        <Sidebar mobile onClose={closeMobile} />
      </div>
    </div>,
    document.body,
  );
}
