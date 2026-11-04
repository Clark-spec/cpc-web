import { z } from "zod";

/** +63 9XX XXX XXXX or 09XX XXX XXXX (spaces / hyphens optional). */
const PH_MOBILE_PATTERN = /^(?:\+63[\s-]?|0)9\d{2}[\s-]?\d{3}[\s-]?\d{4}$/;

export const CIVIL_STATUS_OPTIONS = ["Single", "Married", "Widowed", "Separated"] as const;

const requiredText = (label: string, min = 2, max = 80) =>
  z
    .string()
    .trim()
    .min(min, `${label} must be at least ${min} characters.`)
    .max(max, `${label} must be ${max} characters or fewer.`);

const personName = (label: string) =>
  requiredText(label, 2, 60).regex(
    /^[\p{L}.' -]+$/u,
    `${label} can only contain letters, spaces, hyphens and periods.`,
  );

const phone = z
  .string()
  .trim()
  .regex(PH_MOBILE_PATTERN, "Enter a valid PH mobile number, e.g. +63 912 345 6789.");

/** Empty string is allowed; anything else must be a valid PH mobile number. */
const optionalPhone = z
  .string()
  .trim()
  .refine((value) => value === "" || PH_MOBILE_PATTERN.test(value), {
    message: "Enter a valid PH mobile number, e.g. +63 912 345 6789.",
  });

export const profileFormSchema = z.object({
  phone,
  alternateContact: optionalPhone,
  address: z.object({
    street: requiredText("Street / Purok"),
    barangay: requiredText("Barangay"),
    city: requiredText("City / Municipality"),
    province: requiredText("Province"),
  }),
  civilStatus: z.enum(CIVIL_STATUS_OPTIONS, {
    message: "Choose a civil status.",
  }),
  religion: requiredText("Religion", 2, 40),
  nationality: requiredText("Nationality", 2, 40),
  motherName: personName("Mother's name"),
  fatherName: personName("Father's name"),
  guardianName: personName("Guardian's name"),
  guardianContact: optionalPhone,
  avatarUrl: z.string().optional(),
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;

/** Normalises a PH mobile number to the +63 9XX XXX XXXX display format. */
export function normalizePhone(value: string): string {
  const digits = value.replace(/[^\d]/g, "");
  const local = digits.startsWith("63") ? `0${digits.slice(2)}` : digits;
  const national = local.startsWith("0") ? local.slice(1) : local;
  if (national.length !== 10) return value.trim();
  return `+63 ${national.slice(0, 3)} ${national.slice(3, 6)} ${national.slice(6)}`;
}
