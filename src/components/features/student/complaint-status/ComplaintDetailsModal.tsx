import { useEffect } from "react";
import { Check, Paperclip, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { ComplaintStatusBadge } from "@/components/features/student/complaints/ComplaintStatusBadge";
import { formatDateTime } from "@/components/features/student/service-requests/format";
import type { StudentComplaint } from "@/services/complaints";

type ComplaintDetailsModalProps = {
  complaint: StudentComplaint;
  onClose: () => void;
};

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-poppins text-[10px] font-semibold tracking-[0.06em] text-sr-muted uppercase">
        {label}
      </p>
      <p className="mt-0.5 font-poppins text-[12px] leading-[18px] text-sr-text">{value}</p>
    </div>
  );
}

type TimelineState = "done" | "active" | "upcoming";

type TimelineStep = {
  label: string;
  description: string;
  state: TimelineState;
  at: string | null;
};

function buildTimeline(complaint: StudentComplaint): TimelineStep[] {
  const { status, filedAt, updatedAt } = complaint;

  return [
    {
      label: "Submitted",
      description: "Complaint received by the Student Support Office.",
      state: "done",
      at: filedAt,
    },
    {
      label: "In Review",
      description: "The Student Support Office is reviewing your complaint.",
      state:
        status === "resolved" ? "done" : status === "in_review" ? "active" : "upcoming",
      at: status === "pending" ? null : updatedAt,
    },
    {
      label: "Resolved",
      description: "The complaint has been reviewed and resolved.",
      state: status === "resolved" ? "active" : "upcoming",
      at: status === "resolved" ? updatedAt : null,
    },
  ];
}

function TimelineRow({
  step,
  last,
}: {
  step: TimelineStep;
  last: boolean;
}) {
  const marker =
    step.state === "upcoming"
      ? "border border-sr-border bg-white text-sr-muted"
      : step.state === "active"
        ? "bg-sr-primary text-white"
        : "bg-[#E3F7EE] text-[#1E8A57]";

  return (
    <li className="relative flex gap-3 pb-4 last:pb-0">
      {!last && (
        <span
          aria-hidden
          className={cn(
            "absolute top-7 bottom-0 left-[11px] w-px",
            step.state === "upcoming" ? "bg-sr-border" : "bg-[#BBD4F5]",
          )}
        />
      )}
      <span
        className={cn(
          "relative z-10 mt-0.5 flex h-[23px] w-[23px] shrink-0 items-center justify-center rounded-full",
          marker,
        )}
        aria-hidden
      >
        {step.state === "done" ? (
          <Check className="h-3 w-3" strokeWidth={3} />
        ) : (
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
        )}
      </span>
      <div className="min-w-0">
        <p
          className={cn(
            "font-poppins text-[12px] leading-[18px] font-semibold",
            step.state === "upcoming" ? "text-sr-muted" : "text-sr-text",
          )}
        >
          {step.label}
        </p>
        <p className="mt-0.5 font-poppins text-[10.5px] leading-[16px] text-sr-muted">
          {step.description}
        </p>
        {step.at && (
          <p className="mt-0.5 font-poppins text-[10px] text-sr-muted">
            {formatDateTime(step.at)}
          </p>
        )}
      </div>
    </li>
  );
}

export function ComplaintDetailsModal({
  complaint,
  onClose,
}: ComplaintDetailsModalProps) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const remarks = complaint.adminRemarks.trim();
  const timeline = buildTimeline(complaint);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1F4B]/60 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="complaint-details-title"
        className="sr-card flex max-h-[90vh] w-full max-w-[560px] flex-col overflow-hidden"
      >
        <div className="flex items-start justify-between gap-4 border-b border-sr-border px-5 py-4">
          <div>
            <h2
              id="complaint-details-title"
              className="font-poppins text-[15px] font-semibold text-sr-text"
            >
              Complaint Details
            </h2>
            <p className="mt-0.5 font-poppins text-[11px] text-sr-muted">
              {complaint.referenceNumber}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            autoFocus
            aria-label="Close complaint details"
            className="rounded-md p-1.5 text-sr-muted transition-colors hover:bg-sr-page hover:text-sr-text"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-sr-border bg-sr-section px-3.5 py-3">
              <div>
                <p className="font-poppins text-[10px] font-semibold tracking-[0.08em] text-sr-muted uppercase">
                  Reference Number
                </p>
                <p className="mt-0.5 font-poppins text-[15px] font-bold text-sr-primary">
                  {complaint.referenceNumber}
                </p>
              </div>
              <ComplaintStatusBadge status={complaint.status} />
            </div>

            <div>
              <p className="font-poppins text-[10px] font-semibold tracking-[0.06em] text-sr-muted uppercase">
                Subject
              </p>
              <p className="mt-0.5 font-poppins text-[13px] leading-[19px] font-medium text-sr-text">
                {complaint.subject}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Detail label="Category" value={complaint.category} />
              <Detail
                label="Submitted As"
                value={complaint.anonymous ? "Anonymous" : "Student Account"}
              />
              <Detail label="Date Filed" value={formatDateTime(complaint.filedAt)} />
              <Detail label="Last Updated" value={formatDateTime(complaint.updatedAt)} />
            </div>

            <div>
              <p className="font-poppins text-[10px] font-semibold tracking-[0.06em] text-sr-muted uppercase">
                Description
              </p>
              <p className="mt-1 rounded-md bg-[#F8FAFF] px-3 py-2 font-poppins text-[11.5px] leading-[17px] whitespace-pre-wrap text-sr-text">
                {complaint.description}
              </p>
            </div>

            {complaint.attachmentName && (
              <div>
                <p className="font-poppins text-[10px] font-semibold tracking-[0.06em] text-sr-muted uppercase">
                  Attachment
                </p>
                <div className="mt-1 flex items-center gap-2 rounded-lg border border-sr-border px-3 py-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-sr-section text-sr-primary">
                    <Paperclip className="h-3.5 w-3.5" aria-hidden />
                  </span>
                  <p className="truncate font-poppins text-[11.5px] text-sr-text">
                    {complaint.attachmentName}
                  </p>
                </div>
              </div>
            )}

            <div>
              <p className="font-poppins text-[10px] font-semibold tracking-[0.06em] text-sr-muted uppercase">
                Student Support Response
              </p>
              <p className="mt-1 rounded-lg border border-sr-border bg-[#F8FAFF] px-3 py-2 font-poppins text-[11.5px] leading-[17px] whitespace-pre-wrap text-sr-text">
                {remarks || "The Student Support Office has not posted a response yet."}
              </p>
            </div>

            <div>
              <p className="font-poppins text-[10px] font-semibold tracking-[0.06em] text-sr-muted uppercase">
                Progress
              </p>
              <ol className="mt-2 rounded-lg border border-sr-border bg-white px-3.5 py-3">
                {timeline.map((step, index) => (
                  <TimelineRow
                    key={step.label}
                    step={step}
                    last={index === timeline.length - 1}
                  />
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
