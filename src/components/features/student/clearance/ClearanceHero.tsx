import { PageHeroBanner } from "@/components/common/display/PageHeroBanner";
import type { HeroBreadcrumb } from "@/components/common/display/PageHeroBanner";
import cpcBg from "@/assets/cpc-bg.png";

const breadcrumbItems: HeroBreadcrumb[] = [
  { label: "Home", href: "/" },
  { label: "Student Services", href: "/student/home" },
  { label: "Online Clearance", href: null },
];

/** Shared system hero banner, re-used with clearance content. */
export function ClearanceHero() {
  return (
    <PageHeroBanner
      breadcrumbItems={breadcrumbItems}
      eyebrow="STUDENT SERVICE"
      title="ONLINE CLEARANCE"
      subtitle="Complete your clearance requirements digitally and track each office's approval."
      backgroundImage={cpcBg}
    />
  );
}
