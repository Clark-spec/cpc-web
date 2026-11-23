import { Badge } from "@/components/ui/badge";
import type { SaoEvent } from "@/types/clearance";

type EventsTableProps = {
  events: SaoEvent[];
};

/** Significant events / SAO activities with an attendance badge. */
export function EventsTable({ events }: EventsTableProps) {
  const normalized = events.map((event) => ({
    ...event,
    status: event.status ?? (event.attended ? "attended" : "pending"),
  }));

  return (
    <section aria-labelledby="events-heading" className="min-w-0">
      <div className="rounded-lg border border-cpc-input-border">
        <table className="w-full border-collapse font-poppins text-sm">
          <caption id="events-heading" className="sr-only">
            Significant events and SAO activities attended
          </caption>
          <thead>
            <tr className="bg-cpc-section-light text-left text-xs font-semibold text-cpc-label">
              <th scope="col" className="rounded-tl-lg px-4 py-3">
                Significant Events or SAO Activities Attended
              </th>
              <th scope="col" className="w-28 rounded-tr-lg px-4 py-3 text-right">
                Attendance
              </th>
            </tr>
          </thead>
          <tbody>
            {normalized.map((event, index) => {
              return (
                <tr
                  key={event.title}
                  className="border-t border-cpc-input-border/70 text-cpc-navy-text transition-colors hover:bg-cpc-section-light/40"
                >
                  <td className="relative px-4 py-2.5">
                    <span><span className="text-cpc-heading-soft">{index + 1}.</span> {event.title}</span>
                    {event.note && (
                      <div className="mt-1.5 ml-4 rounded-md border border-blue-100 bg-blue-50/80 px-2.5 py-1.5">
                        <p className="font-poppins text-[9px] font-bold uppercase tracking-wide text-blue-800">SAO note</p>
                        <p className="mt-0.5 font-poppins text-[11px] leading-relaxed text-blue-950">{event.note}</p>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {event.status === "attended" ? (
                      <Badge tone="success" size="sm">
                        Attended
                      </Badge>
                    ) : event.status === "not_attended" ? (
                      <Badge tone="danger" size="sm">Not Attended</Badge>
                    ) : (
                      <Badge tone="warning" size="sm" pulse>
                        Pending
                      </Badge>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-cpc-input-border bg-white font-semibold text-cpc-navy-text">
              <td className="px-4 py-2.5 sm:px-4 sm:py-3">
                Total Activities
              </td>
              <td className="px-4 py-2.5 text-right tabular-nums sm:px-4 sm:py-3">
                {normalized.filter((e) => e.status === "attended").length} / {events.length} Attended
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}

