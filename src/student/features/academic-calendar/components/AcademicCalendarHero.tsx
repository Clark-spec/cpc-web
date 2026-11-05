import { PageHeroBanner } from "@/student/components/page-hero-banner";
import type { HeroBreadcrumb } from "@/student/components/page-hero-banner";
import cpcBg from "@/assets/cpc-bg2.png";

const breadcrumbItems: HeroBreadcrumb[] = [
  { label: "Home", href: "/student/home" },
  { label: "Academics", href: null },
  { label: "Academic Calendar", href: null },
];

/** Page hero for the academic calendar. Hidden when printing. */
export function AcademicCalendarHero() {
  return (
    <div className="print:hidden">
      <PageHeroBanner
        breadcrumbItems={breadcrumbItems}
        eyebrow="ACADEMICS / ACADEMIC CALENDAR"
        title="Academic Calendar"
        subtitle="View important academic dates and school activities."
        backgroundImage={cpcBg}
      />
    </div>
  );
}
