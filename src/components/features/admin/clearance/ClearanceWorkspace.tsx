import { useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { ErrorCard } from "@/components/common/ErrorCard";
import { useHotkeys } from "@/lib/useHotkeys";
import { useClearanceAdmin } from "@/components/features/admin/clearance/ClearanceAdminContext";
import { ApproveSignModal } from "@/components/features/admin/clearance/ApproveSignModal";
import { BulkActionBar } from "@/components/features/admin/clearance/BulkActionBar";
import { ClearanceBanner } from "@/components/features/admin/clearance/ClearanceBanner";
import { ClearanceDemoPanel } from "@/components/features/admin/clearance/ClearanceDemoPanel";
import { ClearanceKpiStrip } from "@/components/features/admin/clearance/ClearanceKpiStrip";
import { ClearancePeriodCard } from "@/components/features/admin/clearance/ClearancePeriodCard";
import { OfficeFilterTabs } from "@/components/features/admin/clearance/OfficeFilterTabs";
import { OfficeLoadChart } from "@/components/features/admin/clearance/OfficeLoadChart";
import { QueueBoard } from "@/components/features/admin/clearance/QueueBoard";
import { QueueTable } from "@/components/features/admin/clearance/QueueTable";
import { QueueToolbar } from "@/components/features/admin/clearance/QueueToolbar";
import { RejectModal } from "@/components/features/admin/clearance/RejectModal";
import { RevokeModal } from "@/components/features/admin/clearance/RevokeModal";
import { SavedSignaturesPanel } from "@/components/features/admin/clearance/SavedSignaturesPanel";
import { ShortcutHelpModal } from "@/components/features/admin/clearance/ShortcutHelpModal";
import { StudentPreviewDrawer } from "@/components/features/admin/clearance/StudentPreviewDrawer";
import { StudentReviewPanel } from "@/components/features/admin/clearance/StudentReviewPanel";
import type { ClearanceRequestRow, OfficeId } from "@/components/features/admin/clearance/types";

/**
 * Rows 1–5 of the staff clearance page (spec "PAGE LAYOUT").
 *
 * (3) Nothing here is stored locally: the queue, the KPI strip and the workload
 * chart all read the same rows derived from the shared `cpc:clearance:records`
 * array, so a signature written by either portal repaints all three at once.
 * The page only owns dialog/panel visibility — the modal components call the
 * context's `approve` / `reject` / `revoke` themselves.
 */
export function ClearanceWorkspace() {
  const {
    error,
    filters,
    isSuperAdmin,
    loading,
    refresh,
    selectRow,
    selectedRow,
    setFilter,
    stepRequest,
  } = useClearanceAdmin();

  const searchRef = useRef<HTMLInputElement>(null);

  /* Row 4: the panel is an inline sticky aside at xl and a drawer below it. */
  const [dismissedId, setDismissedId] = useState<string | null>(null);
  const [signaturesOpen, setSignaturesOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [approveRow, setApproveRow] = useState<ClearanceRequestRow | null>(null);
  const [rejectRow, setRejectRow] = useState<ClearanceRequestRow | null>(null);
  const [revokeRow, setRevokeRow] = useState<ClearanceRequestRow | null>(null);

  const dialogOpen =
    signaturesOpen || previewOpen || helpOpen || approveRow !== null || rejectRow !== null;

  /*
   * Derived, never synced: the drawer follows the selection, and only the row
   * the staff member explicitly closed stays hidden until they pick it again.
   */
  const panelVisible = selectedRow !== null && dismissedId !== selectedRow.id;

  useHotkeys(
    {
      j: () => stepRequest(-1),
      k: () => stepRequest(1),
      a: () => {
        if (selectedRow) setApproveRow(selectedRow);
      },
      r: () => {
        if (selectedRow) setRejectRow(selectedRow);
      },
      "/": (event) => {
        event.preventDefault();
        searchRef.current?.focus();
      },
      "?": () => setHelpOpen(true),
    },
    !dialogOpen,
  );

  function openPanel(id: string) {
    selectRow(id);
    setDismissedId((current) => (current === id ? null : current));
  }

  function closePanel() {
    if (selectedRow) setDismissedId(selectedRow.id);
  }

  function handleSign(row: ClearanceRequestRow) {
    openPanel(row.id);
    setApproveRow(row);
  }

  function handleReject(row: ClearanceRequestRow) {
    openPanel(row.id);
    setRejectRow(row);
  }

  function handleRevoke(row: ClearanceRequestRow) {
    openPanel(row.id);
    setRevokeRow(row);
  }

  return (
    <div className="space-y-6">
      <ClearanceBanner
        onPreviewStudent={() => setPreviewOpen(true)}
        onOpenSignatures={() => setSignaturesOpen(true)}
      />

      <ClearanceDemoPanel />

      <ClearanceKpiStrip />

      <OfficeFilterTabs />

      <QueueToolbar searchInputRef={searchRef} />

      {error && !loading ? (
        <ErrorCard message={error} onRetry={() => void refresh()} />
      ) : (
        <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-12">
          <section
            aria-label="Request queue"
            className="min-w-0 xl:col-span-7 2xl:col-span-8"
          >
            {filters.view === "board" ? (
              <QueueBoard onSelect={openPanel} onSign={handleSign} onReject={handleReject} />
            ) : (
              <QueueTable onSelect={openPanel} onSign={handleSign} onReject={handleReject} />
            )}
          </section>

          <aside
            role="complementary"
            aria-label="Student review"
            className="hidden xl:col-span-5 xl:block 2xl:col-span-4"
          >
            <div className="sticky top-24">
              <StudentReviewPanel
                onSign={handleSign}
                onReject={handleReject}
                onRevoke={handleRevoke}
              />
            </div>
          </aside>
        </div>
      )}

      {panelVisible && selectedRow && (
        <div className="xl:hidden">
          <button
            type="button"
            aria-label="Close review panel"
            onClick={closePanel}
            className="fixed inset-0 z-[65] cursor-pointer bg-cpc-navy/40"
          />
          <StudentReviewPanel
            sheet
            onClose={closePanel}
            onSign={handleSign}
            onReject={handleReject}
            onRevoke={handleRevoke}
          />
        </div>
      )}

      {/* Row 5 — the period card is admin-only, so the chart takes both columns otherwise. */}
      <div className={cn("grid grid-cols-1 items-start gap-6", isSuperAdmin && "xl:grid-cols-2")}>
        <OfficeLoadChart
          onSelectOffice={(office: OfficeId) => setFilter("office", office)}
        />
        <ClearancePeriodCard />
      </div>

      <BulkActionBar />

      <ApproveSignModal
        row={approveRow}
        open={approveRow !== null}
        onClose={() => setApproveRow(null)}
      />
      <RejectModal row={rejectRow} open={rejectRow !== null} onClose={() => setRejectRow(null)} />
      <RevokeModal row={revokeRow} open={revokeRow !== null} onClose={() => setRevokeRow(null)} />
      <SavedSignaturesPanel open={signaturesOpen} onClose={() => setSignaturesOpen(false)} />
      <StudentPreviewDrawer open={previewOpen} onClose={() => setPreviewOpen(false)} />
      <ShortcutHelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}
