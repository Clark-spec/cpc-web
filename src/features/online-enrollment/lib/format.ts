/** Long-form date for the status timeline. Unset dates read as "Pending". */
export function formatEnrollmentDate(dateString: string | null): string {
  if (!dateString) return "Pending";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** Date with time, used on the submission receipt. */
export function formatEnrollmentDateTime(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
