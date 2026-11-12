import { CircleCheck, Sparkles } from "lucide-react";
import type { EditableField } from "@/components/features/student/profile/types";

type ProfileCompletenessCardProps = {
  percentage: number;
  nextMissing: { field: EditableField; label: string } | null;
  /** Enters edit mode and focuses the missing field. */
  onFix: (field: EditableField) => void;
};

/** Progress strip computed from the editable profile fields. */
export function ProfileCompletenessCard({
  percentage,
  nextMissing,
  onFix,
}: ProfileCompletenessCardProps) {
  const complete = percentage === 100;

  return (
    <section
      aria-labelledby="profile-completeness-title"
      className="rounded-2xl border border-cpc-input-border bg-white p-4 shadow-[0_10px_30px_rgba(27,47,158,0.06)] sm:p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cpc-section-light text-cpc-blue-accent">
            <CircleCheck className="h-4 w-4" aria-hidden />
          </span>
          <h2
            id="profile-completeness-title"
            className="font-poppins text-sm font-bold text-cpc-navy-text"
          >
            Profile completeness
          </h2>
        </div>

        <span className="font-poppins text-sm font-bold text-cpc-navy-text">
          {percentage}%
        </span>
      </div>

      <div
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Profile completeness"
        className="mt-3 h-2 w-full overflow-hidden rounded-full bg-cpc-section-light"
      >
        <div
          className="h-2 rounded-full bg-cpc-blue-accent transition-[width] duration-500 motion-reduce:transition-none"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {complete ? (
        <p className="mt-3 flex items-center gap-1.5 font-poppins text-xs text-cpc-heading-soft">
          <Sparkles className="h-3.5 w-3.5 text-emerald-600" aria-hidden />
          Everything is complete. Thanks for keeping your profile current.
        </p>
      ) : (
        nextMissing && (
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-poppins text-xs leading-relaxed text-cpc-heading-soft">
              Add {nextMissing.label} to reach 100%
            </p>
            <button
              type="button"
              onClick={() => onFix(nextMissing.field)}
              className="cpc-btn cpc-btn-secondary cpc-btn-sm w-fit"
            >
              Add now
            </button>
          </div>
        )
      )}
    </section>
  );
}
