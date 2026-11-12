import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { ApiError } from "@/lib/apiClient";
import { ComplaintDetailsModal } from "@/components/features/admin/complaints/ComplaintDetailsModal";
import { ComplaintsBanner } from "@/components/features/admin/complaints/ComplaintsBanner";
import { ComplaintsKpiStrip } from "@/components/features/admin/complaints/ComplaintsKpiStrip";
import { ComplaintsTable } from "@/components/features/admin/complaints/ComplaintsTable";
import { ComplaintsToolbar } from "@/components/features/admin/complaints/ComplaintsToolbar";
import { COMPLAINT_STATUS_LABELS } from "@/components/features/admin/complaints/mockComplaints";
import type {
  AdminComplaintRow,
  ComplaintFilters,
  ComplaintStatusFilter,
  ComplaintUpdate,
} from "@/components/features/admin/complaints/types";
import { getAdminComplaints, updateAdminComplaint } from "@/services/complaints";

const DEFAULT_FILTERS: ComplaintFilters = {
  query: "",
  status: "all",
  category: "all",
  from: "",
  to: "",
  page: 1,
  pageSize: 10,
};

/**
 * Admin Complaint Dashboard (spec §1–3): banner, summary cards, filters and the
 * complaint queue. Rows come from the shared admin API, so every administrator
 * with Student Support access sees and edits the same records.
 */
export function ComplaintsWorkspace() {
  const { toast } = useToast();
  const [rows, setRows] = useState<AdminComplaintRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ComplaintFilters>(DEFAULT_FILTERS);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setRows(await getAdminComplaints());
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : "Could not load complaints. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredRows = useMemo(() => {
    const query = filters.query.trim().toLowerCase();

    return rows
      .filter((row) => {
        const matchesQuery =
          !query ||
          [
            row.referenceNumber,
            /*
             * Anonymous rows arrive with placeholder identity only, so a search
             * for a student's name or ID can never surface their anonymous
             * complaint.
             */
            row.studentName,
            row.studentId,
            row.subject,
            row.category,
          ].some((value) => value.toLowerCase().includes(query));
        const matchesStatus = filters.status === "all" || row.status === filters.status;
        const matchesCategory =
          filters.category === "all" || row.category === filters.category;
        /* Compare the local calendar date so the range matches the date input. */
        const filedDate = row.filedAt.slice(0, 10);
        const matchesFrom = !filters.from || filedDate >= filters.from;
        const matchesTo = !filters.to || filedDate <= filters.to;

        return matchesQuery && matchesStatus && matchesCategory && matchesFrom && matchesTo;
      })
      .sort((a, b) => Date.parse(b.filedAt) - Date.parse(a.filedAt));
  }, [rows, filters]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / filters.pageSize));
  const page = Math.min(filters.page, totalPages);
  const pageRows = filteredRows.slice(
    (page - 1) * filters.pageSize,
    page * filters.pageSize,
  );

  const hasActiveFilters =
    filters.query.trim() !== "" ||
    filters.status !== "all" ||
    filters.category !== "all" ||
    filters.from !== "" ||
    filters.to !== "";

  const selectedRow = rows.find((row) => row.id === selectedId) ?? null;
  const openCount = rows.filter((row) => row.status !== "resolved").length;

  function setFilter<K extends keyof ComplaintFilters>(
    key: K,
    value: ComplaintFilters[K],
  ) {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      ...(key === "page" ? {} : { page: 1 }),
    }));
  }

  function resetFilters() {
    setFilters((prev) => ({ ...DEFAULT_FILTERS, pageSize: prev.pageSize }));
  }

  function applyStatusFilter(status: ComplaintStatusFilter) {
    setFilters((prev) => ({ ...prev, status, page: 1 }));
  }

  async function handleSave(id: string, update: ComplaintUpdate) {
    const row = rows.find((item) => item.id === id);
    if (!row) return;

    try {
      const updated = await updateAdminComplaint(id, update, row.updatedAt);
      setRows((current) =>
        current.map((item) => (item.id === id ? updated : item)),
      );
      setSelectedId(null);

      const statusChanged = row.status !== update.status;
      toast(
        statusChanged
          ? `${row.referenceNumber} updated to ${COMPLAINT_STATUS_LABELS[update.status]}.`
          : `Admin remarks saved for ${row.referenceNumber}.`,
        "success",
      );
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        // Another administrator changed this record first. Never overwrite it;
        // refresh the queue so the next open shows their version.
        setSelectedId(null);
        toast(error.message, "warning");
        void load();
        return;
      }
      // Anything else stays in the modal so the administrator can retry.
      throw error;
    }
  }

  return (
    <div className="space-y-6">
      <ComplaintsBanner openCount={openCount} />

      <ComplaintsKpiStrip rows={rows} onFilter={applyStatusFilter} />

      <ComplaintsToolbar
        filters={filters}
        setFilter={setFilter}
        resetFilters={resetFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {loadError && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="font-poppins text-xs leading-relaxed text-rose-700">{loadError}</p>
          <button
            type="button"
            onClick={() => void load()}
            className="cpc-btn cpc-btn-secondary cpc-btn-sm shrink-0"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden />
            Retry
          </button>
        </div>
      )}

      <ComplaintsTable
        rows={pageRows}
        totalRows={filteredRows.length}
        page={page}
        pageSize={filters.pageSize}
        loading={loading}
        hasActiveFilters={hasActiveFilters}
        onView={(row) => setSelectedId(row.id)}
        onPageChange={(nextPage) => setFilter("page", nextPage)}
        onPageSizeChange={(size) => setFilter("pageSize", size)}
        onClearFilters={resetFilters}
      />

      {selectedRow && (
        <ComplaintDetailsModal
          key={selectedRow.id}
          row={selectedRow}
          onClose={() => setSelectedId(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
