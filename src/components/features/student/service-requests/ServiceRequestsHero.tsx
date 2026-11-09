import { PageHeroBanner } from "@/components/common/PageHeroBanner";
import type { HeroBreadcrumb } from "@/components/common/PageHeroBanner";
import cpcBg from "@/assets/cpc-bg2.png";

const breadcrumbItems: HeroBreadcrumb[] = [
  { label: "Home", href: "/" },
  { label: "Student Services", href: "/student/home" },
  { label: "Service Requests", href: null },
];

/** Page hero for service requests. */
export function ServiceRequestsHero() {
  return (
    <PageHeroBanner
      breadcrumbItems={breadcrumbItems}
      eyebrow="STUDENT SERVICES"
      title="Service Requests"
      subtitle="Submit a request for school services or documents and easily track its progress."
      backgroundImage={cpcBg}
    />
  );
}
