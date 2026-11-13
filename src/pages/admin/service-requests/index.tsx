import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { ArrowLeft, ClipboardList, RefreshCw, ShieldAlert } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { PageBanner } from "@/components/common/display/PageBanner";
import { ConfirmDialog } from "@/components/common/feedback/ConfirmDialog";
import { ServiceRequestStatCards } from "@/components/features/admin/service-requests/ServiceRequestStatCards";
import { ServiceRequestTable } from "@/components/features/admin/service-requests/ServiceRequestTable";
import { ServiceRequestDetailsModal } from "@/components/features/admin/service-requests/ServiceRequestDetailsModal";
import { useAdminAuth } from "@/components/context/AdminAuthContext";
import { ApiError } from "@/lib/apiClient";
import { SERVICE_REQUEST_ADMIN_ROLES } from "@/lib/navigation";
import {
  DEFAULT_ADMIN_SERVICE_FILTERS,
  EMPTY_ADMIN_SERVICE_PAGINATION,
  EMPTY_ADMIN_SERVICE_SUMMARY,
  SERVICE_STATUS_LABELS,
  countActiveServiceRequests,
  type AdminServiceRequestDetail,
  type AdminServiceRequestFilters,
  type AdminServiceRequestListResult,
  type AdminServiceRequestRow,
  type AdminServiceRequestStatus,
} from "@/services/serviceRequests/admin";
import {
  listAdminServiceRequests,
  updateAdminServiceRequest,
} from "@/services/serviceRequests/adminApi";
import { getCatalog } from "@/services/serviceRequests/api";
import { getErrorMessage } from "@/services/serviceRequests/shared";
import type { ServiceOption } from "@/services/serviceRequests/types";

type PendingChange = {
  request: AdminServiceRequestRow;
  status: AdminServiceRequestStatus;
};

function statusToastTone(status: AdminServiceRequestStatus): "success" | "info" | "error" {
  if (status === "released") return "success";
  if (status === "rejected") return "error";
  return "info";
}

/**
 * Admin Service Request dashboard. Rows come from the shared admin API, so every
 * office with Student Services access sees and updates the same queue.
 */
