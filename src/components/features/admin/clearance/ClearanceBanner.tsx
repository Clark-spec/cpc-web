import { AlertTriangle, Eye, PenTool } from "lucide-react";
import { PageBanner } from "@/components/common/display/PageBanner";
import { cn } from "@/lib/cn";
import { useClearanceAdmin } from "@/components/features/admin/clearance/ClearanceAdminContext";
import { LiveSyncIndicator } from "@/components/features/admin/clearance/LiveSyncIndicator";

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
        eyebrow="STUDENT SERVICES"
        title="Clearance Requests"
        subtitle="Review, endorse, and sign digital student clearance applications across all campus offices."
        right={
          <div className="flex flex-col items-start gap-2.5 sm:items-end">
            <LiveSyncIndicator />
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onOpenSignatures}
                className="cpc-btn cpc-btn-secondary cpc-btn-sm"
              >
                <PenTool className="h-3.5 w-3.5 shrink-0 text-cpc-blue-accent" aria-hidden />
                My Signatures
              </button>
              <button
                type="button"
                onClick={onPreviewStudent}
                className="cpc-btn cpc-btn-primary cpc-btn-sm"
              >
                <Eye className="h-3.5 w-3.5 shrink-0" aria-hidden />
                Preview as Student
              </button>
            </div>
          </div>
        }
        className={cn(
          "border-white/80 bg-white/75 shadow-[0_8px_30px_rgb(15,36,104,0.04)] backdrop-blur-md",
          closed && "rounded-b-none border-b-0",
        )}
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
