import type { ClearanceRequestRow } from "@/student/features/clearance/types";
import { OFFICE_LABELS } from "./officeChecks";
import { formatAge } from "./sla";

const CSV_HEADER = [
  "Student",
  "Student ID",
  "Section",
  "Program",
  "Office",
  "Status",
  "Requested",
  "Responded",
  "Age",
  "Overdue",
  "Student note",
  "Remarks",
  "Signed by",
];

/** Quotes, commas and newlines are the only things that break a CSV cell. */
function escapeCsv(value: string): string {
  const needsQuotes = /[",\r\n]/.test(value);
  const escaped = value.replace(/"/g, '""');
  return needsQuotes ? `"${escaped}"` : escaped;
}

export function rowsToCsv(rows: ClearanceRequestRow[]): string {
  const lines = rows.map((row) =>
    [
      row.studentName,
      row.studentId,
      row.section,
      row.program,
      OFFICE_LABELS[row.office],
      row.status,
      row.requestedAt ?? "",
      row.respondedAt ?? "",
      formatAge(row.ageHours),
      row.isOverdue ? "yes" : "no",
      row.studentNote ?? "",
      row.remarks ?? "",
      row.signerName ?? "",
    ]
      .map((cell) => escapeCsv(cell))
      .join(","),
  );

  return [CSV_HEADER.join(","), ...lines].join("\r\n");
}

/** Same byte-order-marked Blob download the class schedule export uses. */
export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([`${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
