import cpcBg from "@/assets/cpc-bg2.png";
import { PageHeroBanner } from "@/components/common/display/PageHeroBanner";

/** Page hero, matching the breadcrumb and banner treatment of the other student pages. */
export function ComplaintHero() {
  return (
    <div className="print:hidden">
      <PageHeroBanner
        breadcrumbItems={[
          { label: "Home", href: "/student/home" },
          { label: "Student Support", href: null },
          { label: "Online Complaint", href: null },
        ]}
        eyebrow="STUDENT SUPPORT"
        title="ONLINE COMPLAINT"
        subtitle="File a complaint with the Student Support Office and track its progress online"
        backgroundImage={cpcBg}
      />
    </div>
  );
}
