import { Footer } from "@/student/layout/footer";
import { useChromeFrame } from "@/hooks/useChromeFrame";

/**
 * Shared student-portal footer. Matches the Home page footer at desktop sizes
 * (same scale) and reflows into stacked columns on smaller screens.
 */
export function PortalFooter() {
  const zoom = useChromeFrame();

  return (
    <div style={{ zoom }}>
      <Footer fluid />
    </div>
  );
}
