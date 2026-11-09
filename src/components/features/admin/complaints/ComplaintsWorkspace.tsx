import { useMemo, useState } from "react";
import { useToast } from "@/components/ui/toast";
import { ComplaintDetailsModal } from "@/components/features/admin/complaints/ComplaintDetailsModal";
import { ComplaintsBanner } from "@/components/features/admin/complaints/ComplaintsBanner";
import { ComplaintsKpiStrip } from "@/components/features/admin/complaints/ComplaintsKpiStrip";
import { ComplaintsTable } from "@/components/features/admin/complaints/ComplaintsTable";
import { ComplaintsToolbar } from "@/components/features/admin/complaints/ComplaintsToolbar";
import {
  ADMIN_COMPLAINTS,
  COMPLAINT_STATUS_LABELS,
} from "@/components/features/admin/complaints/mockComplaints";
import type {
  AdminComplaintRow,
  ComplaintFilters,
  ComplaintStatusFilter,
  ComplaintUpdate,
} from "@/components/features/admin/complaints/types";

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
 * complaint queue. All rows live in local state so a status update in the
 * details modal immediately repaints the table and the KPI counts.
 */
export function ComplaintsWorkspace() {
  const { toast } = useToast();
  const [rows, setRows] = useState<AdminComplaintRow[]>(ADMIN_COMPLAINTS);
  const [filters, setFilters] = useState<ComplaintFilters>(DEFAULT_FILTERS);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filteredRows = useMemo(() => {
    const query = filters.query.trim().toLowerCase();

    return rows
      .filter((row) => {
        const matchesQuery =
          !query ||
          [
            row.referenceNumber,
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

  function handleSave(id: string, update: ComplaintUpdate) {
    const row = rows.find((item) => item.id === id);
    if (!row) return;

    const statusChanged = row.status !== update.status;

    setRows((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              status: update.status,
              adminRemarks: update.adminRemarks,
              updatedAt: new Date().toISOString(),
            }
          : item,
      ),
    );
    setSelectedId(null);

    toast(
      statusChanged
        ? `${row.referenceNumber} updated to ${COMPLAINT_STATUS_LABELS[update.status]}.`
        : `Admin remarks saved for ${row.referenceNumber}.`,
      "success",
    );
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

      <ComplaintsTable
        rows={pageRows}
        totalRows={filteredRows.length}
        page={page}
        pageSize={filters.pageSize}
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
