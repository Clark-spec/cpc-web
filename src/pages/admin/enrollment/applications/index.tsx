import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { ClipboardList } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { PageBanner } from "@/components/common/PageBanner";
import { DashboardPanel } from "@/components/features/admin/enrollment/DashboardPanel";
import { EnrollmentStatCards } from "@/components/features/admin/enrollment/EnrollmentStatCards";
import { EnrollmentTrendChart } from "@/components/features/admin/enrollment/EnrollmentTrendChart";
import { ApplicationStatusDonut } from "@/components/features/admin/enrollment/ApplicationStatusDonut";
import { EnrollmentByProgram } from "@/components/features/admin/enrollment/EnrollmentByProgram";
import { EnrollmentApplicationsTable } from "@/components/features/admin/enrollment/EnrollmentApplicationsTable";
import { EnrollmentDetailsModal } from "@/components/features/admin/enrollment/EnrollmentDetailsModal";
import { RecentEnrollmentActivity } from "@/components/features/admin/enrollment/RecentEnrollmentActivity";
import { EnrollmentQuickActions } from "@/components/features/admin/enrollment/EnrollmentQuickActions";
import { useAdminAuth } from "@/components/context/AdminAuthContext";
import { useEnrollmentApplications } from "@/components/features/admin/enrollment/useEnrollmentApplications";
import {
  ENROLLMENT_STATUS_LABELS,
  type EnrollmentApplication,
  type EnrollmentStatusFilter,
} from "@/services/enrollmentAdmin";

export type EnrollmentView = "all" | "for-review" | "approved" | "needs-requirements";

type ViewMeta = {
  title: string;
  subtitle: string;
  tableTitle: string;
  tableSubtitle: string;
};

const VIEW_META: Record<EnrollmentView, ViewMeta> = {
  all: {
    title: "Enrollment Applications",
    subtitle:
      "Review, verify credentials, and keep every applicant moving through the enrollment pipeline.",
    tableTitle: "Enrollment Applications",
    tableSubtitle: "Review, verify credentials, and update applicant standings.",
  },
  "for-review": {
    title: "For Review",
    subtitle: "Verify submitted credentials and decide which applicants move forward.",
    tableTitle: "Enrollment Applications — For Review",
    tableSubtitle: "Applicants whose credentials are currently being verified.",
  },
  approved: {
    title: "Approved",
    subtitle: "Applicants who have completed their enrollment requirements.",
    tableTitle: "Enrollment Applications — Approved",
    tableSubtitle: "Applicants cleared for enrollment this intake.",
  },
  "needs-requirements": {
    title: "Needs Requirements",
    subtitle: "Follow up on missing documents so applicants can continue enrollment.",
    tableTitle: "Enrollment Applications — Needs Requirements",
    tableSubtitle: "Applicants with missing or unverified requirements.",
  },
};

const STATUS_ROUTES: Record<EnrollmentStatusFilter, string> = {
  all: "/admin/enrollment/applications",
  pending: "/admin/enrollment/applications?status=pending",
  "for-review": "/admin/enrollment/for-review",
  approved: "/admin/enrollment/approved",
  "needs-requirements": "/admin/enrollment/needs-requirements",
  rejected: "/admin/enrollment/applications?status=rejected",
};

function normalizeStatus(value: string | null): EnrollmentStatusFilter {
  return value && value in ENROLLMENT_STATUS_LABELS
    ? (value as EnrollmentStatusFilter)
    : "all";
}

/**
 * Enrollment queue pages: Applications, For Review, Approved and Needs
 * Requirements. The `view` prop pins a status page; "all" is the hub with the
 * statistics, analytics, activity feed and quick actions.
 */
