import { useEffect, useState } from "react";
import { CloudOff } from "lucide-react";
import { cn } from "@/lib/cn";
import { useClearanceAdmin } from "@/components/features/admin/clearance/ClearanceAdminContext";

/** "2s" / "1m" / "3h" — coarse enough that the label rarely churns. */
function sinceLabel(iso: string | null, now: number): string {
  if (!iso) return "just now";
  const seconds = Math.max(0, Math.round((now - Date.parse(iso)) / 1000));
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.round(minutes / 60)}h ago`;
}

/**
 * Live sync chip.
 *
 * (1) Both portals write the same localStorage keys, so "Live" means another tab
 * just pushed a change through the storage event or the `cpc-clearance` channel.
 */
export function LiveSyncIndicator({ className }: { className?: string }) {
  const { sync } = useClearanceAdmin();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 10_000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <p
      aria-live="polite"
      className={cn(
        "flex items-center gap-1.5 font-poppins text-[11px] font-semibold",
        sync.live ? "text-emerald-700" : "text-amber-700",
        className,
      )}
    >
      {sync.live ? (
        <span className="relative flex h-2 w-2 shrink-0" aria-hidden>
          <span className="absolute inset-0 animate-ping rounded-full bg-emerald-500/40 motion-reduce:animate-none" />
          <span className="relative h-2 w-2 rounded-full bg-emerald-500" />
        </span>
      ) : (
        <CloudOff className="h-3.5 w-3.5 shrink-0" aria-hidden />
      )}
      {sync.live ? `Live · synced ${sinceLabel(sync.lastSyncedAt, now)}` : "Offline, changes will sync"}
    </p>
  );
}
