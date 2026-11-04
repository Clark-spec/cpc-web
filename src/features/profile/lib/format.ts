import type { ProfileAddress } from "../types";

/** "2005-05-14" -> "May 14, 2005". Falls back to the raw value if unparseable. */
export function formatLongDate(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return isoDate;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** Compact relative label ("2 days ago") for the "last updated" tooltip. */
export function formatRelativeTime(isoDate: string): string {
  const then = new Date(isoDate).getTime();
  if (Number.isNaN(then)) return isoDate;
  const diffSeconds = Math.round((then - Date.now()) / 1000);
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 60 * 60 * 24 * 365],
    ["month", 60 * 60 * 24 * 30],
    ["week", 60 * 60 * 24 * 7],
    ["day", 60 * 60 * 24],
    ["hour", 60 * 60],
    ["minute", 60],
    ["second", 1],
  ];

  for (const [unit, seconds] of units) {
    if (Math.abs(diffSeconds) >= seconds || unit === "second") {
      return formatter.format(Math.round(diffSeconds / seconds), unit);
    }
  }
  return "just now";
}

/** "Harry Styles" -> "HS". */
export function initialsFromName(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/** "Purok 4, Brgy. Poblacion, Cordova, Cebu" (empty parts skipped). */
export function formatAddress(address: ProfileAddress): string {
  return [address.street, address.barangay, address.city, address.province]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(", ");
}
