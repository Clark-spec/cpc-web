import { Skeleton } from "@/components/ui/skeleton";

/** First-load placeholder that mirrors the real clearance layout. */
export function ClearanceSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading your clearance">
      <div className="grid gap-4 lg:grid-cols-[1.55fr_1fr]">
        <div className="rounded-xl border border-cpc-input-border bg-white p-5">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
          <Skeleton className="mt-4 h-3 w-52" />
          <div className="mt-4 flex items-end gap-4">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="mb-2 h-3 w-40" />
          </div>
          <Skeleton className="mt-4 h-3 w-full rounded-full" />
          <div className="mt-5 grid grid-cols-3 gap-3">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
        </div>
        <div className="rounded-xl bg-cpc-navy/90 p-5">
          <Skeleton className="h-12 w-12 rounded-full bg-white/20" />
          <Skeleton className="mt-4 h-5 w-44 bg-white/20" />
          <Skeleton className="mt-3 h-3 w-full bg-white/20" />
          <Skeleton className="mt-2 h-3 w-3/4 bg-white/20" />
          <Skeleton className="mt-6 h-10 w-full bg-white/20" />
        </div>
      </div>

      <div className="rounded-xl border border-cpc-input-border bg-white p-5 sm:p-8">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-16 w-16 rounded-full" />
          <Skeleton className="h-16 w-32" />
        </div>
        <Skeleton className="mt-6 h-3 w-full" />
        <Skeleton className="mt-2 h-3 w-2/3" />
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-44 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
