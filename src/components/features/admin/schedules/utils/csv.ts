/**
 * CSV helpers for the Class Schedules import/export.
 *
 * The file format is the one the spec fixes:
 *   section, subjectCode, days, start, end, roomA, roomB, instructor, status
 * Parsing lives here (pure functions) so the import modal only has to render
 * the verdicts and `importRows` only has to turn valid rows into entries.
 */
import type { DayCode, SectionSchedule } from "@/types/schedule";
import type { ImportRowInput } from "@/types/scheduleAdmin";
import { DAY_CODES, formatTime } from "@/utils/scheduleTime";

export const CSV_HEADER = [
  "section",
  "subjectCode",
  "days",
  "start",
  "end",
  "roomA",
  "roomB",
  "instructor",
  "status",
] as const;

/** Ready-to-download example so a teacher can copy the shape instead of guessing it. */
export const CSV_TEMPLATE = [
  CSV_HEADER.join(","),
  "BSIT-3A,HCI 1,MWF,10:00 AM,11:00 AM,LAB 2,ONLINE,I. Eda,Active",
  "BSIT-3A,SOC SCI 1,TTh,1:30 PM,3:00 PM,302,ONLINE,J. Cadungog,Active",
  "BSIT-3A,IM 2,SAT,7:00 AM,10:00 AM,LAB 1,LAB 1,E. Tajanlangit,Active",
].join("\r\n");

/* ------------------------------------------------------------------ days */

const DAY_BY_TOKEN: Record<string, DayCode> = {
  MON: "MON",
  MO: "MON",
  M: "MON",
  TUE: "TUE",
  TU: "TUE",
  T: "TUE",
  WED: "WED",
  WE: "WED",
  W: "WED",
  THU: "THU",
  TH: "THU",
  R: "THU",
  FRI: "FRI",
  FR: "FRI",
  F: "FRI",
  SAT: "SAT",
  SA: "SAT",
  S: "SAT",
};

/**
 * "MWF", "M W F", "Mon, Wed, Fri" and "TTh" all map to day codes. The scanner
 * always consumes the LONGEST token first, otherwise "MTH" would read M + T
 * and silently drop Thursday.
 */
export function parseCsvDays(value: string): DayCode[] {
  const letters = value.toUpperCase().replace(/[^A-Z]/g, "");
  const found = new Set<DayCode>();
  let index = 0;
  while (index < letters.length) {
    let matched: DayCode | null = null;
    for (let size = 3; size >= 1; size -= 1) {
      const token = letters.slice(index, index + size);
      const candidate = DAY_BY_TOKEN[token];
      if (candidate !== undefined) {
        matched = candidate;
        index += size;
        break;
      }
    }
    if (matched === null) {
      // Unknown letter: skip it rather than reject the whole row.
      index += 1;
      continue;
    }
    found.add(matched);
  }
  return DAY_CODES.filter((day) => found.has(day));
}

/* ------------------------------------------------------------------ time */

/**
 * "10:00 AM", "10:00AM", "14:00" and "2pm" all become minutes from midnight.
 * A 12-hour time with no marker is read as-is when it is <= 7 so 7:00 means
 * 7:00 AM; anything else without a marker must already be 24-hour.
 */
export function parseCsvTime(value: string): number | null {
  const text = value.trim().toLowerCase().replace(/\s+/g, "");
  const match = /^(\d{1,2})(?::(\d{2}))?(am|pm)?$/.exec(text);
  if (!match) return null;
  const rawHour = Number(match[1]);
  const minute = match[2] === undefined ? 0 : Number(match[2]);
  const marker = match[3];
  if (Number.isNaN(rawHour) || rawHour > 23 || minute > 59) return null;
  if (marker === undefined) {
    if (rawHour > 12) return rawHour * 60 + minute;
    // Bare "10:00" in a school timetable means 10 AM.
    return rawHour * 60 + minute;
  }
  const hour24 = marker === "am" ? (rawHour % 12) : ((rawHour % 12) + 12);
  return hour24 * 60 + minute;
}

/** Minutes back into the timetable's own display form, using the shared formatter. */
export function formatCsvTime(totalMinutes: number): string {
  return formatTime(totalMinutes);
}

/* -------------------------------------------------------------- encoding */

const escapeCell = (value: string): string =>
  /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;

export function toCsv(rows: readonly (readonly string[])[]): string {
  return rows.map((row) => row.map(escapeCell).join(",")).join("\r\n");
}

/** Minimal RFC-4180 reader: quoted cells, escaped "" and CRLF or LF line ends. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const source = text.replace(/^\uFEFF/, "");

  const endCell = () => {
    row.push(cell);
    cell = "";
  };
  const endRow = () => {
    endCell();
    rows.push(row);
    row = [];
  };

  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    if (quoted) {
      if (char === '"') {
        if (source[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        cell += char;
      }
      continue;
    }
    if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      endCell();
    } else if (char === "\n") {
      endRow();
    } else if (char === "\r") {
      if (source[i + 1] !== "\n") endRow();
    } else {
      cell += char;
    }
  }
  if (cell.length > 0 || row.length > 0) endRow();

  return rows.filter((items) => items.some((item) => item.trim().length > 0));
}

/** Header row -> `ImportRowInput` per line, tolerant of column order. */
export function rowsToImportInputs(rows: string[][]): ImportRowInput[] {
  const [header, ...body] = rows;
  const index = (name: string) =>
    header.findIndex((cell) => cell.trim().toLowerCase() === name.toLowerCase());
  const at = (row: string[], name: string) => {
    const position = index(name);
    return position === -1 ? "" : (row[position] ?? "").trim();
  };

  return body.map((row) => ({
    section: at(row, "section"),
    subjectCode: at(row, "subjectCode"),
    days: at(row, "days"),
    start: at(row, "start"),
    end: at(row, "end"),
    roomA: at(row, "roomA"),
    roomB: at(row, "roomB"),
    instructor: at(row, "instructor"),
    status: at(row, "status"),
  }));
}

/** Export view: whatever the toolbar is currently showing, in column order. */
export function buildExportRows(schedules: SectionSchedule[]): string[][] {
  const rows: string[][] = [[...CSV_HEADER]];
  for (const schedule of schedules) {
    for (const entry of schedule.entries) {
      rows.push([
        schedule.section,
        entry.subjectCode,
        entry.days.join("/"),
        formatCsvTime(entry.startMin),
        formatCsvTime(entry.endMin),
        entry.roomSetA,
        entry.roomSetB,
        entry.instructor,
        entry.status === "active" ? "Active" : "Not Active",
      ]);
    }
  }
  return rows;
}

/** Kept in one place so the browser-only concern stays out of the import modal. */
export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
