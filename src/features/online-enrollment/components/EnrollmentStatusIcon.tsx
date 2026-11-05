/** Marker shown against each enrollment timeline step. */
export function EnrollmentStatusIcon({ status }: { status: string }) {
  switch (status) {
    case "completed":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20,6 9,17 4,12" />
        </svg>
      );
    case "active":
      return <div className="w-5 h-5 rounded-full bg-enroll-primary animate-pulse" />;
    case "pending":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
        </svg>
      );
    default:
      return null;
  }
}
