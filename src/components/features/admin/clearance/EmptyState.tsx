import type { LucideIcon } from "lucide-react";
import { CheckCircle2, SearchX } from "lucide-react";
import { EmptyState as SharedEmptyState } from "@/components/common/display/EmptyState";

/**
 * The two "nothing to show" states of the queue: a genuinely empty tab versus a
 * filtered-out list. The second one has to offer a way back.
 */
export function EmptyState({
  hasActiveFilters,
  onClearFilters,
}: {
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}) {
  const filtered = hasActiveFilters;

  const icon: LucideIcon = filtered ? SearchX : CheckCircle2;

  return (
    <SharedEmptyState
      icon={icon}
      title={filtered ? "No requests match these filters" : "All caught up!"}
      description={
        filtered
          ? "Try a different search, section or date range."
          : "No pending requests. New student requests appear here automatically."
      }
      action={
        filtered ? (
          <button
            type="button"
            onClick={onClearFilters}
            className="cpc-btn cpc-btn-secondary cpc-btn-sm"
          >
            Clear filters
          </button>
        ) : undefined
      }
      className="py-14"
    />
  );
}
