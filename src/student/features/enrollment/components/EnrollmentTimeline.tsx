import { formatEnrollmentDate } from "../utils/format";
import { EnrollmentStatusIcon } from "./EnrollmentStatusIcon";

type TimelineStep = {
  status: string;
  label: string;
  date: string | null;
};

/** Vertical progress rail from Submitted through Enrolled. */
export function EnrollmentTimeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <div className="enroll-timeline">
      {steps.map((step) => (
        <div
          key={step.label}
          className={`enroll-timeline-item ${step.status === "active" ? "active" : ""} ${step.status === "completed" ? "completed" : ""}`}
        >
          <div className="enroll-timeline-dot">
            <EnrollmentStatusIcon status={step.status} />
          </div>
          <div className="ml-6">
            <h4 className="enroll-timeline-title">{step.label}</h4>
            <p className="enroll-timeline-time">{formatEnrollmentDate(step.date)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
