import type { ReactNode } from "react";
import { StudentNavbar } from "@/components/common/navigation/StudentNavbar";
import { useChromeFrame } from "@/hooks/useChromeFrame";
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

  return (
    <header className="relative z-30" style={{ zoom }}>
      <TopBar bell={bell} />
      <StudentNavbar fluid />
    </header>
  );
}
