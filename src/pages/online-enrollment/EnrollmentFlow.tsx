import { useNavigate, useParams } from "react-router";
import { useEnrollment } from "@/components/features/online-enrollment/hooks/useEnrollment";
import { Stepper } from "@/components/features/online-enrollment/components/Stepper";
import { PersonalInfoStep } from "@/pages/online-enrollment/steps/PersonalInfoStep";
import { SubjectsStep } from "@/pages/online-enrollment/steps/SubjectsStep";
import { RequirementsStep } from "@/pages/online-enrollment/steps/RequirementsStep";
import { ReviewStep } from "@/pages/online-enrollment/steps/ReviewStep";

export function EnrollmentFlow() {
  const navigate = useNavigate();
  const params = useParams();
  const stepParam = params.step || "1";
  const step = parseInt(stepParam, 10);
  
  const {
    state,
    enrollmentData,
    goToStep,
    totalUnits,
    selectedSubjectsCount,
  } = useEnrollment();

  const steps = [
    { id: "1", title: "Personal Information" },
    { id: "2", title: "Select Subjects" },
    { id: "3", title: "Upload Requirements" },
    { id: "4", title: "Review and Submit" },
  ];

  const currentStepIndex = step - 1;
  const currentTitle = steps[currentStepIndex]?.title || "Enrollment";

  const handleNext = () => {
    if (step < 4) {
      navigate(`/online-enrollment/step/${step + 1}`);
      goToStep(step + 1);
    }
  };

  const handlePrev = () => {
    if (step > 1) {
      navigate(`/online-enrollment/step/${step - 1}`);
      goToStep(step - 1);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return enrollmentData.personalInfo.fullName && 
               enrollmentData.personalInfo.email &&
               enrollmentData.personalInfo.contactNumber;
      case 2:
        return enrollmentData.subjects.length > 0;
      case 3:
        return enrollmentData.requirements.every(r => r.status !== "pending");
      default:
        return true;
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="enroll-page-title">Online Enrollment</h1>
        <p className="enroll-page-subtitle">Complete and monitor your enrollment process online</p>
      </div>

      <div className="enroll-card p-8 mb-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-lg font-semibold text-cpc-navy">{currentTitle}</h2>
            {step === 2 && (
              <p className="text-sm text-enroll-text mt-1">
                {selectedSubjectsCount} subjects selected ({totalUnits} units)
              </p>
            )}
          </div>
          <span className="text-sm text-enroll-text">
            Step {step} of {steps.length}
          </span>
        </div>

        <Stepper currentStep={step} onStepClick={(s) => navigate(`/online-enrollment/step/${s}`)} />

        <div className="mt-8">
          {step === 1 && <PersonalInfoStep />}
          {step === 2 && <SubjectsStep />}
          {step === 3 && <RequirementsStep />}
          {step === 4 && <ReviewStep />}
        </div>

        <div className="flex items-center justify-between mt-8 pt-6 border-t border-enroll-border">
          <button
            onClick={handlePrev}
            disabled={step === 1}
            className="px-6 py-3 text-enroll-text hover:text-cpc-navy disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Back
          </button>

          <div className="flex items-center gap-4">
            {state.isSaved && (
              <span className="text-xs text-enroll-success">Auto-saved</span>
            )}
            {step < 4 ? (
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className="enroll-btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            ) : (
              <button
                onClick={() => navigate("/online-enrollment/confirmation")}
                className="enroll-btn-primary"
              >
                Submit Enrollment
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}