import { MessageSquareWarning, UserRound } from "lucide-react";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/components/features/student/service-requests/format";
import type { Complaint } from "./types";
import { ComplaintStatusBadge } from "./ComplaintStatusBadge";

type ComplaintTableProps = {
  complaints: Complaint[];
  loading?: boolean;
  /** Row just updated by a live office change; flashes once. */
  highlightId?: string | null;
};

const HEADINGS = [
  "Reference No.",
  "Subject",
  "Category",
  "Date Filed",
  "Status",
  "Response",
];

function ResponseCell({ remark }: { remark?: string }) {
  const text = remark?.trim();
  if (!text) {
    return <span className="font-poppins text-sm text-cpc-heading-soft">—</span>;
  }
  return (
    <p
      className="max-w-[18rem] truncate font-poppins text-xs leading-relaxed text-cpc-navy-text"
      title={text}
    >
      {text}
    </p>
  );
}

/** The "My Complaints" card: filed complaints with a mobile card layout. */
export function ComplaintTable({
  complaints,
  loading = false,
  highlightId,
}: ComplaintTableProps) {
  return (
    <section
      id="my-complaints"
      aria-labelledby="my-complaints-heading"
      className="scroll-mt-6 rounded-2xl border border-cpc-input-border bg-white shadow-[0_10px_30px_rgba(27,47,158,0.06)]"
    >
      <div className="flex flex-col gap-3 border-b border-cpc-input-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cpc-section-light text-cpc-blue-accent">
            <MessageSquareWarning className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <h2
              id="my-complaints-heading"
              className="font-poppins text-lg leading-tight font-bold text-cpc-navy-text"
            >
              My Complaints
            </h2>
            <p className="mt-0.5 font-poppins text-xs text-cpc-heading-soft">
              Track the complaints you filed and their current status.
            </p>
          </div>
        </div>

        <span className="inline-flex w-fit items-center rounded-full border border-cpc-tile-border bg-cpc-section-light px-3 py-1 font-poppins text-[11px] font-semibold text-cpc-navy-text">
          {complaints.length} {complaints.length === 1 ? "complaint" : "complaints"}
        </span>
      </div>

      <div className="p-4 sm:p-6">
        {complaints.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-cpc-tile-border bg-cpc-section-light/40 px-4 py-12 text-center">
            <MessageSquareWarning className="h-9 w-9 text-cpc-muted-blue" aria-hidden />
            <p className="mt-3 font-poppins text-sm font-semibold text-cpc-navy-text">
              {loading ? "Loading your complaints…" : "No complaints filed yet"}
            </p>
            <p className="mt-1 max-w-md font-poppins text-xs leading-relaxed text-cpc-heading-soft">
              {loading
                ? "Fetching your latest complaint records."
                : "Complaints you submit will appear here with their reference number, date filed, and status."}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto rounded-xl border border-cpc-input-border md:block">
              <table className="w-full min-w-[900px] border-collapse text-left">
                <thead className="bg-cpc-section-light">
                  <tr>
                    {HEADINGS.map((heading) => (
                      <th
                        key={heading}
                        scope="col"
                        className="px-4 py-3 font-poppins text-[11px] font-semibold tracking-[0.08em] text-cpc-heading-soft uppercase"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {complaints.map((complaint) => (
                    <tr
                      key={complaint.id}
                      className={cn(
                        "border-b border-cpc-input-border/70 transition-colors last:border-b-0 hover:bg-cpc-section-light/60",
                        highlightId === complaint.id && "profile-highlight",
                      )}
                    >
                      <td className="px-4 py-3">
                        <span className="font-poppins text-sm font-semibold whitespace-nowrap text-cpc-navy-text">
                          {complaint.referenceNumber}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-poppins text-sm leading-snug text-cpc-navy-text">
                            {complaint.subject}
                          </span>
                          {complaint.anonymous && (
                            <Badge tone="neutral" size="sm" icon={UserRound}>
                              Anonymous
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-poppins text-sm whitespace-nowrap text-cpc-heading-soft">
                        {complaint.category}
                      </td>
                      <td className="px-4 py-3 font-poppins text-sm whitespace-nowrap text-cpc-heading-soft">
                        {formatDate(complaint.filedAt)}
                      </td>
                      <td className="px-4 py-3">
                        <ComplaintStatusBadge status={complaint.status} />
                      </td>
                      <td className="px-4 py-3">
                        <ResponseCell remark={complaint.adminRemarks} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile stacked cards */}
            <div className="space-y-3 md:hidden">
              {complaints.map((complaint) => (
                <article
                  key={complaint.id}
                  className={cn(
                    "rounded-xl border border-cpc-input-border bg-white p-4 shadow-[0_6px_18px_rgba(27,47,158,0.05)]",
                    highlightId === complaint.id && "profile-highlight",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-poppins text-sm font-bold whitespace-nowrap text-cpc-navy-text">
                        {complaint.referenceNumber}
                      </p>
                      <p className="mt-1 font-poppins text-sm leading-snug text-cpc-navy-text">
                        {complaint.subject}
                      </p>
                      {complaint.anonymous && (
                        <Badge tone="neutral" size="sm" icon={UserRound} className="mt-1.5">
                          Anonymous
                        </Badge>
                      )}
                    </div>
                    <ComplaintStatusBadge status={complaint.status} />
                  </div>

                  <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2">
                    <div>
                      <dt className="font-poppins text-[10px] font-semibold tracking-[0.1em] text-cpc-heading-soft uppercase">
                        Category
                      </dt>
                      <dd className="font-poppins text-xs text-cpc-navy-text">
                        {complaint.category}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-poppins text-[10px] font-semibold tracking-[0.1em] text-cpc-heading-soft uppercase">
                        Date Filed
                      </dt>
                      <dd className="font-poppins text-xs text-cpc-navy-text">
                        {formatDate(complaint.filedAt)}
                      </dd>
                    </div>
                  </dl>

                  {complaint.adminRemarks?.trim() && (
                    <div className="mt-3 rounded-lg border border-cpc-tile-border bg-cpc-section-light/40 px-3 py-2">
                      <p className="font-poppins text-[10px] font-semibold tracking-[0.1em] text-cpc-heading-soft uppercase">
                        Student Support Response
                      </p>
                      <p className="mt-1 font-poppins text-xs leading-relaxed text-cpc-navy-text">
                        {complaint.adminRemarks}
                      </p>
                    </div>
                  )}
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
