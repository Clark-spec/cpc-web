import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock3, Inbox, UserPen, XCircle } from "lucide-react";
import { PageBanner } from "@/components/common/display/PageBanner";
import { useToast } from "@/components/ui/toast";
import { useAdminData } from "@/components/context/AdminDataContext";
import { ProfileCorrectionModal } from "@/components/features/admin/student-accounts/ProfileCorrectionModal";
import { ProfileCorrectionsTable } from "@/components/features/admin/student-accounts/ProfileCorrectionsTable";
import { ProfileCorrectionsToolbar } from "@/components/features/admin/student-accounts/ProfileCorrectionsToolbar";
import { SummaryCard } from "@/components/features/admin/student-accounts/SummaryCard";
import { CORRECTION_STATUS_LABELS } from "@/components/features/admin/student-accounts/labels";
import { PROFILE_CORRECTION_REQUESTS } from "@/components/features/admin/student-accounts/mockStudentAccounts";
import type {
  CorrectionDecision,
  CorrectionFilters,
  CorrectionStatusFilter,
  ProfileCorrectionRequest,
} from "@/components/features/admin/student-accounts/types";

const DEFAULT_FILTERS: CorrectionFilters = {
  query: "",
  status: "all",
  course: "all",
  from: "",
  to: "",
  page: 1,
  pageSize: 10,
};

/** Route: /admin/students/profile-corrections — the registrar's review queue. */
export function ProfileCorrectionsWorkspace() {
  const { toast } = useToast();
  const { setProfileCorrectionsCount } = useAdminData();
  const [rows, setRows] = useState<ProfileCorrectionRequest[]>(
    PROFILE_CORRECTION_REQUESTS,
  );
  const [filters, setFilters] = useState<CorrectionFilters>(DEFAULT_FILTERS);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const pendingCount = rows.filter((row) => row.status === "pending").length;

  // Keep the sidebar badge equal to the pending count in the queue.
  useEffect(() => {
    setProfileCorrectionsCount(pendingCount);
  }, [pendingCount, setProfileCorrectionsCount]);

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
            row.field,
            row.requestedValue,
          ].some((value) => value.toLowerCase().includes(query));
        const matchesStatus = filters.status === "all" || row.status === filters.status;
        const matchesCourse = filters.course === "all" || row.course === filters.course;
        /* Compare the local calendar date so the range matches the date input. */
        const submittedDate = row.submittedAt.slice(0, 10);
        const matchesFrom = !filters.from || submittedDate >= filters.from;
        const matchesTo = !filters.to || submittedDate <= filters.to;

        return matchesQuery && matchesStatus && matchesCourse && matchesFrom && matchesTo;
      })
      .sort((a, b) => Date.parse(b.submittedAt) - Date.parse(a.submittedAt));
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
    filters.course !== "all" ||
    filters.from !== "" ||
    filters.to !== "";

  const selectedRow = rows.find((row) => row.id === selectedId) ?? null;

  const counts = useMemo(
    () => ({
      total: rows.length,
      pending: rows.filter((row) => row.status === "pending").length,
      approved: rows.filter((row) => row.status === "approved").length,
      rejected: rows.filter((row) => row.status === "rejected").length,
    }),
    [rows],
  );

  function setFilter<K extends keyof CorrectionFilters>(
    key: K,
    value: CorrectionFilters[K],
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

  function applyStatusFilter(status: CorrectionStatusFilter) {
    setFilters((prev) => ({ ...prev, status, page: 1 }));
  }

  function handleDecide(id: string, decision: CorrectionDecision) {
    const target = rows.find((row) => row.id === id);
    if (!target) return;

    setRows((current) =>
      current.map((row) =>
        row.id === id
          ? {
              ...row,
              status: decision.status,
              adminRemarks: decision.adminRemarks,
              reviewedAt: new Date().toISOString(),
            }
          : row,
      ),
    );
    setSelectedId(null);
    toast(
      `${target.referenceNumber} ${CORRECTION_STATUS_LABELS[decision.status].toLowerCase()}.`,
      "success",
    );
  }

  const share = (count: number) =>
    counts.total === 0 ? 0 : Math.round((count / counts.total) * 100);

  return (
    <div className="space-y-6">
      <PageBanner
        title="Profile Correction Requests"
        subtitle="Review student-submitted profile changes and keep official records accurate"
        right={
          <div className="flex items-center gap-2.5 rounded-xl border border-white/80 bg-white/80 px-3.5 py-2.5 shadow-[0_10px_30px_rgba(15,36,104,0.08)] backdrop-blur">
            <span
              aria-hidden
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cpc-section-light text-cpc-blue-accent"
            >
              <UserPen className="h-4 w-4" />
            </span>
            <div>
              <p className="font-poppins text-[10px] font-bold tracking-[0.12em] text-cpc-heading-soft uppercase">
                Pending review
              </p>
              <p className="font-poppins text-sm leading-none font-bold text-cpc-navy-text tabular-nums">
                {counts.pending}
              </p>
            </div>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Total Requests"
          count={counts.total}
          icon={Inbox}
          tone="bg-cpc-section-light text-cpc-blue-accent"
          chip="All records"
          hint="Every profile correction request"
          active={filters.status === "all"}
          onClick={() => applyStatusFilter("all")}
        />
        <SummaryCard
          label="Pending"
          count={counts.pending}
          icon={Clock3}
          tone="bg-amber-50 text-amber-600"
          chip={`${share(counts.pending)}% of total`}
          hint="Waiting for registrar review"
          active={filters.status === "pending"}
          onClick={() => applyStatusFilter("pending")}
        />
        <SummaryCard
          label="Approved"
          count={counts.approved}
          icon={CheckCircle2}
          tone="bg-emerald-50 text-emerald-600"
          chip={`${share(counts.approved)}% of total`}
          hint="Approved corrections"
          active={filters.status === "approved"}
          onClick={() => applyStatusFilter("approved")}
        />
        <SummaryCard
          label="Rejected"
          count={counts.rejected}
          icon={XCircle}
          tone="bg-rose-50 text-rose-600"
          chip={`${share(counts.rejected)}% of total`}
          hint="Rejected corrections"
          active={filters.status === "rejected"}
          onClick={() => applyStatusFilter("rejected")}
        />
      </div>

      <ProfileCorrectionsToolbar
        filters={filters}
        setFilter={setFilter}
        resetFilters={resetFilters}
        hasActiveFilters={hasActiveFilters}
      />

      <ProfileCorrectionsTable
        rows={pageRows}
        totalRows={filteredRows.length}
        page={page}
        pageSize={filters.pageSize}
        hasActiveFilters={hasActiveFilters}
        onView={(request) => setSelectedId(request.id)}
        onPageChange={(nextPage) => setFilter("page", nextPage)}
        onPageSizeChange={(size) => setFilter("pageSize", size)}
        onClearFilters={resetFilters}
      />

      {selectedRow && (
        <ProfileCorrectionModal
          key={selectedRow.id}
          request={selectedRow}
          onClose={() => setSelectedId(null)}
          onDecide={(decision) => handleDecide(selectedRow.id, decision)}
        />
      )}
    </div>
  );
}
