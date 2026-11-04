import { useEffect, useMemo } from "react";
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
  const urlStep = useMemo(() => parseInt(stepParam, 10), [stepParam]);

  const {
    state,
    enrollmentData,
    goToStep,
    totalUnits,
    selectedSubjectsCount,
  } = useEnrollment();

  // Keep the hook's state synchronized with URL step
  useEffect(() => {
    if (state.currentStep !== urlStep) {
      goToStep(urlStep);
    }
  }, [urlStep, state.currentStep, goToStep]);

  // Use URL step as the source of truth for rendering
  const step = urlStep;

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
      const nextStep = step + 1;
      goToStep(nextStep);
      navigate(`/online-enrollment/step/${nextStep}`);
    }
  };

  const handlePrev = () => {
    if (step > 1) {
      const prevStep = step - 1;
      goToStep(prevStep);
      navigate(`/online-enrollment/step/${prevStep}`);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return (enrollmentData.personalInfo.firstName || enrollmentData.personalInfo.fullName) &&
               enrollmentData.personalInfo.email &&
               enrollmentData.personalInfo.contactNumber &&
               enrollmentData.personalInfo.homeAddress &&
               enrollmentData.personalInfo.emergencyContact &&
               enrollmentData.personalInfo.contactPerson;
      case 2:
        return enrollmentData.subjects.length > 0;
      case 3:
        return enrollmentData.requirements.every(r => r.status !== "pending");
      default:
        return true;
    }
  };

  return (
    <div className="enroll-layout">
      <div className="enroll-content max-w-5xl mx-auto px-4 py-8">
        <div className="enroll-card p-8 mb-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-lg font-semibold text-enroll-heading">{currentTitle}</h2>
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

          <Stepper currentStep={step} onStepClick={(s) => {
            goToStep(s);
            navigate(`/online-enrollment/step/${s}`);
          }} />

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
              className="px-6 py-3 text-enroll-text hover:text-enroll-heading disabled:opacity-40 disabled:cursor-not-allowed"
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
    </div>
  );
}