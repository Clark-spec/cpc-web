import {
  CATEGORY_META,
  STATUS_META,
  eventDateRange,
  formatTimeRange,
  type AdminCalendarEvent,
} from "../data/academicCalendar";

function csvCell(value: string | number | undefined): string {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

/** Frontend-only CSV download built from the current event list. */
export function downloadEventsCsv(
  events: AdminCalendarEvent[],
  label = "academic-calendar",
): void {
  const headers = [
    "Event ID",
    "Title",
    "Category",
    "Status",
    "Start date",
    "End date",
    "All day",
    "Start time",
    "End time",
    "Academic year",
    "Semester",
    "Target audience",
    "Programs",
    "Location",
    "Organizer",
    "Responsible office",
    "Description",
  ];

  const rows = events.map((event) =>
    [
      event.id,
      event.title,
      CATEGORY_META[event.category].label,
      STATUS_META[event.status].label,
      event.startDate,
      event.endDate ?? "",
      event.allDay ? "Yes" : "No",
      event.startTime ?? "",
      event.endTime ?? "",
      event.academicYear,
      event.semester,
      event.targetAudience,
      event.programs.join("; "),
      event.location ?? "",
      event.organizer ?? "",
      event.department ?? "",
      event.description,
    ]
      .map(csvCell)
      .join(","),
  );

  const csv = [headers.map(csvCell).join(","), ...rows].join("\r\n");
  const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `cpc-${label.replace(/[^a-z0-9-]+/gi, "-").toLowerCase()}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Opens the browser print dialog with a clean, standalone schedule sheet.
 * Rendering into an iframe keeps the admin sidebar and top bar out of the page.
 */
export function printEvents(
  events: AdminCalendarEvent[],
  title: string,
  subtitle: string,
): void {
  const rows = events
    .map(
      (event) => `
        <tr>
          <td>
            <strong>${escapeHtml(event.title)}</strong>
            <div class="muted">${escapeHtml(CATEGORY_META[event.category].label)}${
              event.location ? ` · ${escapeHtml(event.location)}` : ""
            }</div>
          </td>
          <td>${escapeHtml(eventDateRange(event))}<div class="muted">${escapeHtml(
            formatTimeRange(event),
          )}</div></td>
          <td>${escapeHtml(event.academicYear)}<div class="muted">${escapeHtml(
            event.semester,
          )}</div></td>
          <td>${escapeHtml(STATUS_META[event.status].label)}</td>
        </tr>`,
    )
    .join("");

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    @page { size: A4 portrait; margin: 16mm; }
    * { box-sizing: border-box; }
    body { margin: 0; color: #18346f; font-family: "Poppins", "Inter", system-ui, sans-serif; }
    header { border-bottom: 2px solid #102a83; padding-bottom: 10px; margin-bottom: 14px; }
    .brand { font-size: 10px; font-weight: 700; letter-spacing: 0.16em; color: #2449a8; text-transform: uppercase; }
    h1 { font-size: 22px; margin: 4px 0 2px; color: #102a83; }
    .sub { font-size: 10px; color: #7183a6; }
    .meta { margin-top: 8px; font-size: 9px; color: #7183a6; }
    table { width: 100%; border-collapse: collapse; font-size: 9.5px; }
    th { text-align: left; font-size: 8px; letter-spacing: 0.06em; text-transform: uppercase; color: #7183a6; border-bottom: 1px solid #d8e3f5; padding: 6px 5px; }
    td { border-bottom: 1px solid #e8eef9; padding: 6px 5px; vertical-align: top; }
    tr { page-break-inside: avoid; }
    .muted { color: #7183a6; font-size: 8.5px; margin-top: 1px; }
    footer { margin-top: 14px; border-top: 1px solid #d8e3f5; padding-top: 6px; font-size: 8px; color: #7183a6; }
    @media print { body { print-color-adjust: exact; } }
  </style>
</head>
<body>
  <header>
    <div class="brand">Cordova Public College · Academic Calendar</div>
    <h1>${escapeHtml(title)}</h1>
    <div class="sub">${escapeHtml(subtitle)}</div>
    <div class="meta">${events.length} event${events.length === 1 ? "" : "s"} · Generated ${escapeHtml(
      new Date().toLocaleString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }),
    )}</div>
  </header>
  <table>
    <thead>
      <tr>
        <th style="width: 42%">Event</th>
        <th style="width: 22%">Date &amp; time</th>
        <th style="width: 18%">Academic period</th>
        <th style="width: 18%">Status</th>
      </tr>
    </thead>
    <tbody>${rows || '<tr><td colspan="4">No events match the current filters.</td></tr>'}</tbody>
  </table>
  <footer>
    Frontend demo printout. Publication status and event records live in this browser session only
    and are not official institutional records.
  </footer>
</body>
</html>`;

  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.position = "fixed";
  frame.style.right = "0";
  frame.style.bottom = "0";
  frame.style.width = "0";
  frame.style.height = "0";
  frame.style.border = "0";
  document.body.appendChild(frame);

  const frameDocument = frame.contentWindow?.document;
  if (!frameDocument) {
    frame.remove();
    return;
  }

  frameDocument.open();
  frameDocument.write(html);
  frameDocument.close();

  window.setTimeout(() => {
    frame.contentWindow?.focus();
    frame.contentWindow?.print();
    window.setTimeout(() => frame.remove(), 1000);
  }, 150);
}
