import { apiClient, ApiError, unwrap } from "@/lib/apiClient";
import type {
  AcademicEvent,
  CalendarCategory,
} from "@/components/features/student/academic-calendar/academicCalendar";
import type {
  CalendarEventDto,
  CalendarEventFilters,
  CalendarEventsResponse,
} from "./types";

type ApiEnvelope<T> = {
  code: number;
  status: string;
  message?: string;
  data?: T;
};

/**
 * The registrar stores eleven event categories; the student calendar keeps its
 * original six-colour design, so extra categories fold into the closest tone.
 */
const CATEGORY_MAP: Record<string, CalendarCategory> = {
  enrollment: "enrollment",
  examination: "examinations",
  holiday: "holiday",
  deadline: "enrollment-deadline",
  "school-event": "school-events",
  orientation: "school-events",
  graduation: "school-events",
  student: "school-events",
  "academic-activity": "academic-activities",
  faculty: "academic-activities",
  institutional: "academic-activities",
};

const FEATURED_CATEGORIES = new Set<CalendarCategory>([
  "enrollment",
  "examinations",
  "enrollment-deadline",
]);

function to12Hour(value: string): string {
  const [hours, minutes] = value.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return value;
  const suffix = hours >= 12 ? "PM" : "AM";
  const hour = hours % 12 || 12;
  return `${hour}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

function formatTimeRange(dto: CalendarEventDto): string | undefined {
  if (dto.allDay || !dto.startTime) return undefined;
  const start = to12Hour(dto.startTime);
  if (!dto.endTime) return start;
  return `${start} – ${to12Hour(dto.endTime)}`;
}

export function toStudentAcademicEvent(dto: CalendarEventDto): AcademicEvent {
  const category = CATEGORY_MAP[dto.category] ?? "school-events";
  const cancelled = dto.status === "cancelled";
  const reminderNote = dto.department
    ? `Responsible office: ${dto.department}.`
    : dto.allDay
      ? undefined
      : dto.location
        ? `Venue: ${dto.location}.`
        : undefined;

  return {
    id: dto.id,
    title: dto.title,
    category,
    start: dto.startDate,
    end: dto.endDate ?? undefined,
    cancelled,
    allDay: dto.allDay,
    time: formatTimeRange(dto),
    location: dto.location ?? undefined,
    description: dto.description || "No description provided.",
    featured: FEATURED_CATEGORIES.has(category),
    reminder: !cancelled && (category === "examinations" || category === "enrollment-deadline"),
    reminderNote,
  };
}

/** Published and cancelled events — the backend enforces the same visibility for student accounts. */
export async function getPublishedCalendarEvents(
  filters: CalendarEventFilters = {},
): Promise<AcademicEvent[]> {
  const response = await apiClient.get<ApiEnvelope<CalendarEventsResponse>>(
    "/academic-calendar/v1/events",
    { params: { pageSize: 500, ...filters } },
  );
  const data = unwrap<CalendarEventsResponse | undefined>(response.data);
  if (!data) throw new ApiError("Could not load the academic calendar.");
  return (data.events ?? []).map(toStudentAcademicEvent);
}
