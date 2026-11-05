import { PageHeroBanner } from "@/components/ui/student/PageHeroBanner";
import type { HeroBreadcrumb } from "@/components/ui/student/PageHeroBanner";
import cpcBg from "@/assets/cpc-bg.png";

const breadcrumbItems: HeroBreadcrumb[] = [
  { label: "Home", href: "/" },
  { label: "Student Services", href: "/student/home" },
  { label: "Enrollment", href: null },
];

type EnrollmentHeroProps = {
  eyebrow?: string;
  title: string;
  subtitle: string;
};

/** Shared enrollment hero: same breadcrumbs and artwork on every enrollment page. */
export function EnrollmentHero({ eyebrow = "ENROLLMENT", title, subtitle }: EnrollmentHeroProps) {
  return (
    <PageHeroBanner
      breadcrumbItems={breadcrumbItems}
      eyebrow={eyebrow}
      title={title}
      subtitle={subtitle}
      backgroundImage={cpcBg}
    />
  );
}
