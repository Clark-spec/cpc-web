import type { ReactNode } from "react";

type StatusInfoCard = {
  title: string;
  text: string;
  icon: ReactNode;
};

const statusInfoCards: StatusInfoCard[] = [
  {
    title: "Application Received",
    text: "Your enrollment application has been received and is being processed.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7L12 12L22 7L12 2Z" />
        <path d="M2 17L12 22L22 17" />
        <path d="M2 12L12 17L22 12" />
      </svg>
    ),
  },
  {
    title: "Processing Time",
    text: "3-5 business days for review and verification of documents.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
  },
  {
    title: "Next Steps",
    text: "Wait for approval, then complete remaining requirements.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
      </svg>
    ),
  },
];

/** The three explainer cards under the status timeline. */
export function EnrollmentStatusInfoCards() {
  return (
    <div className="grid md:grid-cols-3 gap-6">
      {statusInfoCards.map((card) => (
        <div key={card.title} className="enroll-card p-6 text-center">
          <div className="w-12 h-12 bg-enroll-hero-bg rounded-full flex items-center justify-center mx-auto mb-3">
            {card.icon}
          </div>
          <h4 className="font-semibold text-enroll-heading mb-2">{card.title}</h4>
          <p className="text-sm text-enroll-text">{card.text}</p>
        </div>
      ))}
    </div>
  );
}
