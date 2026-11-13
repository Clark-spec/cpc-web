import { useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router";
import { ActionButton, useActionStatus } from "@/components/ui/action-button";
import { showInfo, showSuccess, showSuccessModal } from "@/lib/feedback";
import { useEnrollment } from "@/components/features/student/enrollment/useEnrollment";
import {
  readEnrollmentSubmission,
  saveEnrollmentSubmission,
} from "@/components/features/student/enrollment/submission";
import { Stepper } from "@/components/features/student/enrollment/Stepper";
import { PersonalInfoStep } from "@/components/features/student/enrollment/PersonalInfoStep";
import { SubjectsStep } from "@/components/features/student/enrollment/SubjectsStep";
import { RequirementsStep } from "@/components/features/student/enrollment/RequirementsStep";
import { ReviewStep } from "@/components/features/student/enrollment/ReviewStep";
import {
  validateCourse,
  validatePersonalInfo,
  validateSubjectSelection,
  validateYearLevel,
} from "@/components/features/student/enrollment/validation";

export function EnrollmentFlow() {
  const navigate = useNavigate();
  const params = useParams();
  const stepParam = params.step || "1";
  const urlStep = useMemo(() => parseInt(stepParam, 10), [stepParam]);
  const submitAction = useActionStatus(1500);

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
      showSuccess(
        `Step ${step} saved`,
        `Your ${steps[currentStepIndex].title.toLowerCase()} answers are saved on this device.`,
      );
    }
  };

  function handleSubmitEnrollment() {
    if (submitAction.status === "loading") return;

    const existing = readEnrollmentSubmission();
    if (existing) {
      showInfo(
        "Enrollment already submitted",
        `Reference ${existing.referenceNumber} is on file. You can view its status anytime.`,
      );
      navigate("/online-enrollment/confirmation");
      return;
    }

    submitAction.start();
    const submission = saveEnrollmentSubmission();
    submitAction.succeed();
    showSuccessModal({
      title: "Enrollment submitted",
      message:
        "Your answers and requirements are saved on this device and ready for the registrar to review.",
      reference: submission.referenceNumber,
      meta: "Status: Submitted · Keep your reference number",
      primaryAction: {
        label: "View receipt",
        onClick: () => navigate("/online-enrollment/confirmation"),
      },
      secondaryLabel: "Stay here",
      celebrate: true,
    });
  }

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
        return Object.keys(validatePersonalInfo(enrollmentData.personalInfo)).length === 0;
      case 2:
        return (
          !validateCourse(state.course) &&
          !validateYearLevel(state.yearLevel) &&
          !validateSubjectSelection(enrollmentData.subjects.length)
        );
      case 3:
        return enrollmentData.requirements.every((requirement) => requirement.status !== "pending");
      default:
        return true;
    }
  };

  return (
    <div className="enroll-layout">
      <div className="enroll-content py-8">
        <div className="enroll-card mb-6 p-5 sm:p-8">
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
              className="cpc-btn cpc-btn-tertiary"
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
                  className="cpc-btn cpc-btn-primary"
                >
                  Next
                </button>
              ) : (
                <ActionButton
                  status={submitAction.status}
                  loadingLabel="Submitting…"
                  successLabel="Submitted"
                  errorLabel="Try again"
                  onClick={handleSubmitEnrollment}
                >
                  Submit Enrollment
                </ActionButton>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}