import { useParams } from "react-router";
import { Navbar } from "@/components/common/navbar";
import { TopBar } from "@/components/features/student/home/top-bar";
import { EnrollmentFlow } from "@/pages/online-enrollment/EnrollmentFlow";
import { PageHeroBanner } from "@/components/features/online-enrollment/components/PageHeroBanner";
import cpcBg from "@/assets/cpc-bg.png";

const stepConfig: Record<number, { title: string; subtitle: string }> = {
  1: {
    title: "ENROLLMENT APPLICATION - STEP 1",
    subtitle: "Enter your personal information to continue with enrollment.",
  },
  2: {
    title: "ENROLLMENT APPLICATION - STEP 2",
    subtitle: "Select your subjects and complete your course selection.",
  },
  3: {
    title: "ENROLLMENT APPLICATION - STEP 3",
    subtitle: "Upload the required documents for your enrollment application.",
  },
  4: {
    title: "ENROLLMENT APPLICATION - STEP 4",
    subtitle: "Review your enrollment information before submitting your application.",
  },
};

export default function EnrollmentStepPage() {
  const step = Number(useParams().step) || 1;
  const config = stepConfig[step] || stepConfig[1];

  return (
    <div className="w-full overflow-x-hidden bg-white font-poppins">
      <header className="relative z-30">
        <TopBar />
        <Navbar />
      </header>

      <PageHeroBanner
        breadcrumbItems={[
          { label: "Home", href: "/" },
          { label: "Student Services", href: "/student/home" },
          { label: "Enrollment", href: null },
        ]}
        eyebrow="ENROLLMENT"
        title={config.title}
        subtitle={config.subtitle}
        backgroundImage={cpcBg}
      />

      <EnrollmentFlow />
    </div>
  );
}