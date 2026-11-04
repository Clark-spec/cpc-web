import { cn } from "@/lib/cn";

/** Base shimmer block used by every feature's loading placeholder. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "animate-pulse rounded-md bg-cpc-section-light motion-reduce:animate-none",
        className,
      )}
    />
  );
}
