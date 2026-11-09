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
import { PageBanner } from "@/components/common/display/PageBanner";
import { EmptyState } from "@/components/common/display/EmptyState";
import { ErrorCard } from "@/components/common/feedback/ErrorCard";
import { DashboardSkeleton } from "@/components/common/display/Skeleton";
import { StatCard } from "@/components/features/admin/dashboard/StatCard";
import { EnrollmentChart } from "@/components/features/admin/dashboard/EnrollmentChart";
import { EnrollmentOverviewTable } from "@/components/features/admin/dashboard/EnrollmentOverviewTable";
import { QuickActions } from "@/components/features/admin/dashboard/QuickActions";
import { RecentActivityTable } from "@/components/features/admin/dashboard/RecentActivityTable";
import { StudentQuickViewDrawer } from "@/components/common/feedback/StudentQuickViewDrawer";
import { useAdminAuth } from "@/components/context/AdminAuthContext";
import { useAdminData } from "@/components/context/AdminDataContext";
import { formatDateTime } from "@/lib/format";
import type { ActivityStudent } from "@/types/admin";

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
        className="border-white/80 bg-white/75 shadow-[0_8px_30px_rgb(15,36,104,0.04)] backdrop-blur-md"
        eyebrow="STAFF PORTAL"
        title="Dashboard"
        subtitle={`Welcome back, ${user.name.split(" ")[0]}. Here's what needs your attention today.`}
        right={
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/80 px-3 py-1.5 font-poppins text-[11px] font-semibold text-cpc-navy-text shadow-xs backdrop-blur-sm">
              <CalendarDays className="h-3.5 w-3.5 text-cpc-blue-accent" aria-hidden />
              {today}
            </span>
            <button
              type="button"
              onClick={() => void handleRefresh()}
              disabled={refreshing || loading}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/80 bg-white/80 px-3 py-1.5 font-poppins text-[11px] font-semibold text-cpc-heading-soft shadow-xs backdrop-blur-sm transition-all hover:border-cpc-tile-border hover:bg-white hover:text-cpc-navy-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent disabled:cursor-not-allowed disabled:opacity-60"
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
                className="rounded-2xl border border-white/80 bg-white/75 p-8 shadow-[0_8px_30px_rgb(15,36,104,0.04)] backdrop-blur-md"
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

          <div className="grid items-stretch gap-6 xl:grid-cols-12">
            <section
              aria-labelledby="enrollment-overview-heading"
              className="flex flex-col justify-between overflow-hidden rounded-2xl border border-white/80 bg-white/75 shadow-[0_8px_30px_rgb(15,36,104,0.04)] backdrop-blur-md transition-all duration-200 hover:shadow-[0_16px_40px_rgba(15,36,104,0.08)] xl:col-span-8"
            >
              <div className="flex flex-wrap items-start justify-between gap-2 border-b border-cpc-tile-border/50 bg-white/40 px-5 py-4 backdrop-blur-xs">
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

              <div className="flex flex-1 flex-col justify-between gap-5 p-5">
                <EnrollmentChart rows={enrollment} />
                <EnrollmentOverviewTable rows={enrollment} />
              </div>
            </section>

            <section
              aria-labelledby="quick-actions-heading"
              className="flex flex-col justify-between overflow-hidden rounded-2xl border border-white/80 bg-white/75 shadow-[0_8px_30px_rgb(15,36,104,0.04)] backdrop-blur-md transition-all duration-200 hover:shadow-[0_16px_40px_rgba(15,36,104,0.08)] xl:col-span-4"
            >
              <div className="border-b border-cpc-tile-border/50 bg-white/40 px-5 py-4 backdrop-blur-xs">
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

              <div className="flex-1 p-4">
                <QuickActions
                  role={user.role}
                  counts={{
                    enrollments: stats.pendingEnrollments,
                    clearance: stats.pendingClearance,
                    serviceRequests: stats.openRequests,
                  }}
                />
              </div>

              <div className="grid grid-cols-1 gap-2.5 border-t border-cpc-tile-border/50 bg-white/40 px-4 py-3.5 backdrop-blur-xs sm:grid-cols-3">
                <div className="rounded-xl border border-emerald-200/60 bg-emerald-50/80 px-2 py-2 text-center backdrop-blur-xs">
                  <CheckCircle2 className="mx-auto h-3.5 w-3.5 text-emerald-600" aria-hidden />
                  <p className="mt-1 font-poppins text-base font-bold text-emerald-700 tabular-nums">
                    {stats.signedToday}
                  </p>
                  <p className="font-poppins text-[9px] font-medium text-emerald-700">
                    Signed today
                  </p>
                </div>
                <div className="rounded-xl border border-rose-200/60 bg-rose-50/80 px-2 py-2 text-center backdrop-blur-xs">
                  <XCircle className="mx-auto h-3.5 w-3.5 text-rose-600" aria-hidden />
                  <p className="mt-1 font-poppins text-base font-bold text-rose-700 tabular-nums">
                    {stats.rejectedClearance}
                  </p>
                  <p className="font-poppins text-[9px] font-medium text-rose-700">Rejected</p>
                </div>
                <div className="rounded-xl border border-cpc-tile-border/60 bg-cpc-section-light/80 px-2 py-2 text-center backdrop-blur-xs">
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
            className="overflow-hidden rounded-2xl border border-white/80 bg-white/75 shadow-[0_8px_30px_rgb(15,36,104,0.04)] backdrop-blur-md transition-all duration-200 hover:shadow-[0_16px_40px_rgba(15,36,104,0.08)]"
          >
            <div className="flex flex-wrap items-start justify-between gap-2 border-b border-cpc-tile-border/50 bg-white/40 px-5 py-4 backdrop-blur-xs">
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
