import { useParams } from "react-router";
import { PortalFooter } from "@/components/common/layout/PortalFooter";
import { PortalHeader } from "@/components/common/layout/PortalHeader";
import { EnrollmentFlow } from "@/components/features/student/enrollment/EnrollmentFlow";
import { EnrollmentHero } from "@/components/features/student/enrollment/EnrollmentHero";
import { EnrollmentProvider } from "@/components/features/student/enrollment/EnrollmentProvider";

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
      <PortalHeader />

      <EnrollmentHero title={config.title} subtitle={config.subtitle} />

      <EnrollmentProvider>
        <EnrollmentFlow />
      </EnrollmentProvider>
      <PortalFooter />
    </div>
  );
}
