import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { ClipboardList } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { PageBanner } from "@/components/common/display/PageBanner";
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
    <div className="relative space-y-6">
      {/* Ambient soft glow background elements for glassmorphism depth */}
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
        className="pointer-events-none absolute bottom-10 left-1/4 h-80 w-80 rounded-full bg-emerald-500/4 blur-3xl"
      />

      <PageBanner
        eyebrow="ENROLLMENT"
        title={meta.title}
        subtitle={meta.subtitle}
        className="border-white/80 bg-white/75 shadow-[0_8px_30px_rgb(15,36,104,0.04)] backdrop-blur-md"
        right={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/80 px-3 py-1.5 font-poppins text-[11px] font-semibold text-cpc-navy-text shadow-xs backdrop-blur-sm">
            <ClipboardList className="h-3.5 w-3.5 text-cpc-blue-accent" aria-hidden />
            {scopeCount.toLocaleString()} application{scopeCount === 1 ? "" : "s"}
          </span>
        }
      />

      <section aria-labelledby="enrollment-statistics-heading" className="space-y-2.5">
        <div>
          <h2
            id="enrollment-statistics-heading"
            className="font-poppins text-[15px] leading-tight font-semibold text-cpc-navy-text"
          >
            Enrollment Statistics
          </h2>
          <p className="mt-0.5 font-poppins text-[11px] leading-snug text-cpc-heading-soft">
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
                className="font-poppins text-[15px] leading-tight font-semibold text-cpc-navy-text"
              >
                Overview &amp; Analytics
              </h2>
              <p className="mt-0.5 font-poppins text-[11px] leading-snug text-cpc-heading-soft">
                Application volume, pipeline mix and program distribution for this intake.
              </p>
            </div>
            <span className="rounded-full border border-cpc-tile-border/60 bg-white/80 px-2.5 py-1 font-poppins text-[10px] font-semibold text-cpc-heading-soft backdrop-blur-xs">
              8-week window
            </span>
          </div>

          <div className="grid items-stretch gap-6 xl:grid-cols-3">
            <DashboardPanel
              title="Enrollment Trends"
              subtitle="Weekly applications received vs. approved."
              action={
                <span className="rounded-full border border-white/80 bg-white/80 px-2.5 py-1 font-poppins text-[10px] font-semibold text-cpc-navy-text shadow-2xs backdrop-blur-xs">
                  Last 8 weeks
                </span>
              }
            >
              <EnrollmentTrendChart data={trend} />
            </DashboardPanel>

            <DashboardPanel
              title="Application Status"
              subtitle="Pipeline mix for the current intake."
              action={
                <span className="rounded-full border border-white/80 bg-white/80 px-2.5 py-1 font-poppins text-[10px] font-semibold text-cpc-navy-text shadow-2xs backdrop-blur-xs">
                  Queue mix
                </span>
              }
            >
              <ApplicationStatusDonut counts={counts} />
            </DashboardPanel>

            <DashboardPanel
              title="Enrollment by Program"
              subtitle="Applicants grouped by degree program."
              action={
                <span className="rounded-full border border-white/80 bg-white/80 px-2.5 py-1 font-poppins text-[10px] font-semibold text-cpc-navy-text shadow-2xs backdrop-blur-xs">
                  {programs.length} Programs
                </span>
              }
            >
              <EnrollmentByProgram programs={programs} />
            </DashboardPanel>
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
        <div className="grid items-stretch gap-6 xl:grid-cols-12">
          <DashboardPanel
            className="xl:col-span-8"
            title="Recent Enrollment Activity"
            subtitle="Latest applicant submissions and registrar decisions."
            action={
              <span className="rounded-full border border-white/80 bg-white/80 px-2.5 py-1 font-poppins text-[10px] font-semibold text-cpc-navy-text shadow-2xs backdrop-blur-xs">
                {activity.length} updates
              </span>
            }
          >
            <RecentEnrollmentActivity items={activity} />
          </DashboardPanel>

          <DashboardPanel
            className="xl:col-span-4"
            title="Quick Actions"
            subtitle="Common enrollment tasks and queue shortcuts."
          >
            <EnrollmentQuickActions counts={counts} total={total} />
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
