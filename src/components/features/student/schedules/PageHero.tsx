import cpcBg from "@/assets/cpc-bg2.png";
import { PageHeroBanner } from "@/components/common/display/PageHeroBanner";

/**
 * Page hero. Reuses the shared banner and only swaps the copy/background, so
 * the breadcrumb, eyebrow, H1 and subtitle treatment stays identical to the
 * other student pages.
 */
export function PageHero() {
  return (
    <div className="print:hidden">
      <PageHeroBanner
        breadcrumbItems={[
          { label: "Home", href: "/student/home" },
          { label: "Academics", href: null },
          { label: "Class Schedules", href: null },
        ]}
        eyebrow="ACADEMICS"
        title="CLASS SCHEDULES"
        subtitle="View your current class schedule and class information"
        backgroundImage={cpcBg}
      />
    </div>
  );
}
