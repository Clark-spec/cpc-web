import type { PersonalInfo, RequirementDocument } from "@/components/features/student/enrollment/mockData";

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const PHONE_PATTERN = /^\+?\d{10,13}$/;
export const NAME_PATTERN = /^[A-Za-zÀ-ÿ.'\-\s]+$/;

export const MAX_ID_PHOTO_BYTES = 2 * 1024 * 1024;
export const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024;

const IMAGE_TYPES = ["image/jpeg", "image/png"];
const DOCUMENT_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const DOCUMENT_EXTENSION_PATTERN = /\.(pdf|doc|docx)$/i;

export type PersonalInfoErrors = Partial<Record<keyof PersonalInfo, string>>;

export function normalizePhone(value: string | undefined): string {
  return (value ?? "").replace(/[\s()-]/g, "");
}

function nameError(value: string, label: string): string | undefined {
  if (!value) return `${label} is required.`;
  if (value.length < 2) return `${label} must be at least 2 characters.`;
  if (!NAME_PATTERN.test(value)) return "Use letters, spaces, hyphens, or apostrophes only.";
  return undefined;
}

/** Field-by-field rules used for live inline errors and for gating "Next". */
export function validatePersonalInfo(info: PersonalInfo): PersonalInfoErrors {
  const errors: PersonalInfoErrors = {};

  const firstName = info.firstName?.trim() ?? "";
  const firstNameError = nameError(firstName, "First name");
  if (firstNameError) errors.firstName = firstNameError;

  const middleName = info.middleName?.trim() ?? "";
  if (middleName && !NAME_PATTERN.test(middleName)) {
    errors.middleName = "Use letters, spaces, hyphens, or apostrophes only.";
  }

  const lastName = info.lastName?.trim() ?? "";
  const lastNameError = nameError(lastName, "Last name");
  if (lastNameError) errors.lastName = lastNameError;

  const birthDate = info.birthDate?.trim() ?? "";
  if (!birthDate) {
    errors.birthDate = "Date of birth is required.";
  } else {
    const parsed = new Date(birthDate);
    if (Number.isNaN(parsed.getTime())) {
      errors.birthDate = "Enter a valid date.";
    } else if (parsed.getTime() > Date.now()) {
      errors.birthDate = "Date of birth cannot be in the future.";
    }
  }

  if (!info.gender) errors.gender = "Select your gender.";
  if (!info.civilStatus) errors.civilStatus = "Select your civil status.";

  const placeOfBirth = info.placeOfBirth?.trim() ?? "";
  if (!placeOfBirth) errors.placeOfBirth = "Place of birth is required.";
  else if (placeOfBirth.length < 3) errors.placeOfBirth = "Place of birth must be at least 3 characters.";

  const nationality = info.nationality?.trim() ?? "";
  if (!nationality) errors.nationality = "Nationality is required.";
  else if (nationality.length < 3) errors.nationality = "Nationality must be at least 3 characters.";

  const email = info.email?.trim() ?? "";
  if (!email) errors.email = "Email address is required.";
  else if (!EMAIL_PATTERN.test(email)) errors.email = "Enter a valid email address, e.g. name@example.com.";

  const contactNumber = normalizePhone(info.contactNumber);
  if (!contactNumber) errors.contactNumber = "Contact number is required.";
  else if (!PHONE_PATTERN.test(contactNumber)) {
    errors.contactNumber = "Enter 10–13 digits, e.g. 09171234567.";
  }

  const homeAddress = info.homeAddress?.trim() ?? "";
  if (!homeAddress) errors.homeAddress = "Home address is required.";
  else if (homeAddress.length < 8) errors.homeAddress = "Enter your complete home address.";

  const contactPerson = info.contactPerson?.trim() ?? "";
  const contactPersonError = nameError(contactPerson, "Contact person");
  if (contactPersonError) errors.contactPerson = contactPersonError;

  if (!info.relationship) errors.relationship = "Select a relationship.";

  const emergencyContact = normalizePhone(info.emergencyContact);
  if (!emergencyContact) errors.emergencyContact = "Emergency contact number is required.";
  else if (!PHONE_PATTERN.test(emergencyContact)) {
    errors.emergencyContact = "Enter 10–13 digits, e.g. 09171234567.";
  } else if (contactNumber && emergencyContact === contactNumber) {
    errors.emergencyContact = "Use a different number from your contact number.";
  }

  return errors;
}

export function validateCourse(course: string): string | undefined {
  return course.trim() ? undefined : "Select your course.";
}

export function validateYearLevel(yearLevel: string): string | undefined {
  return yearLevel.trim() ? undefined : "Select your year level.";
}

export function validateSubjectSelection(count: number): string | undefined {
  return count > 0 ? undefined : "Select at least one subject to continue.";
}

export function validateRequirementFile(
  requirement: RequirementDocument,
  file: File,
): string | undefined {
  if (requirement.type === "ID Photo") {
    if (!IMAGE_TYPES.includes(file.type)) return "Upload a JPG or PNG image.";
    if (file.size > MAX_ID_PHOTO_BYTES) {
      return "The photo is larger than 2 MB. Please choose a smaller image.";
    }
    return undefined;
  }

  const isAccepted =
    DOCUMENT_TYPES.includes(file.type) ||
    DOCUMENT_EXTENSION_PATTERN.test(file.name) ||
    IMAGE_TYPES.includes(file.type);
  if (!isAccepted) return "Upload a PDF, Word document, or a JPG/PNG image.";
  if (file.size > MAX_DOCUMENT_BYTES) {
    return "The file is larger than 5 MB. Please choose a smaller file.";
  }
  return undefined;
}
