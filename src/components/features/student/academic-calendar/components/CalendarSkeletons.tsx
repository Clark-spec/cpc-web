import { Skeleton } from "@/components/ui/skeleton";

export function CalendarGridSkeleton() {
  return (
    <div aria-hidden>
      <div className="mb-2 grid grid-cols-7 gap-1">
        {Array.from({ length: 7 }, (_, index) => (
          <Skeleton key={index} className="h-4" />
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 42 }, (_, index) => (
          <Skeleton key={index} className="h-14 sm:h-20" />
        ))}
      </div>
    </div>
  );
}

export function CardListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-hidden>
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex gap-3">
          <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-2.5 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
