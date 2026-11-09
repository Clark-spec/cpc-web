import { Skeleton as SkeletonBlock } from "@/components/ui/skeleton";

export function StatCardSkeleton() {
  return (
    <div className="rounded-2xl border border-white/80 bg-white/75 p-5 shadow-[0_8px_30px_rgb(15,36,104,0.04)] backdrop-blur-md">
      <div className="flex items-center gap-3">
        <SkeletonBlock className="h-11 w-11 rounded-full" />
        <div className="flex-1 space-y-2">
          <SkeletonBlock className="h-3 w-28" />
          <SkeletonBlock className="h-3 w-20" />
        </div>
      </div>
      <div className="mt-4 flex items-end justify-between gap-3">
        <SkeletonBlock className="h-9 w-20" />
        <SkeletonBlock className="h-10 w-24" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2 p-4" aria-hidden>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center gap-3">
          <SkeletonBlock className="h-9 w-9 rounded-full" />
          <SkeletonBlock className="h-3 flex-1" />
          <SkeletonBlock className="hidden h-3 w-24 sm:block" />
          <SkeletonBlock className="h-3 w-16" />
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-white/80 bg-white/75 p-5 shadow-[0_8px_30px_rgb(15,36,104,0.04)] backdrop-blur-md">
      <SkeletonBlock className="h-4 w-40" />
      <SkeletonBlock className="mt-2 h-3 w-64 max-w-full" />
      <div className="mt-5 space-y-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonBlock key={index} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading dashboard">
      <SkeletonBlock className="h-40 w-full rounded-2xl" />
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <StatCardSkeleton key={index} />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <CardSkeleton />
        </div>
        <div className="xl:col-span-4">
          <CardSkeleton />
        </div>
      </div>
      <CardSkeleton />
    </div>
  );
}
