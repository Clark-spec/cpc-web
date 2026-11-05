import { useState } from "react";
import { Link } from "react-router";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useToast } from "@/components/ui/toast";
import { PageBanner } from "../components/PageBanner";
import { EmptyState } from "../components/EmptyState";
import { ErrorCard } from "../components/ErrorCard";
import { DashboardSkeleton } from "../components/Skeleton";
import { StatCard } from "../components/dashboard/StatCard";
import { EnrollmentChart } from "../components/dashboard/EnrollmentChart";
import { EnrollmentOverviewTable } from "../components/dashboard/EnrollmentOverviewTable";
import { QuickActions } from "../components/dashboard/QuickActions";
import { RecentActivityTable } from "../components/dashboard/RecentActivityTable";
import { StudentQuickViewDrawer } from "../components/dashboard/StudentQuickViewDrawer";
import { useAdminAuth } from "../context/AdminAuthContext";
import { useAdminData } from "../context/AdminDataContext";
import { formatDateTime } from "@/student/features/clearance/utils/format";
import type { ActivityStudent } from "../types";

/** Route: /admin/dashboard */
export default function DashboardPage() {
  const { user } = useAdminAuth();
  const { stats, enrollment, activity, loading, refreshing, error, refresh, lastUpdated } =
    useAdminData();
  const { toast } = useToast();
  const [student, setStudent] = useState<ActivityStudent | null>(null);

  if (!user) return null;

  const handleRefresh = async () => {
    await refresh();
    toast("Dashboard refreshed.", "success");
  };

  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-5">
      <PageBanner
        eyebrow="STAFF PORTAL"
        title="Dashboard"
        subtitle={`Welcome back, ${user.name.split(" ")[0]}. Here's what needs your attention today.`}
        right={
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-cpc-tile-border bg-white/80 px-3 py-1.5 font-poppins text-[11px] font-semibold text-cpc-navy-text">
              <CalendarDays className="h-3.5 w-3.5 text-cpc-blue-accent" aria-hidden />
              {today}
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
            {lastUpdated && (
              <span className="font-poppins text-[10px] text-cpc-heading-soft">
                Updated {formatDateTime(lastUpdated)}
              </span>
            )}
          </div>
        }
      />

      {loading ? (
        <DashboardSkeleton />
      ) : error && !stats ? (
        <ErrorCard message={error} onRetry={() => void handleRefresh()} />
      ) : stats ? (
        <>
          <section aria-label="Key metrics">
            {stats.stats.length === 0 ? (
              <EmptyState
                className="rounded-2xl border border-cpc-tile-border/70 bg-white"
                title="No metrics yet"
                description="Counts appear here as soon as requests start coming in."
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {stats.stats.map((stat, index) => (
                  <StatCard key={stat.id} stat={stat} index={index} />
                ))}
              </div>
            )}
          </section>

          <div className="grid gap-5 xl:grid-cols-12">
            <section
              aria-labelledby="enrollment-overview-heading"
              className="rounded-2xl border border-cpc-tile-border/70 bg-white xl:col-span-8"
            >
              <div className="flex flex-wrap items-start justify-between gap-2 border-b border-cpc-tile-border/60 px-4 py-3">
                <div>
                  <h2
                    id="enrollment-overview-heading"
                    className="font-poppins text-sm font-semibold text-cpc-navy-text"
                  >
                    Enrollment Overview
                  </h2>
                  <p className="font-poppins text-[11px] text-cpc-heading-soft">
                    Current applications and their status for AY 2026-2027.
                  </p>
                </div>
                <Link
                  to="/admin/enrollment/applications"
                  className="inline-flex items-center gap-1 font-poppins text-[11px] font-semibold text-cpc-blue-accent underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
                >
                  View all
                  <ArrowRight className="h-3 w-3" aria-hidden />
                </Link>
              </div>

              <div className="grid gap-4 p-4 lg:grid-cols-2">
                <EnrollmentChart rows={enrollment} />
                <EnrollmentOverviewTable rows={enrollment} />
              </div>
            </section>

            <section
              aria-labelledby="quick-actions-heading"
              className="rounded-2xl border border-cpc-tile-border/70 bg-white xl:col-span-4"
            >
              <div className="border-b border-cpc-tile-border/60 px-4 py-3">
                <h2
                  id="quick-actions-heading"
                  className="font-poppins text-sm font-semibold text-cpc-navy-text"
                >
                  Quick Actions
                </h2>
                <p className="font-poppins text-[11px] text-cpc-heading-soft">
                  Common administrator tasks
                </p>
              </div>

              <div className="p-3">
                <QuickActions
                  role={user.role}
                  counts={{
                    enrollments: stats.pendingEnrollments,
                    clearance: stats.pendingClearance,
                    serviceRequests: stats.openRequests,
                  }}
                />
              </div>

              <div className="grid grid-cols-1 gap-2 border-t border-cpc-tile-border/60 px-3 py-3 sm:grid-cols-3">
                <div className="rounded-lg bg-emerald-50 px-2 py-2 text-center">
                  <CheckCircle2 className="mx-auto h-3.5 w-3.5 text-emerald-600" aria-hidden />
                  <p className="mt-1 font-poppins text-base font-bold text-emerald-700 tabular-nums">
                    {stats.signedToday}
                  </p>
                  <p className="font-poppins text-[9px] font-medium text-emerald-700">
                    Signed today
                  </p>
                </div>
                <div className="rounded-lg bg-rose-50 px-2 py-2 text-center">
                  <XCircle className="mx-auto h-3.5 w-3.5 text-rose-600" aria-hidden />
                  <p className="mt-1 font-poppins text-base font-bold text-rose-700 tabular-nums">
                    {stats.rejectedClearance}
                  </p>
                  <p className="font-poppins text-[9px] font-medium text-rose-700">Rejected</p>
                </div>
                <div className="rounded-lg bg-cpc-section-light px-2 py-2 text-center">
                  <ShieldCheck className="mx-auto h-3.5 w-3.5 text-cpc-blue-accent" aria-hidden />
                  <p className="mt-1 font-poppins text-base font-bold text-cpc-blue-accent tabular-nums">
                    {stats.pendingClearance}
                  </p>
                  <p className="font-poppins text-[9px] font-medium text-cpc-blue-accent">
                    Pending
                  </p>
                </div>
              </div>
            </section>
          </div>

          <section
            aria-labelledby="recent-activity-heading"
            className="overflow-hidden rounded-2xl border border-cpc-tile-border/70 bg-white"
          >
            <div className="flex flex-wrap items-start justify-between gap-2 px-4 pt-3">
              <div>
                <h2
                  id="recent-activity-heading"
                  className="font-poppins text-sm font-semibold text-cpc-navy-text"
                >
                  Recent Activity
                </h2>
                <p className="font-poppins text-[11px] text-cpc-heading-soft">
                  Latest enrollment, clearance and support events.
                </p>
              </div>
            </div>

            <RecentActivityTable items={activity} onOpenStudent={setStudent} />
          </section>
        </>
      ) : null}

      <StudentQuickViewDrawer
        student={student}
        activity={activity}
        onClose={() => setStudent(null)}
      />
    </div>
  );
}
