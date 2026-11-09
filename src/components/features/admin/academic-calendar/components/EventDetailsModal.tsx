import type { ReactNode } from "react";
import {
  Archive,
  Ban,
  Building2,
  CalendarDays,
  Clock3,
  Eye,
  EyeOff,
  FileText,
  MapPin,
  PencilLine,
  RotateCcw,
  Send,
  Trash2,
  UserRound,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/cn";
import {
  CATEGORY_META,
  STATUS_META,
  eventDateRange,
  formatTimeRange,
  type AdminCalendarEvent,
} from "../data/academicCalendar";
import {
  CategoryBadge,
  EventTypeIcon,
  StatusBadge,
  primaryButtonClass,
  secondaryButtonClass,
} from "./CalendarPieces";

export type EventDetailAction =
  | "publish"
  | "unpublish"
  | "archive"
  | "restore"
  | "cancel"
  | "delete";

type EventDetailsModalProps = {
  event: AdminCalendarEvent;
  onClose: () => void;
  onEdit: (event: AdminCalendarEvent) => void;
  onAction: (action: EventDetailAction, event: AdminCalendarEvent) => void;
};

function MetaItem({
  icon,
  label,
  children,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-cpc-tile-border/70 bg-cpc-section-light/45 px-3 py-2">
      <span className="mt-0.5 text-cpc-blue-accent" aria-hidden>
        {icon}
      </span>
      <div className="min-w-0">
        <p className="font-poppins text-[10px] font-bold tracking-[0.12em] text-cpc-heading-soft uppercase">
          {label}
        </p>
        <p className="mt-0.5 font-poppins text-xs leading-snug font-semibold break-words text-cpc-navy-text">
          {children}
        </p>
      </div>
    </div>
  );
}

export function EventDetailsModal({ event, onClose, onEdit, onAction }: EventDetailsModalProps) {
  const meta = CATEGORY_META[event.category];
  const status = STATUS_META[event.status];

  return (
    <Modal open onClose={onClose} labelledBy="calendar-event-details-title" className="sm:max-w-xl">
      <div className={cn("border-b px-5 pt-5 pb-4 pr-12", meta.softClass)}>
        <div className="flex items-start gap-3">
          <EventTypeIcon event={event} className="h-9 w-9" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <CategoryBadge category={event.category} />
              <StatusBadge status={event.status} />
            </div>
            <h2
              id="calendar-event-details-title"
              className={cn(
                "mt-1.5 font-poppins text-lg leading-tight font-bold text-cpc-blue-accent",
                event.status === "cancelled" && "line-through opacity-70",
              )}
            >
              {event.title}
            </h2>
            <p className="mt-1 font-poppins text-xs font-medium text-cpc-heading-soft">
              {eventDateRange(event)} · {formatTimeRange(event)}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3.5 px-5 py-4">
        <p className="font-poppins text-xs leading-relaxed text-cpc-navy-text">
          {event.description}
        </p>

        <div className="grid gap-1.5 sm:grid-cols-2">
          <MetaItem icon={<CalendarDays className="h-3.5 w-3.5" />} label="Date">
            {eventDateRange(event)}
          </MetaItem>
          <MetaItem icon={<Clock3 className="h-3.5 w-3.5" />} label="Time">
            {formatTimeRange(event)}
          </MetaItem>
          <MetaItem icon={<FileText className="h-3.5 w-3.5" />} label="Academic period">
            A.Y. {event.academicYear} · {event.semester}
          </MetaItem>
          <MetaItem icon={<UserRound className="h-3.5 w-3.5" />} label="Target audience">
            {event.targetAudience}
          </MetaItem>
          <MetaItem icon={<MapPin className="h-3.5 w-3.5" />} label="Location">
            {event.location ?? "Not specified"}
          </MetaItem>
          <MetaItem icon={<UserRound className="h-3.5 w-3.5" />} label="Organizer">
            {event.organizer ?? "Not specified"}
          </MetaItem>
          {event.department && (
            <MetaItem icon={<Building2 className="h-3.5 w-3.5" />} label="Responsible office">
              {event.department}
            </MetaItem>
          )}
          <MetaItem icon={<Building2 className="h-3.5 w-3.5" />} label="Applicable programs">
            {event.programs.length > 0 ? event.programs.join(", ") : "Whole institution"}
          </MetaItem>
        </div>

        {event.notes && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
            <p className="font-poppins text-[10px] font-bold tracking-[0.12em] text-amber-700 uppercase">
              Internal notes
            </p>
            <p className="mt-0.5 font-poppins text-[11px] leading-relaxed text-amber-900">
              {event.notes}
            </p>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-cpc-tile-border/70 pt-2.5 font-poppins text-[11px] text-cpc-heading-soft">
          <span>
            Status: <span className="font-semibold text-cpc-navy-text">{status.label}</span> ·{" "}
            {status.helper}
          </span>
          <span>Updated {new Date(event.updatedAt).toLocaleString()}</span>
        </div>

        <p className="font-poppins text-[11px] leading-relaxed text-cpc-heading-soft">
          Publication status is stored in local frontend state for this demo. It does not
          distribute the event to student accounts through a backend.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-cpc-tile-border/60 bg-cpc-section-light/40 px-5 py-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {event.status !== "published" ? (
            <button
              type="button"
              onClick={() => onAction("publish", event)}
              className={primaryButtonClass()}
            >
              <Send className="h-3.5 w-3.5" aria-hidden />
              {event.status === "archived" || event.status === "cancelled"
                ? "Restore & Publish"
                : "Publish"}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onAction("unpublish", event)}
              className={secondaryButtonClass()}
            >
              <EyeOff className="h-3.5 w-3.5" aria-hidden />
              Unpublish
            </button>
          )}

          {event.status === "published" && (
            <button
              type="button"
              onClick={() => onAction("archive", event)}
              className={secondaryButtonClass()}
            >
              <Archive className="h-3.5 w-3.5" aria-hidden />
              Archive
            </button>
          )}

          {(event.status === "archived" || event.status === "cancelled") && (
            <button
              type="button"
              onClick={() => onAction("restore", event)}
              className={secondaryButtonClass()}
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden />
              Restore as Draft
            </button>
          )}

          {event.status !== "cancelled" && (
            <button
              type="button"
              onClick={() => onAction("cancel", event)}
              className={secondaryButtonClass()}
            >
              <Ban className="h-3.5 w-3.5" aria-hidden />
              Cancel Event
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onEdit(event)}
            className={secondaryButtonClass()}
          >
            <PencilLine className="h-3.5 w-3.5" aria-hidden />
            Edit
          </button>
          <button
            type="button"
            onClick={() => onAction("delete", event)}
            className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-2 font-poppins text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden />
            Delete
          </button>
        </div>
      </div>

      {event.status === "draft" && (
        <div className="flex items-center gap-1.5 border-t border-cpc-tile-border/60 bg-white px-5 py-2 font-poppins text-[11px] text-cpc-heading-soft">
          <Eye className="h-3 w-3" aria-hidden />
          Draft events are hidden from the student-facing calendar preview.
        </div>
      )}
    </Modal>
  );
}
