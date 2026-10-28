import { enrollmentProgressSteps } from "@/components/features/online-enrollment/data/mockData";

type StepperProps = {
  currentStep: number;
  onStepClick?: (step: number) => void;
  showDescriptions?: boolean;
};

export function Stepper({ currentStep, onStepClick, showDescriptions = true }: StepperProps) {
  const percentage = (currentStep / enrollmentProgressSteps.length) * 100;

  return (
    <div className="enroll-stepper">
      <div
        className="enroll-stepper-progress"
        style={{ width: `${Math.max(0, percentage - 12.5)}%` }}
        aria-hidden="true"
      />
      {enrollmentProgressSteps.map((step, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber === currentStep;
        const isCompleted = stepNumber < currentStep;
        const isClickable = onStepClick && (isCompleted || stepNumber === currentStep);

        return (
          <button
            key={step.id}
            className={`enroll-step ${isActive ? "active" : ""} ${isCompleted ? "completed" : ""}`}
            onClick={() => isClickable && onStepClick(stepNumber)}
            disabled={!isClickable}
            aria-current={isActive ? "step" : undefined}
            aria-label={`Step ${stepNumber}: ${step.title}`}
          >
            <div className="enroll-step-circle">
              {isCompleted ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20,6 9,17 4,12" />
                </svg>
              ) : (
                stepNumber
              )}
            </div>
            <div className="space-y-0.5">
              <div className={`enroll-step-label ${isActive ? "text-enroll-primary font-semibold" : ""}`}>
                {step.title}
              </div>
              {showDescriptions && (
                <div className="enroll-step-label text-xs opacity-60">{step.description}</div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}