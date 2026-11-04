import { cn } from "@/lib/cn";
import type { TimelineStage } from "@/services/serviceRequests";
import { formatDateTime } from "./format";

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="m3.5 8.5 3 3 6-7" />
    </svg>
  );
}

function TimelineRow({ stage, last }: { stage: TimelineStage; last: boolean }) {
  return (
    <li className="flex gap-3">
      <div className="flex flex-col items-center">
        <span
          className={cn(
            "flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border",
            stage.state === "completed" && "border-sr-success bg-sr-success text-white",
            stage.state === "active" && "border-sr-processing bg-white ring-2 ring-[#DCE8FF]",
            stage.state === "pending" && "border-[#CDD8EA] bg-white",
          )}
        >
          {stage.state === "completed" && <CheckIcon className="h-2.5 w-2.5" />}
          {stage.state === "active" && (
            <span className="h-[7px] w-[7px] rounded-full bg-sr-processing" />
          )}
        </span>
        {!last && (
          <span
            className={cn(
              "mt-1 w-[2px] flex-1 rounded-full",
              stage.state === "completed" ? "bg-[#A9E3C6]" : "bg-[#E4EAF5]",
            )}
            aria-hidden
          />
        )}
      </div>

      <div className={cn("min-w-0", last ? "pb-0" : "pb-4")}>
        <p
          className={cn(
            "font-poppins text-[12px] leading-[18px] font-semibold",
            stage.state === "active" ? "text-sr-processing" : "text-sr-text",
          )}
        >
          {stage.label}
        </p>
        <p className="mt-0.5 font-poppins text-[11px] leading-[16px] text-sr-muted">
          {stage.timestamp ? formatDateTime(stage.timestamp) : stage.description}
        </p>
      </div>
    </li>
  );
}

export function RequestTimeline({ timeline }: { timeline: TimelineStage[] }) {
  return (
    <ol className="mt-4">
      {timeline.map((stage, index) => (
        <TimelineRow key={stage.key} stage={stage} last={index === timeline.length - 1} />
      ))}
    </ol>
  );
}