export default function EnrollmentApplicationsPage({ view }: { view: EnrollmentView }) {
  const { user } = useAdminAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const {
    applications,
    activity,
    counts,
    newThisWeek,
    programs,
    trend,
    total,
    approve,
    reject,
  } = useEnrollmentApplications();

  const [selected, setSelected] = useState<{
    application: EnrollmentApplication;
    intent: "view" | "reject";
  } | null>(null);

  const meta = VIEW_META[view];
  const filter: EnrollmentStatusFilter =
    view === "all" ? normalizeStatus(searchParams.get("status")) : view;
  const lockedStatus = view === "all" ? undefined : view;

  if (!user) return null;

  const scopeCount = view === "all" ? total : counts[view];

  const changeFilter = (next: EnrollmentStatusFilter) => {
    if (view !== "all") return;
    const params = new URLSearchParams(searchParams);
    if (next === "all") {
      params.delete("status");
    } else {
      params.set("status", next);
    }
    setSearchParams(params, { replace: true });
  };

  const handleApprove = (application: EnrollmentApplication) => {
    approve(application.id);
    setSelected(null);
    toast(`${application.studentName}'s application was approved.`, "success");
  };

  const handleReject = (application: EnrollmentApplication) => {
    reject(application.id);
    setSelected(null);
    toast(`${application.studentName}'s application was returned to the applicant.`, "info");
  };

  return (
    <div className="space-y-5">
      <PageBanner
        eyebrow="ENROLLMENT"
        title={meta.title}
        subtitle={meta.subtitle}
        right={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-cpc-tile-border bg-white/80 px-3 py-1.5 font-poppins text-[11px] font-semibold text-cpc-navy-text">
            <ClipboardList className="h-3.5 w-3.5 text-cpc-blue-accent" aria-hidden />
            {scopeCount.toLocaleString()} application{scopeCount === 1 ? "" : "s"}
          </span>
        }
      />

      <section aria-labelledby="enrollment-statistics-heading" className="space-y-2.5">
        <div>
          <h2
            id="enrollment-statistics-heading"
            className="font-poppins text-[15px] leading-tight font-semibold text-admin-text"
          >
            Enrollment Statistics
          </h2>
          <p className="mt-0.5 font-poppins text-[11px] leading-snug text-admin-muted">
            Live counts from the current enrollment queue. Select a card to open that status.
          </p>
        </div>
        <EnrollmentStatCards
          counts={counts}
          newThisWeek={newThisWeek}
          total={total}
          activeStatus={filter}
          onSelect={(status) => navigate(STATUS_ROUTES[status])}
        />
      </section>

      {view === "all" && (
        <section aria-labelledby="enrollment-analytics-heading" className="space-y-2.5">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2
                id="enrollment-analytics-heading"
                className="font-poppins text-[15px] leading-tight font-semibold text-admin-text"
              >
                Overview &amp; Analytics
              </h2>
              <p className="mt-0.5 font-poppins text-[11px] leading-snug text-admin-muted">
                Application volume, pipeline mix and program distribution for this intake.
              </p>
            </div>
            <span className="rounded-full border border-admin-border bg-white px-2.5 py-1 font-poppins text-[10px] font-semibold text-admin-muted">
              8-week window
            </span>
          </div>

          <div className="grid items-start gap-3.5 xl:grid-cols-3">
            <DashboardPanel
              className="xl:col-span-2"
              title="Enrollment Trends"
              subtitle="Applications received and approved per week."
              action={
                <span className="rounded-full bg-admin-page px-2 py-0.5 font-poppins text-[9px] font-bold tracking-[0.08em] text-admin-muted uppercase">
                  Last 8 weeks
                </span>
              }
            >
              <EnrollmentTrendChart data={trend} />
            </DashboardPanel>

            <div className="space-y-3.5">
              <DashboardPanel
                title="Application Status"
                subtitle="Pipeline mix for the current intake."
              >
                <ApplicationStatusDonut counts={counts} />
              </DashboardPanel>
              <DashboardPanel
                title="Enrollment by Program"
                subtitle="Applicants grouped by degree program."
              >
                <EnrollmentByProgram programs={programs} />
              </DashboardPanel>
            </div>
          </div>
        </section>
      )}

      <EnrollmentApplicationsTable
        applications={applications}
        counts={counts}
        filter={filter}
        onFilterChange={changeFilter}
        lockedStatus={lockedStatus}
        title={meta.tableTitle}
        subtitle={meta.tableSubtitle}
        onView={(application) => setSelected({ application, intent: "view" })}
        onApprove={handleApprove}
        onReject={(application) => setSelected({ application, intent: "reject" })}
      />

      {view === "all" && (
        <div className="grid items-start gap-3.5 xl:grid-cols-3">
          <DashboardPanel
            className="xl:col-span-2"
            title="Recent Enrollment Activity"
            subtitle="Latest applicant submissions and registrar decisions."
            action={
              <Link
                to="/admin/enrollment/applications"
                className="rounded font-poppins text-[10.5px] font-semibold text-admin-secondary transition-colors hover:text-admin-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-info"
              >
                View all
              </Link>
            }
          >
            <RecentEnrollmentActivity items={activity} />
          </DashboardPanel>

          <DashboardPanel title="Quick Actions" subtitle="Common enrollment tasks.">
            <EnrollmentQuickActions />
          </DashboardPanel>
        </div>
      )}

      {selected && (
        <EnrollmentDetailsModal
          key={`${selected.application.id}-${selected.intent}-${selected.application.status}`}
          application={selected.application}
          initialIntent={selected.intent}
          onClose={() => setSelected(null)}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
    </div>
  );
}
