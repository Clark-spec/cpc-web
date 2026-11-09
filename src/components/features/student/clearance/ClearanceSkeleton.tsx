import { Skeleton } from "@/components/ui/skeleton";

/** First-load placeholder that mirrors the real clearance layout. */
export function ClearanceSkeleton() {
  return (
    <div className="space-y-6 sm:space-y-8" aria-busy="true" aria-label="Loading your clearance">
      {/* Top summary row */}
      <div className="grid items-stretch gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Clearance Status Card Skeleton */}
        <div className="flex flex-col justify-between rounded-2xl border border-white/80 bg-white/85 p-6 shadow-[0_8px_30px_rgb(15,36,104,0.04)] backdrop-blur-md">
          <div>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <div className="space-y-1.5">
                  <Skeleton className="h-5 w-44" />
                  <Skeleton className="h-3 w-56" />
                </div>
              </div>
              <Skeleton className="h-7 w-28 rounded-full" />
            </div>

            <div className="mt-6 flex items-baseline gap-3">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-4 w-48" />
            </div>

            <Skeleton className="mt-3.5 h-3.5 w-full rounded-full" />

            <div className="mt-6 grid grid-cols-3 gap-3">
              <Skeleton className="h-20 rounded-xl" />
              <Skeleton className="h-20 rounded-xl" />
              <Skeleton className="h-20 rounded-xl" />
            </div>
          </div>

          <div className="mt-6 border-t border-cpc-input-border/50 pt-4">
            <Skeleton className="h-4 w-64" />
          </div>
        </div>

        {/* Clearance Confirmation Card Skeleton */}
        <div className="flex flex-col justify-between rounded-2xl border border-cpc-navy-text/30 bg-[#0F2468] p-6 text-white shadow-[0_12px_40px_rgb(15,36,104,0.18)]">
          <div>
            <div className="flex items-center justify-between">
              <Skeleton className="h-11 w-11 rounded-2xl bg-white/20" />
              <Skeleton className="h-6 w-32 rounded-full bg-white/20" />
            </div>
            <Skeleton className="mt-5 h-6 w-48 bg-white/20" />
            <Skeleton className="mt-2 h-3.5 w-full bg-white/20" />

            <div className="mt-5 space-y-2 rounded-xl bg-white/10 p-4">
              <Skeleton className="h-4 w-full bg-white/20" />
              <Skeleton className="h-4 w-3/4 bg-white/20" />
              <Skeleton className="h-4 w-5/6 bg-white/20" />
            </div>
          </div>

          <Skeleton className="mt-6 h-11 w-full rounded-xl bg-white/20" />
        </div>
      </div>

      {/* Main Clearance Form (Form 3) Skeleton */}
      <div className="rounded-2xl border border-white/80 bg-white/85 p-6 shadow-[0_8px_30px_rgb(15,36,104,0.04)] backdrop-blur-md sm:p-8">
        <div className="flex flex-col items-center justify-between gap-4 border-b border-cpc-input-border/60 pb-6 sm:flex-row">
          <Skeleton className="h-7 w-28 rounded-full" />
          <div className="flex flex-col items-center gap-2">
            <Skeleton className="h-14 w-14 rounded-full" />
            <Skeleton className="h-4 w-44" />
          </div>
          <Skeleton className="h-8 w-36 rounded-lg" />
        </div>

        <Skeleton className="mt-6 h-16 w-full rounded-xl" />

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
      </div>

      {/* Signatures Grid Skeleton */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-9 w-32 rounded-xl" />
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-52 rounded-2xl" />
          ))}
        </div>
      </div>

      {/* Clearance History Skeleton */}
      <div className="rounded-2xl border border-white/80 bg-white/85 p-6 shadow-[0_8px_30px_rgb(15,36,104,0.04)] backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-cpc-input-border/50 pb-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div className="space-y-1">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-3 w-56" />
            </div>
          </div>
          <Skeleton className="h-9 w-32 rounded-xl" />
        </div>
        <Skeleton className="mt-4 h-40 w-full rounded-xl" />
      </div>
    </div>
  );
}
