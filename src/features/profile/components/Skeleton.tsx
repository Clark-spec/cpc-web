import { Skeleton } from "@/components/ui/skeleton";

/** First-load placeholder that mirrors the hero + three-card layout. */
export function ProfileSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Loading your profile">
      <div className="rounded-2xl border border-cpc-input-border bg-cpc-section-light p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <Skeleton className="h-28 w-28 shrink-0 rounded-full sm:h-32 sm:w-32" />
          <div className="min-w-0 flex-1 space-y-3">
            <Skeleton className="h-7 w-56 max-w-full" />
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-3 w-64 max-w-full" />
            <Skeleton className="h-3 w-36" />
          </div>
          <Skeleton className="h-10 w-36 rounded-lg" />
        </div>
      </div>

      <Skeleton className="h-24 w-full rounded-2xl" />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)]">
        <div className="rounded-2xl border border-cpc-input-border bg-white p-5">
          <Skeleton className="h-5 w-40" />
          <div className="mt-5 space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-full" />
            ))}
          </div>
        </div>
        <div className="space-y-5">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="rounded-2xl border border-cpc-input-border bg-white p-5">
              <Skeleton className="h-5 w-44" />
              <div className="mt-5 space-y-4">
                {Array.from({ length: 4 }).map((__, row) => (
                  <Skeleton key={row} className="h-10 w-full" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
