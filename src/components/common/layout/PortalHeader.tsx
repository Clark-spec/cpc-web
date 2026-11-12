import type { ReactNode } from "react";
import { StudentNavbar } from "@/components/common/navigation/StudentNavbar";
import { useChromeFrame } from "@/hooks/useChromeFrame";
import { useHideOnScroll } from "@/hooks/useHideOnScroll";
import { cn } from "@/lib/cn";
import { TopBar } from "@/components/common/layout/TopBar";

type PortalHeaderProps = {
  /** Lets a page swap in its own notification control (e.g. the clearance bell). */
  bell?: ReactNode;
};

/**
 * Shared student-portal header. Uses the same top bar and navbar as the Home
 * page, at the same scaled sizes, and reflows to the mobile menu on small
 * screens. Pages that need live notifications pass their own `bell`.
 */
export function PortalHeader({ bell }: PortalHeaderProps) {
  const zoom = useChromeFrame();
  const hidden = useHideOnScroll();

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-transform duration-300 ease-out",
        hidden && "-translate-y-full",
      )}
      style={{ zoom }}
    >
      <TopBar bell={bell} />
      <StudentNavbar fluid />
    </header>
  );
}