export default function ServiceRequestsPage() {
  const { user } = useAdminAuth();
  const { toast } = useToast();

  const [filters, setFilters] = useState<AdminServiceRequestFilters>(
    DEFAULT_ADMIN_SERVICE_FILTERS,
  );
  const [result, setResult] = useState<AdminServiceRequestListResult | null>(null);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [viewing, setViewing] = useState<AdminServiceRequestRow | null>(null);
  const [pendingChange, setPendingChange] = useState<PendingChange | null>(null);

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  const setFilter = useCallback(
    <K extends keyof AdminServiceRequestFilters>(
      key: K,
      value: AdminServiceRequestFilters[K],
    ) => {
      setFilters((current) => ({
        ...current,
        [key]: value,
        ...(key === "page" ? {} : { page: 1 }),
      }));
    },
    [],
  );

  const resetFilters = useCallback(() => {
    setFilters((current) => ({
      ...DEFAULT_ADMIN_SERVICE_FILTERS,
      pageSize: current.pageSize,
    }));
  }, []);

  useEffect(() => {
    let active = true;
    // Typing in the search box settles before the request goes out.
    const delay = filters.search ? 300 : 0;
    const timer = window.setTimeout(() => {
      setLoading(true);
      listAdminServiceRequests(filters)
        .then((data) => {
          if (!active) return;
          setResult(data);
          setLoadError(null);
        })
        .catch((error) => {
          if (active) setLoadError(getErrorMessage(error));
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, delay);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [filters, reloadKey]);

  useEffect(() => {
    let active = true;
    getCatalog()
      .then(({ services: options }) => {
        if (active) setServices(options);
      })
      .catch(() => {
        // The filter falls back to "All Services"; the queue still loads.
      });
    return () => {
      active = false;
    };
  }, []);

  const patchRow = useCallback((updated: AdminServiceRequestDetail) => {
    setResult((current) => {
      if (!current) return current;
      const previous = current.requests.find((row) => row.id === updated.id);
      const summary =
        previous && previous.status !== updated.status
          ? {
              ...current.summary,
              [previous.status]: Math.max(0, current.summary[previous.status] - 1),
              [updated.status]: current.summary[updated.status] + 1,
            }
          : current.summary;

      return {
        ...current,
        requests: current.requests.map((row) =>
          row.id === updated.id ? { ...row, ...updated } : row,
        ),
        summary,
      };
    });
  }, []);

  const saveStatus = useCallback(
    async (request: AdminServiceRequestRow, status: AdminServiceRequestStatus) => {
      try {
        const updated = await updateAdminServiceRequest(
          request.id,
          { status },
          request.updatedAt,
        );
        patchRow(updated);
        toast(
          `${request.referenceNumber} moved to ${SERVICE_STATUS_LABELS[status]}.`,
          statusToastTone(status),
        );
        reload();
      } catch (error) {
        if (error instanceof ApiError && error.status === 409) {
          toast(error.message, "warning");
          reload();
          return;
        }
        toast(getErrorMessage(error), "error");
      }
    },
    [patchRow, reload, toast],
  );

  const handleChangeStatus = (
    request: AdminServiceRequestRow,
    status: AdminServiceRequestStatus,
  ) => {
    if (status === request.status) return;

    if (status === "released" || status === "rejected") {
      setPendingChange({ request, status });
      return;
    }

    void saveStatus(request, status);
  };

  const confirmPendingChange = () => {
    if (!pendingChange) return;
    const { request, status } = pendingChange;
    setPendingChange(null);
    void saveStatus(request, status);
  };

  const handleBulkStatus = async (
    ids: string[],
    status: AdminServiceRequestStatus,
  ) => {
    const rows = (result?.requests ?? []).filter(
      (row) => ids.includes(row.id) && row.status !== status,
    );
    if (rows.length === 0) return;

    const outcomes = await Promise.allSettled(
      rows.map((row) =>
        updateAdminServiceRequest(row.id, { status }, row.updatedAt),
      ),
    );
    const saved = outcomes.filter((outcome) => outcome.status === "fulfilled").length;
    const failed = outcomes.length - saved;

    toast(
      `${saved} request${saved === 1 ? "" : "s"} moved to ${SERVICE_STATUS_LABELS[status]}.${
        failed > 0 ? ` ${failed} could not be updated — reopen the queue to see the latest values.` : ""
      }`,
      failed > 0 ? "warning" : "info",
    );
    reload();
  };

  const handleSaved = (updated: AdminServiceRequestDetail) => {
    const previous = result?.requests.find((row) => row.id === updated.id);
    patchRow(updated);
    if (previous && previous.status !== updated.status) {
      toast(
        `${updated.referenceNumber} moved to ${updated.statusLabel}.`,
        statusToastTone(updated.status),
      );
    } else {
      toast(`Office remarks saved for ${updated.referenceNumber}.`, "success");
    }
    reload();
  };

  const handleConflict = (message: string) => {
    toast(message, "warning");
    reload();
  };

  if (!user) return null;

  /*
   * Sidebar visibility is not a permission check: a role without Student
   * Services access can still type this URL. The backend rejects those accounts
   * with 403, and this guard keeps the page from rendering a broken queue.
   */
  if (!SERVICE_REQUEST_ADMIN_ROLES.includes(user.role)) {
    return (
      <div className="mx-auto flex w-full max-w-xl flex-col items-center rounded-2xl border border-cpc-tile-border/70 bg-white px-6 py-14 text-center shadow-[0_18px_50px_rgba(15,36,104,0.12)]">
        <span
          aria-hidden
          className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-600"
        >
          <ShieldAlert className="h-6 w-6" />
        </span>
        <h1 className="mt-4 font-poppins text-lg font-bold text-cpc-navy-text">
          You don&apos;t have access to Service Requests
        </h1>
        <p className="mt-2 max-w-sm font-poppins text-xs leading-relaxed text-cpc-heading-soft">
          Service requests are handled by the Administrator, Registrar, SAO and
          the program Deans. Your account is not part of that group, so this page
          is unavailable.
        </p>
        <Link to="/admin/dashboard" className="cpc-btn cpc-btn-primary cpc-btn-sm mt-6">
          <ArrowLeft className="h-3.5 w-3.5 shrink-0" aria-hidden />
          Back to dashboard
        </Link>
      </div>
    );
  }

  const summary = result?.summary ?? EMPTY_ADMIN_SERVICE_SUMMARY;
  const pagination = result?.pagination ?? EMPTY_ADMIN_SERVICE_PAGINATION;
  const openCount = countActiveServiceRequests(summary);

  return (
    <div className="relative space-y-6">
      {/* Ambient soft glow elements for glassmorphism depth */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-16 -left-16 h-80 w-80 rounded-full bg-cpc-blue-accent/5 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/3 -right-16 h-96 w-96 rounded-full bg-cpc-navy/4 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-10 left-1/4 h-72 w-72 rounded-full bg-violet-500/4 blur-3xl"
      />

      <PageBanner
        className="border-white/80 bg-white/75 shadow-[0_8px_30px_rgb(15,36,104,0.04)] backdrop-blur-md"
        eyebrow="STUDENT SERVICES"
        title="Service Requests"
        subtitle="Review student document requests, ID replacements, certificate processing, and kiosk ticketing queues."
        right={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/80 px-3 py-1.5 font-poppins text-[11px] font-semibold text-cpc-navy-text shadow-xs backdrop-blur-sm">
            <ClipboardList className="h-3.5 w-3.5 text-cpc-blue-accent" aria-hidden />
            {openCount.toLocaleString()} active request{openCount === 1 ? "" : "s"}
          </span>
        }
      />

      {/* Statistics Section */}
      <section aria-labelledby="service-statistics-heading" className="space-y-4">
        <div className="flex items-center gap-3">
          <div>
            <h2
              id="service-statistics-heading"
              className="font-poppins text-[15px] leading-tight font-bold text-admin-text"
            >
              Service Request Statistics
            </h2>
            <p className="mt-0.5 font-poppins text-[11px] leading-snug text-admin-muted">
              Live counts from the current request queue, updated as statuses change.
            </p>
          </div>
        </div>
        <ServiceRequestStatCards summary={summary} />
      </section>

      {loadError && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="font-poppins text-xs leading-relaxed text-rose-700">{loadError}</p>
          <button
            type="button"
            onClick={reload}
            className="cpc-btn cpc-btn-secondary cpc-btn-sm shrink-0"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden />
            Retry
          </button>
        </div>
      )}

      {/* Queue Table */}
      <ServiceRequestTable
        requests={result?.requests ?? []}
        pagination={pagination}
        filters={filters}
        services={services}
        loading={loading}
        onFilterChange={setFilter}
        onResetFilters={resetFilters}
        onPageChange={(page) => setFilter("page", page)}
        onView={setViewing}
        onChangeStatus={handleChangeStatus}
        onBulkStatus={(ids, status) => void handleBulkStatus(ids, status)}
      />

      {viewing && (
        <ServiceRequestDetailsModal
          key={viewing.id}
          requestId={viewing.id}
          onClose={() => setViewing(null)}
          onSaved={handleSaved}
          onConflict={handleConflict}
        />
      )}

      <ConfirmDialog
        id="service-request-confirm-title"
        open={pendingChange !== null}
        onClose={() => setPendingChange(null)}
        onConfirm={confirmPendingChange}
        danger={pendingChange?.status === "rejected"}
        title={
          pendingChange?.status === "released"
            ? "Mark this request as released?"
            : "Reject this service request?"
        }
        confirmLabel={
          pendingChange?.status === "released" ? "Mark Released" : "Reject Request"
        }
        description={
          pendingChange ? (
            <>
              <span className="font-semibold text-admin-text">
                {pendingChange.request.referenceNumber}
              </span>{" "}
              for {pendingChange.request.student.name} will be moved to{" "}
              <span className="font-semibold text-admin-text">
                {SERVICE_STATUS_LABELS[pendingChange.status]}
              </span>
              .{" "}
              {pendingChange.status === "released"
                ? "The student will be notified that the document has been released."
                : "The student will be notified that the request needs to be corrected or resubmitted."}
            </>
          ) : null
        }
      />
    </div>
  );
}
