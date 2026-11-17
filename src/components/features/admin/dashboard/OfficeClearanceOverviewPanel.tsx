import { ArrowRight, CheckCircle2, Clock3, ShieldCheck, UserCheck, XCircle } from "lucide-react";
import { Link } from "react-router";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { visibleRequests } from "@/services/admin/clearanceAdapter";
import { isToday } from "@/services/admin/dashboard";
import { formatRelativeTime } from "@/lib/format";
import type { AdminUser, ClearanceRequestStatus } from "@/types/admin";

type OfficeClearanceOverviewPanelProps = {
  user: AdminUser;
};

const STATUS_TONES: Record<ClearanceRequestStatus, BadgeTone> = {
  pending: "warning",
  signed: "success",
  rejected: "danger",
};

export function OfficeClearanceOverviewPanel({ user }: OfficeClearanceOverviewPanelProps) {
  const requests = visibleRequests(user);
  const pendingRequests = requests.filter((r) => r.status === "pending");
  const signedToday = requests.filter((r) => r.status === "signed" && isToday(r.respondedAt));
  const rejectedCount = requests.filter((r) => r.status === "rejected").length;

  const officeTitle =
    user.role === "library"
      ? "Library"
      : user.role === "accounting"
        ? "Accounting Office"
        : user.role === "sao"
          ? "Student Affairs Office (SAO)"
          : "Office";

  const previewRequests = requests.slice(0, 4);

  return (
    <section
      aria-labelledby="office-overview-heading"
      className="flex flex-col justify-between overflow-hidden rounded-2xl border border-white/80 bg-white/75 shadow-[0_8px_30px_rgb(15,36,104,0.04)] backdrop-blur-md transition-all duration-200 hover:shadow-[0_16px_40px_rgba(15,36,104,0.08)] xl:col-span-8"
    >
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-cpc-tile-border/50 bg-white/40 px-5 py-4 backdrop-blur-xs">
        <div>
          <h2
            id="office-overview-heading"
            className="font-poppins text-sm font-semibold text-cpc-navy-text"
          >
            {officeTitle} Clearance Operations
          </h2>
          <p className="font-poppins text-[11px] text-cpc-heading-soft">
            Clearance verification queue, student accountability records, and approval status.
          </p>
        </div>
        <Link
          to="/admin/clearance-requests"
          className="inline-flex items-center gap-1 font-poppins text-[11px] font-semibold text-cpc-blue-accent underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
        >
          Open clearance queue
          <ArrowRight className="h-3 w-3" aria-hidden />
        </Link>
      </div>

      <div className="flex flex-1 flex-col justify-between gap-4 p-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-amber-200/60 bg-amber-50/70 p-3 shadow-xs">
            <span className="font-poppins text-[10px] font-medium text-amber-700 uppercase">
              Pending Verification
            </span>
            <div className="mt-1 flex items-center gap-1.5 font-poppins text-lg font-bold text-amber-800">
              <Clock3 className="h-4 w-4" />
              {pendingRequests.length}
            </div>
          </div>
          <div className="rounded-xl border border-emerald-200/60 bg-emerald-50/70 p-3 shadow-xs">
            <span className="font-poppins text-[10px] font-medium text-emerald-700 uppercase">
              Signed Today
            </span>
            <div className="mt-1 flex items-center gap-1.5 font-poppins text-lg font-bold text-emerald-800">
              <CheckCircle2 className="h-4 w-4" />
              {signedToday.length}
            </div>
          </div>
          <div className="rounded-xl border border-rose-200/60 bg-rose-50/70 p-3 shadow-xs">
            <span className="font-poppins text-[10px] font-medium text-rose-700 uppercase">
              Office Holds
            </span>
            <div className="mt-1 flex items-center gap-1.5 font-poppins text-lg font-bold text-rose-800">
              <XCircle className="h-4 w-4" />
              {rejectedCount}
            </div>
          </div>
          <div className="rounded-xl border border-white/80 bg-white/80 p-3 shadow-xs">
            <span className="font-poppins text-[10px] font-medium text-cpc-heading-soft uppercase">
              Total Queue
            </span>
            <div className="mt-1 flex items-center gap-1.5 font-poppins text-lg font-bold text-cpc-navy-text">
              <ShieldCheck className="h-4 w-4 text-cpc-blue-accent" />
              {requests.length}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="font-poppins text-xs font-semibold text-cpc-navy-text">
            Recent Clearance Requests
          </h3>

          {previewRequests.length === 0 ? (
            <div className="rounded-xl border border-dashed border-cpc-tile-border/70 p-6 text-center">
              <UserCheck className="mx-auto h-8 w-8 text-cpc-heading-soft/60" />
              <p className="mt-2 font-poppins text-xs font-medium text-cpc-navy-text">
                No clearance requests pending
              </p>
              <p className="mt-0.5 font-poppins text-[11px] text-cpc-heading-soft">
                When students submit clearance to your office, they will appear here.
              </p>
            </div>
          ) : (
            <div className="grid gap-2">
              {previewRequests.map((req) => (
                <div
                  key={req.id}
                  className="flex flex-col justify-between gap-2 rounded-xl border border-cpc-tile-border/50 bg-white/90 p-3 transition-all hover:border-cpc-blue-accent/30 sm:flex-row sm:items-center"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cpc-section-light font-poppins text-xs font-bold text-cpc-blue-accent">
                      {req.studentName.slice(0, 2).toUpperCase()}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-poppins text-xs font-bold text-cpc-navy-text">
                          {req.studentName}
                        </span>
                        <span className="font-mono text-[10px] text-cpc-heading-soft">
                          {req.studentId}
                        </span>
                      </div>
                      <p className="font-poppins text-[11px] text-cpc-heading-soft">
                        {req.program} • {req.yearLevel} ({req.section})
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <span className="font-poppins text-[10px] text-cpc-heading-soft">
                      {formatRelativeTime(req.requestedAt)}
                    </span>
                    <Badge tone={STATUS_TONES[req.status]} size="sm">
                      {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                    </Badge>
                    <Link
                      to="/admin/clearance-requests"
                      className="inline-flex items-center gap-1 rounded-lg border border-cpc-tile-border/80 bg-white px-2.5 py-1 font-poppins text-[10px] font-semibold text-cpc-navy-text shadow-xs hover:border-cpc-blue-accent hover:text-cpc-blue-accent"
                    >
                      Review
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
