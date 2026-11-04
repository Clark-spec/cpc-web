import type { FieldErrors, UseFormRegister } from "react-hook-form";
import type { ProfileFormValues } from "./schema";

export type EnrollmentStatus = "Enrolled" | "Not Enrolled";
export type Gender = "Male" | "Female" | "Prefer not to say";
export type CivilStatus = "Single" | "Married" | "Widowed" | "Separated";

export interface ProfileAddress {
  street: string;
  barangay: string;
  city: string;
  province: string;
}

export interface StudentProfile {
  /** "12345678" — registrar-managed, read-only. */
  studentId: string;
  fullName: string;
  program: string;
  yearLevel: string;
  section: string;
  enrollmentStatus: EnrollmentStatus;
  /** base64 data URL or remote URL. */
  avatarUrl?: string;
  /** Institutional address, read-only. */
  email: string;
  phone: string;
  alternateContact?: string;
  address: ProfileAddress;
  gender: Gender;
  /** ISO date (yyyy-mm-dd). */
  dateOfBirth: string;
  placeOfBirth: string;
  civilStatus: CivilStatus;
  religion: string;
  nationality: string;
  motherName: string;
  fatherName: string;
  guardianName: string;
  guardianContact?: string;
  /** ISO date-time of the last successful save. */
  updatedAt: string;
}

/** Fields the student is allowed to change. */
export type EditableField =
  | "phone"
  | "alternateContact"
  | "address"
  | "civilStatus"
  | "religion"
  | "nationality"
  | "motherName"
  | "fatherName"
  | "guardianName"
  | "guardianContact"
  | "avatarUrl";

/** Patch accepted by the mock service. */
export type ProfileUpdateInput = Partial<Pick<StudentProfile, EditableField>>;

export interface CorrectionRequestInput {
  /** Human-readable field name, e.g. "Date of Birth". */
  field: string;
  correctValue: string;
  reason: string;
  attachmentName?: string;
}

/** Props shared by the three information cards. */
export type ProfileCardProps = {
  profile: StudentProfile;
  editing: boolean;
  register: UseFormRegister<ProfileFormValues>;
  errors: FieldErrors<ProfileFormValues>;
  highlighted: ReadonlySet<EditableField>;
  onRequestCorrection: (fieldLabel: string) => void;
};
