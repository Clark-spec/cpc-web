/** Wire format returned by /api/academic-calendar/v1/events. */
export type CalendarEventDto = {
  id: string;
  title: string;
  description: string;
  category: string;
  startDate: string;
  endDate: string | null;
  startTime: string | null;
  endTime: string | null;
  allDay: boolean;
  schoolYear: string;
  semester: string;
  status: string;
  location: string | null;
  organizer: string | null;
  department: string | null;
  notes: string | null;
  programs: string[];
  targetAudience: string | null;
  createdByRole: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CalendarEventInput = {
  title: string;
  description: string;
  category: string;
  startDate: string;
  endDate: string | null;
  startTime: string | null;
  endTime: string | null;
  allDay: boolean;
  schoolYear: string;
  semester: string;
  status: string;
  location: string | null;
  organizer: string | null;
  department: string | null;
  notes: string | null;
  programs: string[];
  targetAudience: string | null;
};

export type CalendarEventFilters = {
  schoolYear?: string;
  semester?: string;
  category?: string;
  from?: string;
  to?: string;
  search?: string;
  page?: number;
  pageSize?: number;
};

export type CalendarEventsResponse = {
  events: CalendarEventDto[];
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};
