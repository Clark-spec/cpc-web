import { apiClient, ApiError, unwrap, type NoRefreshConfig } from "@/lib/apiClient";
import type { AxiosRequestConfig } from "axios";
import type {
  AcademicYear,
  AdminCalendarEvent,
  EventCategory,
  EventStatus,
  Semester,
} from "@/components/features/admin/academic-calendar/data/academicCalendar";
import { ensureAdminSession, clearAdminBackendSession } from "@/services/complaints/admin-session";
import type {
  CalendarEventDto,
  CalendarEventInput,
  CalendarEventsResponse,
} from "./types";

type ApiEnvelope<T> = {
  code: number;
  status: string;
  message?: string;
  data?: T;
};

const CATEGORIES: EventCategory[] = [
  "enrollment",
  "examination",
  "school-event",
  "academic-activity",
  "holiday",
  "deadline",
  "orientation",
  "graduation",
  "faculty",
  "student",
  "institutional",
];

const STATUSES: EventStatus[] = ["draft", "pending", "published", "archived", "cancelled"];

function toCategory(value: string): EventCategory {
  return CATEGORIES.includes(value as EventCategory) ? (value as EventCategory) : "institutional";
}

function toStatus(value: string): EventStatus {
  return STATUSES.includes(value as EventStatus) ? (value as EventStatus) : "draft";
}

export function toAdminCalendarEvent(dto: CalendarEventDto): AdminCalendarEvent {
  return {
    id: dto.id,
    title: dto.title,
    description: dto.description,
    category: toCategory(dto.category),
    startDate: dto.startDate,
    endDate: dto.endDate ?? undefined,
    startTime: dto.startTime ?? undefined,
    endTime: dto.endTime ?? undefined,
    allDay: dto.allDay,
    academicYear: dto.schoolYear as AcademicYear,
    semester: dto.semester as Semester,
    programs: dto.programs ?? [],
    targetAudience: dto.targetAudience ?? "All Students",
    status: toStatus(dto.status),
    location: dto.location ?? undefined,
    organizer: dto.organizer ?? undefined,
    department: dto.department ?? undefined,
    notes: dto.notes ?? undefined,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

export function toCalendarEventInput(event: AdminCalendarEvent): CalendarEventInput {
  return {
    title: event.title,
    description: event.description,
    category: event.category,
    startDate: event.startDate,
    endDate: event.endDate ?? null,
    startTime: event.allDay ? null : (event.startTime ?? null),
    endTime: event.allDay ? null : (event.endTime ?? null),
    allDay: event.allDay,
    schoolYear: event.academicYear,
    semester: event.semester,
    status: event.status,
    location: event.location ?? null,
    organizer: event.organizer ?? null,
    department: event.department ?? null,
    notes: event.notes ?? null,
    programs: event.programs,
    targetAudience: event.targetAudience,
  };
}

async function withAdminToken<T>(run: (token: string) => Promise<T>): Promise<T> {
  const token = await ensureAdminSession();
  try {
    return await run(token);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      clearAdminBackendSession();
      return run(await ensureAdminSession());
    }
    throw error;
  }
}

function adminConfig(
  token: string,
  extra?: AxiosRequestConfig,
): AxiosRequestConfig & NoRefreshConfig {
  return {
    ...extra,
    headers: { ...extra?.headers, Authorization: `Bearer ${token}` },
    skipAuthRefresh: true,
  };
}

export async function listAdminCalendarEvents(): Promise<AdminCalendarEvent[]> {
  const response = await withAdminToken((token) =>
    apiClient.get<ApiEnvelope<CalendarEventsResponse>>(
      "/academic-calendar/v1/events",
      adminConfig(token, { params: { pageSize: 500, status: "all" } }),
    ),
  );
  const data = unwrap<CalendarEventsResponse | undefined>(response.data);
  if (!data) throw new ApiError("Could not load the academic calendar.");
  return (data.events ?? []).map(toAdminCalendarEvent);
}

export async function createAdminCalendarEvent(
  event: AdminCalendarEvent,
): Promise<AdminCalendarEvent> {
  const response = await withAdminToken((token) =>
    apiClient.post<ApiEnvelope<{ event: CalendarEventDto }>>(
      "/academic-calendar/v1/events",
      toCalendarEventInput(event),
      adminConfig(token),
    ),
  );
  const created = response.data?.data?.event;
  if (!created) throw new ApiError("The calendar event was not created.");
  return toAdminCalendarEvent(created);
}

export async function updateAdminCalendarEvent(
  id: string,
  event: AdminCalendarEvent,
): Promise<AdminCalendarEvent> {
  const response = await withAdminToken((token) =>
    apiClient.patch<ApiEnvelope<{ event: CalendarEventDto }>>(
      `/academic-calendar/v1/events/${id}`,
      toCalendarEventInput(event),
      adminConfig(token),
    ),
  );
  const updated = response.data?.data?.event;
  if (!updated) throw new ApiError("The calendar event could not be updated.");
  return toAdminCalendarEvent(updated);
}

/** Status-only writes (publish, unpublish, archive, restore, cancel). */
export async function setAdminCalendarEventStatus(
  id: string,
  status: EventStatus,
): Promise<AdminCalendarEvent> {
  const response = await withAdminToken((token) =>
    apiClient.patch<ApiEnvelope<{ event: CalendarEventDto }>>(
      `/academic-calendar/v1/events/${id}`,
      { status },
      adminConfig(token),
    ),
  );
  const updated = response.data?.data?.event;
  if (!updated) throw new ApiError("The calendar event status could not be updated.");
  return toAdminCalendarEvent(updated);
}

export async function deleteAdminCalendarEvent(id: string): Promise<void> {
  await withAdminToken((token) =>
    apiClient.delete(`/academic-calendar/v1/events/${id}`, adminConfig(token)),
  );
}
