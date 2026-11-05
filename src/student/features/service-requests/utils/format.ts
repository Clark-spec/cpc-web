import type { RequestStatus } from "@/services/student/serviceRequests";

const dateTimeFormatter = new Intl.DateTimeFormat("en-PH", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const dateFormatter = new Intl.DateTimeFormat("en-PH", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return dateTimeFormatter.format(date);
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return dateFormatter.format(date);
}

export function formatFileSize(bytes: number): string {
  if (!bytes) return "0 KB";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatRelativeTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const diff = Date.now() - date.getTime();
  const minutes = Math.round(diff / 60000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(value);
}

export const STATUS_BADGE_CLASSES: Record<RequestStatus, string> = {
  submitted: "border-[#F6DEB4] bg-[#FEF4E2] text-[#B7791F]",
  under_review: "border-[#CFE0FF] bg-[#E8F1FF] text-[#2F5FD0]",
  processing: "border-[#CFE0FF] bg-[#E8F1FF] text-[#3976D9]",
  ready_for_release: "border-[#E0D4FB] bg-[#F1EBFE] text-[#6B46C1]",
  released: "border-[#C4EBD9] bg-[#E3F7EE] text-[#1E8A57]",
  rejected: "border-[#F8CBCB] bg-[#FDECEC] text-[#C53030]",
};
