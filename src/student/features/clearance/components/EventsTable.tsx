import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Info, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { SaoEvent } from "../types";

type EventsTableProps = {
  events: SaoEvent[];
};

/** Significant events / SAO activities with an attendance badge. */
export function EventsTable({ events }: EventsTableProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const tableRef = useRef<HTMLDivElement | null>(null);

  // Close the popover on outside click or Escape.
  useEffect(() => {
    if (openIndex === null) return;

    const handlePointer = (event: MouseEvent) => {
      if (
        tableRef.current &&
        event.target instanceof Node &&
        !tableRef.current.contains(event.target)
      ) {
        setOpenIndex(null);
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenIndex(null);
    };

    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [openIndex]);

  return (
    <section aria-labelledby="events-heading" className="min-w-0">
      <div ref={tableRef} className="rounded-lg border border-cpc-input-border">
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
            {events.map((event, index) => {
              const open = openIndex === index;
              const noteId = `event-note-${index}`;

              return (
                <tr
                  key={event.title}
                  className="border-t border-cpc-input-border/70 text-cpc-navy-text transition-colors hover:bg-cpc-section-light/40"
                >
                  <td className="relative px-4 py-2.5">
                    {event.attended ? (
                      <span>
                        <span className="text-cpc-heading-soft">{index + 1}.</span> {event.title}
                      </span>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => setOpenIndex(open ? null : index)}
                          aria-expanded={open}
                          aria-controls={noteId}
                          className="cursor-pointer text-left font-medium text-cpc-navy-text underline decoration-dotted underline-offset-4 transition-colors hover:text-cpc-blue-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
                        >
                          <span className="text-cpc-heading-soft">{index + 1}.</span> {event.title}
                        </button>

                        {open && (
                          <div
                            id={noteId}
                            role="note"
                            className="absolute top-full left-4 z-20 mt-1 w-[min(19rem,calc(100vw-3rem))] rounded-lg border border-amber-200 bg-white p-3 shadow-[0_12px_32px_rgba(27,47,158,0.18)]"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className="flex items-center gap-1.5 font-poppins text-xs font-semibold text-amber-700">
                                <Info className="h-3.5 w-3.5" aria-hidden />
                                What is missing?
                              </p>
                              <button
                                type="button"
                                onClick={() => setOpenIndex(null)}
                                aria-label="Close note"
                                className="rounded p-0.5 text-cpc-heading-soft transition-colors hover:text-cpc-navy-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
                              >
                                <X className="h-3 w-3" aria-hidden />
                              </button>
                            </div>
                            <p className="mt-1.5 font-poppins text-xs leading-relaxed text-cpc-heading-soft">
                              {event.note ??
                                "Your attendance record for this activity has not been submitted yet."}
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {event.attended ? (
                      <Badge tone="success">
                        <CheckCircle2 className="h-3 w-3" aria-hidden />
                        Attended
                      </Badge>
                    ) : (
                      <Badge tone="warning">
                        <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                        Pending
                      </Badge>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

