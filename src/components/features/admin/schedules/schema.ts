/**
 * zod schemas for the admin Class Schedules module.
 *
 * One schema per editable record, so the same rules run in the entry form, the
 * master-data tabs and the CSV import preview. The entry form's constraints
 * mirror the grid itself: 30-minute steps inside the 7:00 AM – 8:00 PM window,
 * which is what `utils/scheduleTime.ts` says the calendar renders.
 */
import { z } from "zod";
import { DAY_END_MIN, DAY_START_MIN } from "@/utils/scheduleTime";

const DAY_VALUES = ["MON", "TUE", "WED", "THU", "FRI", "SAT"] as const;
const STATUS_VALUES = ["active", "not_active"] as const;
const ROOM_TYPES = ["lab", "lecture", "online", "tent"] as const;

/** Half-hour steps, the grid's own snapping unit. */
const gridMinute = z
  .number()
  .int("Pick a time on the 30-minute grid.")
  .gte(DAY_START_MIN, "Classes start at 7:00 AM.")
  .lte(DAY_END_MIN, "Classes end by 8:00 PM.")
  .refine((value) => value % 30 === 0, "Times snap to 30-minute steps.");

export const entryFormSchema = z
  .object({
    section: z.enum(["BSIT-3A", "BSIT-3B", "BSIT-3C", "BSIT-3D"]),
    subjectId: z.string().min(1, "Choose a subject."),
    /** DaysPicker chips: at least one meeting day. */
    days: z.array(z.enum(DAY_VALUES)).min(1, "Pick at least one day."),
    startMin: gridMinute,
    endMin: gridMinute,
    roomAId: z.string().min(1, "Choose a Set A room."),
    roomBId: z.string().min(1, "Choose a Set B room."),
    instructorId: z.string().min(1, "Choose an instructor."),
    status: z.enum(STATUS_VALUES),
    /** Required rather than defaulted: `z.input` and `z.infer` must agree, or
     * react-hook-form's resolver types split in two. The form always seeds it. */
    note: z.string().max(240, "Keep the note under 240 characters."),
  })
  .refine((values) => values.endMin > values.startMin, {
    message: "The end time must be after the start time.",
    path: ["endMin"],
  });

export type EntryFormValues = z.infer<typeof entryFormSchema>;

export const subjectSchema = z.object({
  id: z.string().min(1),
  code: z.string().trim().min(1, "A subject code is required.").max(24),
  title: z.string().trim().min(1, "A title is required.").max(80),
  units: z
    .number()
    .int("Units are whole numbers.")
    .gte(0, "Units cannot be negative.")
    .lte(12, "Units cannot exceed 12."),
  colorKey: z.string().min(1, "Pick a legend colour."),
  active: z.boolean(),
});

export type SubjectFormValues = z.infer<typeof subjectSchema>;

export const instructorSchema = z.object({
  id: z.string().min(1),
  displayName: z.string().trim().min(1, "A display name is required.").max(40),
  fullName: z.string().trim().min(1, "A full name is required.").max(80),
  department: z.string().trim().min(1, "A department is required.").max(60),
  maxUnits: z
    .number()
    .int("Maximum units are whole numbers.")
    .gte(1, "Set a ceiling of at least 1 unit.")
    .lte(60, "Maximum units cannot exceed 60."),
  active: z.boolean(),
});

export type InstructorFormValues = z.infer<typeof instructorSchema>;

export const roomSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1, "A room name is required.").max(24),
  type: z.enum(ROOM_TYPES),
  /** Tent rooms and ONLINE have no seat count. */
  capacity: z
    .number()
    .int("Capacity is a whole number.")
    .gte(1, "Capacity must be at least 1.")
    .lte(500, "Capacity cannot exceed 500.")
    .optional()
    .nullable(),
  active: z.boolean(),
});

export type RoomFormValues = z.infer<typeof roomSchema>;

export const publishMessageSchema = z
  .string()
  .trim()
  .max(160, "Keep the message under 160 characters.")
  .optional();
