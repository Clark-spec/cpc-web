import { Skeleton } from "@/components/ui/skeleton";

/** Placeholder for the summary cards + subject table. */
export function SummaryTableSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Loading class schedule">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-2xl border border-cpc-input-border bg-white p-4">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="mt-3 h-3 w-20" />
            <Skeleton className="mt-2 h-5 w-28" />
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-cpc-input-border">
        <div className="flex items-center gap-3 bg-cpc-section-light px-4 py-3">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="ml-auto h-8 w-32" />
        </div>
        <div className="space-y-2 p-4">
          {Array.from({ length: 7 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Placeholder that mirrors the weekly grid. */
export function CalendarSkeleton() {
  return (
    <div className="p-4" aria-busy="true" aria-label="Loading weekly calendar">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-20" />
        <Skeleton className="h-9 w-24" />
        <Skeleton className="ml-auto h-9 w-32" />
      </div>
      <div className="overflow-hidden rounded-xl border border-cpc-input-border">
        <div className="flex bg-cpc-section-light">
          <Skeleton className="h-12 w-16 rounded-none" />
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-12 flex-1 rounded-none border-l border-white/60" />
          ))}
        </div>
        <div className="flex">
          <div className="w-16 space-y-6 border-r border-cpc-input-border p-2">
            {Array.from({ length: 9 }).map((_, index) => (
              <Skeleton key={index} className="h-3 w-8" />
            ))}
          </div>
          {Array.from({ length: 6 }).map((_, column) => (
            <div
              key={column}
              className="min-h-[420px] flex-1 space-y-4 border-r border-cpc-input-border p-2 last:border-r-0"
            >
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
