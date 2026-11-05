import { useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import {
  ArrowDownUp,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useToast } from "@/components/ui/toast";
import { PageBanner } from "../components/PageBanner";
import { ErrorCard } from "../components/ErrorCard";
import { TableSkeleton } from "../components/Skeleton";
import { EmptyState } from "../components/EmptyState";
import { ClearanceRequestTable } from "../components/clearance/ClearanceRequestTable";
import { ReviewRequestModal } from "../components/clearance/ReviewRequestModal";
import { SignaturePadModal } from "../components/clearance/SignaturePadModal";
import { useAdminAuth } from "../context/AdminAuthContext";
import { useAdminData } from "../context/AdminDataContext";
import type { ClearanceRequest, ClearanceRequestStatus } from "../types";

const PAGE_SIZE = 10;

type TabId = "pending" | "signed" | "rejected" | "all";
type SortId = "newest" | "oldest";

const TABS: Array<{ id: TabId; label: string }> = [
  { id: "pending", label: "Pending" },
  { id: "signed", label: "Signed" },
  { id: "rejected", label: "Rejected" },
  { id: "all", label: "All" },
];

const OFFICE_LABELS: Record<ClearanceRequest["office"], string> = {
  instructor: "Instructor",
  dean: "Dean",
  library: "Library",
  registrar: "Registrar",
  accounting: "Accounting",
  sao: "SAO / SSG Adviser",
};

function matchesStatus(request: ClearanceRequest, tab: TabId): boolean {
  return tab === "all" || request.status === (tab as ClearanceRequestStatus);
}

/** Route: /admin/clearance-requests */
export default function ClearanceRequestsPage() {
  const { user } = useAdminAuth();
  const { requests, loading, refreshing, error, refresh, approve, reject, bulkApprove } =
    useAdminData();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [tab, setTab] = useState<TabId>("pending");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortId>("newest");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [reviewRequest, setReviewRequest] = useState<ClearanceRequest | null>(null);
  const [signatureTargets, setSignatureTargets] = useState<ClearanceRequest[] | null>(null);
  const [busy, setBusy] = useState(false);

  const studentFilter = searchParams.get("student");

  const counts = useMemo(() => {
    const base = requests.filter((request) => {
      if (!studentFilter) return true;
      return request.studentId === studentFilter;
    });

    return {
      pending: base.filter((request) => request.status === "pending").length,
      signed: base.filter((request) => request.status === "signed").length,
      rejected: base.filter((request) => request.status === "rejected").length,
      all: base.length,
    };
  }, [requests, studentFilter]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();

    const rows = requests.filter((request) => {
      if (!matchesStatus(request, tab)) return false;
      if (studentFilter && request.studentId !== studentFilter) return false;
      if (!term) return true;
      const haystack =
        `${request.studentName} ${request.studentId} ${request.program} ${request.section} ${OFFICE_LABELS[request.office]}`.toLowerCase();
      return haystack.includes(term);
    });

    return rows.sort((a, b) =>
      sort === "newest"
        ? b.requestedAt.localeCompare(a.requestedAt)
        : a.requestedAt.localeCompare(b.requestedAt),
    );
  }, [query, requests, sort, studentFilter, tab]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // Reset paging and selection whenever the result set changes shape.
  const changeTab = (next: TabId) => {
    setTab(next);
    setPage(1);
  };

  const changeQuery = (next: string) => {
    setQuery(next);
    setPage(1);
  };

  const changeSort = (next: SortId) => {
    setSort(next);
    setPage(1);
  };

  if (!user) return null;

  const selectedRequests = requests.filter(
    (request) => selectedIds.includes(request.id) && request.status === "pending",
  );

  const toggle = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id],
    );
  };

  const toggleAll = () => {
    const selectable = pageRows.filter((request) => request.status === "pending").map((r) => r.id);
    const allSelected = selectable.length > 0 && selectable.every((id) => selectedIds.includes(id));

    setSelectedIds((current) =>
      allSelected
        ? current.filter((id) => !selectable.includes(id))
        : Array.from(new Set([...current, ...selectable])),
    );
  };

  const handleRefresh = async () => {
    await refresh();
    toast("Clearance requests refreshed.", "success");
  };

  const openSignature = (targets: ClearanceRequest[]) => {
    setReviewRequest(null);
    setSignatureTargets(targets);
  };

  const handleSignatureConfirm = async (payload: {
    image: string;
    signerName: string;
    office: ClearanceRequest["office"];
    signedAt: string;
  }) => {
    if (!signatureTargets || signatureTargets.length === 0) return;

    setBusy(true);
    try {
      if (signatureTargets.length === 1) {
        await approve(signatureTargets[0].id, payload);
        toast(`${signatureTargets[0].studentName}'s clearance was signed.`, "success");
      } else {
        await bulkApprove(
          signatureTargets.map((request) => request.id),
          payload,
        );
        toast(`${signatureTargets.length} clearance requests were signed.`, "success");
      }
      setSignatureTargets(null);
      setSelectedIds([]);
    } catch {
      toast("Couldn't sign the request. Please try again.", "error");
    } finally {
      setBusy(false);
    }
  };

  const handleReject = async (request: ClearanceRequest, remarks: string) => {
    if (!user) return;
    setBusy(true);
    try {
      await reject(request.id, {
        remarks,
        signerName: user.name,
        office: request.office,
        respondedAt: new Date().toISOString(),
      });
      toast(`${request.studentName}'s request was rejected and the student was notified.`, "info");
      setReviewRequest(null);
    } catch {
      toast("Couldn't reject the request. Please try again.", "error");
    } finally {
      setBusy(false);
    }
  };

  const clearStudentFilter = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("student");
    setSearchParams(next, { replace: true });
    setPage(1);
  };

  return (
    <div className="space-y-5">
      <PageBanner
        eyebrow="STUDENT SERVICES"
        title="Clearance Requests"
        subtitle="Review, sign and track student clearance requests for your office."
        right={
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-cpc-tile-border bg-white/80 px-3 py-1.5 font-poppins text-[11px] font-semibold text-cpc-navy-text">
              <ShieldCheck className="h-3.5 w-3.5 text-cpc-blue-accent" aria-hidden />
              {user.office ? `${OFFICE_LABELS[user.office]} office` : "All offices"}
            </span>
            <button
              type="button"
              onClick={() => void handleRefresh()}
              disabled={refreshing || loading}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-cpc-tile-border bg-white px-3 py-1.5 font-poppins text-[11px] font-semibold text-cpc-heading-soft transition-colors hover:bg-cpc-section-light hover:text-cpc-navy-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                className={cn("h-3.5 w-3.5", refreshing && "animate-spin")}
                aria-hidden
              />
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        }
      />

      {error && (
        <ErrorCard message={error} onRetry={() => void handleRefresh()} />
      )}

      {studentFilter && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-cpc-tile-border/70 bg-white px-3 py-2">
          <Filter className="h-3.5 w-3.5 text-cpc-blue-accent" aria-hidden />
          <span className="font-poppins text-[11px] text-cpc-heading-soft">
            Showing requests for student{" "}
            <strong className="font-semibold text-cpc-navy-text">{studentFilter}</strong>
          </span>
          <button
            type="button"
            onClick={clearStudentFilter}
            className="ml-auto inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 font-poppins text-[10px] font-semibold text-cpc-blue-accent transition-colors hover:bg-cpc-section-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
          >
            <X className="h-3 w-3" aria-hidden />
            Clear filter
          </button>
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-cpc-tile-border/70 bg-white">
        <div className="flex flex-wrap items-center gap-2 border-b border-cpc-tile-border/60 px-3 py-2.5">
          <div
            role="tablist"
            aria-label="Clearance request status"
            className="flex flex-wrap gap-1 rounded-xl bg-cpc-section-light/60 p-1"
          >
            {TABS.map((entry) => {
              const active = tab === entry.id;
              return (
                <button
                  key={entry.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => changeTab(entry.id)}
                  className={cn(
                    "inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-poppins text-[11px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent",
                    active
                      ? "bg-white text-cpc-blue-accent shadow-sm"
                      : "text-cpc-heading-soft hover:text-cpc-navy-text",
                  )}
                >
                  {entry.label}
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[9px] leading-none font-bold",
                      active
                        ? "bg-cpc-section-light text-cpc-blue-accent"
                        : "bg-white/70 text-cpc-heading-soft",
                    )}
                  >
                    {counts[entry.id]}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-1.5">
            <label className="relative">
              <span className="sr-only">Search clearance requests</span>
              <Search
                className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-cpc-heading-soft"
                aria-hidden
              />
              <input
                type="search"
                value={query}
                onChange={(event) => changeQuery(event.target.value)}
                placeholder="Search name, ID, program..."
                className="h-8 w-44 rounded-lg border border-cpc-tile-border bg-white pr-2.5 pl-8 font-poppins text-[11px] text-cpc-navy-text outline-none placeholder:text-cpc-heading-soft/70 focus:border-cpc-blue-accent focus:ring-2 focus:ring-cpc-blue-accent/20 sm:w-56"
              />
            </label>

            <label className="relative">
              <span className="sr-only">Sort by date requested</span>
              <ArrowDownUp
                className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-cpc-heading-soft"
                aria-hidden
              />
              <select
                value={sort}
                onChange={(event) => changeSort(event.target.value as SortId)}
                className="h-8 cursor-pointer appearance-none rounded-lg border border-cpc-tile-border bg-white pr-2.5 pl-8 font-poppins text-[11px] font-medium text-cpc-navy-text outline-none focus:border-cpc-blue-accent focus:ring-2 focus:ring-cpc-blue-accent/20"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
              </select>
            </label>
          </div>
        </div>

        {selectedRequests.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-b border-cpc-blue-accent/20 bg-cpc-section-light/70 px-3 py-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-cpc-blue-accent" aria-hidden />
            <span className="font-poppins text-[11px] font-semibold text-cpc-navy-text">
              {selectedRequests.length} pending request
              {selectedRequests.length === 1 ? "" : "s"} selected
            </span>
            <div className="ml-auto flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="cursor-pointer rounded-md px-2 py-1 font-poppins text-[10px] font-semibold text-cpc-heading-soft transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => openSignature(selectedRequests)}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-cpc-button px-2.5 py-1.5 font-poppins text-[10px] font-semibold text-white transition-colors hover:bg-cpc-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
              >
                <ShieldCheck className="h-3 w-3" aria-hidden />
                Approve selected ({selectedRequests.length})
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <TableSkeleton rows={8} />
        ) : pageRows.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title={query.trim() ? "No matching requests" : `No ${tab === "all" ? "" : tab} requests`}
            description={
              query.trim()
                ? "Try a different name, student ID or program, or switch tabs."
                : "New requests from students will appear here automatically."
            }
            action={
              query.trim() ? (
                <button
                  type="button"
                  onClick={() => changeQuery("")}
                  className="mt-1 cursor-pointer rounded-md border border-cpc-tile-border bg-white px-3 py-1.5 font-poppins text-[11px] font-semibold text-cpc-blue-accent transition-colors hover:bg-cpc-section-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
                >
                  Clear search
                </button>
              ) : undefined
            }
          />
        ) : (
          <ClearanceRequestTable
            requests={pageRows}
            selectedIds={selectedIds}
            onToggle={toggle}
            onToggleAll={toggleAll}
            onReview={setReviewRequest}
          />
        )}

        {!loading && filtered.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-cpc-tile-border/60 px-3 py-2.5">
            <p className="font-poppins text-[10px] text-cpc-heading-soft">
              Showing {(safePage - 1) * PAGE_SIZE + 1}–
              {Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={safePage <= 1}
                aria-label="Previous page"
                className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-cpc-tile-border bg-white text-cpc-heading-soft transition-colors hover:bg-cpc-section-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
              </button>
              <span className="px-1 font-poppins text-[10px] font-semibold text-cpc-navy-text">
                {safePage} / {pageCount}
              </span>
              <button
                type="button"
                onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
                disabled={safePage >= pageCount}
                aria-label="Next page"
                className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-cpc-tile-border bg-white text-cpc-heading-soft transition-colors hover:bg-cpc-section-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight className="h-3.5 w-3.5" aria-hidden />
              </button>
            </div>
          </div>
        )}
      </section>

      {reviewRequest && (
        <ReviewRequestModal
          key={reviewRequest.id}
          request={reviewRequest}
          onClose={() => setReviewRequest(null)}
          onApprove={(request) => openSignature([request])}
          onReject={handleReject}
          busy={busy}
        />
      )}

      {signatureTargets && (
        <SignaturePadModal
          key={signatureTargets.map((request) => request.id).join("-")}
          open
          onClose={() => {
            if (!busy) setSignatureTargets(null);
          }}
          count={signatureTargets.length}
          office={user.office ?? signatureTargets[0]?.office ?? "registrar"}
          signerName={user.name}
          userId={user.id}
          busy={busy}
          onConfirm={handleSignatureConfirm}
        />
      )}

      {busy && (
        <p role="status" className="sr-only">
          <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
          Saving your decision...
        </p>
      )}
    </div>
  );
}
