import { FeatureCard } from "./FeatureCard";

export function FeaturesGrid() {
  const features = [
    {
      title: "Enroll anytime, anywhere",
      description: "Convenient enrollment process that you can complete from the comfort of your home or on the go.",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
      ),
      label: "Convenient",
    },
    {
      title: "Monitor your enrollment status",
      description: "Track progress in real-time and receive notifications about your application.",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="23,6 13.5,15.5 8.5,10.5 1,18" />
          <polyline points="17,6 23,6 23,12" />
        </svg>
      ),
      label: "Track Progress",
    },
    {
      title: "Submit your documents online",
      description: "Upload requirements securely through our platform with drag-and-drop convenience.",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14,2 14,8 20,8" />
          <line x1="12" y1="18" x2="12" y2="12" />
          <line x1="9" y1="15" x2="15" y2="15" />
        </svg>
      ),
      label: "Upload Requirements",
    },
    {
      title: "Receive your enrollment confirmation",
      description: "Get instant confirmation and downloadable receipts for your records.",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22,4 12,14.01 9,11.01" />
        </svg>
      ),
      label: "Get Confirmation",
    },
  ];

  return (
    <section className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
      {features.map((feature) => (
        <FeatureCard
          key={feature.label}
          icon={feature.icon}
          title={feature.title}
          description={feature.description}
        />
      ))}
    </section>
  );
}