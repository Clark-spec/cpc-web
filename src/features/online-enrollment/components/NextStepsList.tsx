/** Numbered "What Happens Next?" list shown on the submission receipt. */
export function NextStepsList() {
  const steps = [
    {
      title: "Document Verification",
      text: "Our team will verify your submitted documents.",
    },
    {
      title: "Approval Process",
      text: "Your application will be reviewed by the enrollment committee.",
    },
    {
      title: "Notification",
      text: "You'll receive an email with the result.",
    },
  ];

  return (
    <div className="bg-enroll-hero-bg rounded-lg p-6 mb-6">
      <h3 className="font-semibold text-enroll-heading mb-3">What Happens Next?</h3>
      <div className="space-y-3 text-left">
        {steps.map((step, index) => (
          <div key={step.title} className="flex items-start gap-3">
            <div className="w-6 h-6 bg-enroll-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs font-bold">{index + 1}</span>
            </div>
            <div>
              <p className="font-medium text-enroll-heading">{step.title}</p>
              <p className="text-sm text-enroll-text">{step.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
