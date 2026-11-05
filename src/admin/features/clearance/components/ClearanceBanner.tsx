import { AlertTriangle, Eye, PenTool } from "lucide-react";
import { PageBanner } from "@/components/ui/admin/PageBanner";
import { cn } from "@/lib/cn";
import { useClearanceAdmin } from "../context/ClearanceAdminContext";
import { LiveSyncIndicator } from "./LiveSyncIndicator";

type ClearanceBannerProps = {
  onPreviewStudent: () => void;
  onOpenSignatures: () => void;
};

/**
 * Page h1 + wave banner. When the admin closes the clearance period a strip is
 * appended under the same card (spec §9 "closed-period banner") reading the
 * shared `cpc:clearance:period.open` flag straight from the context.
 */
export function ClearanceBanner({ onPreviewStudent, onOpenSignatures }: ClearanceBannerProps) {
  const { period } = useClearanceAdmin();
  const closed = !period.open;

  return (
    <>
      <PageBanner
        title="Online Clearance"
        subtitle="Review and sign student clearance requests for your office"
        right={
          <div className="flex flex-col items-start gap-2.5 sm:items-end">
            <LiveSyncIndicator />
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onOpenSignatures}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-cpc-tile-border bg-white px-3 py-2 font-poppins text-xs font-semibold whitespace-nowrap text-cpc-navy-text transition-colors hover:bg-cpc-section-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
              >
                <PenTool className="h-3.5 w-3.5 shrink-0" aria-hidden />
                My signatures
              </button>
              <button
                type="button"
                onClick={onPreviewStudent}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-cpc-blue-accent bg-cpc-blue-accent px-3 py-2 font-poppins text-xs font-semibold whitespace-nowrap text-white transition-colors hover:bg-cpc-blue-accent/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
              >
                <Eye className="h-3.5 w-3.5 shrink-0" aria-hidden />
                Preview as student
              </button>
            </div>
          </div>
        }
        className={cn(closed && "rounded-b-none border-b-0")}
      />

      {closed && (
        <div
          role="status"
          className="-mt-px flex items-start gap-2 rounded-b-2xl border border-t-0 border-amber-200 bg-amber-50 px-5 py-2.5 sm:px-7"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden />
          <p className="font-poppins text-xs leading-relaxed font-semibold text-amber-700">
            Clearance period is closed — students cannot send new requests.
          </p>
        </div>
      )}
    </>
  );
}
