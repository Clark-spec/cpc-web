import { useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { useEnrollment } from "@/components/features/student/enrollment/useEnrollment";
import { validatePersonalInfo } from "@/components/features/student/enrollment/validation";
import type { PersonalInfo } from "@/components/features/student/enrollment/mockData";

const GENDER_OPTIONS = ["Male", "Female", "Other"];
const CIVIL_STATUS_OPTIONS = ["Single", "Married", "Widowed", "Divorced", "Separated"];

type FieldName = keyof PersonalInfo;

function Field({
  id,
  label,
  required,
  error,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="enroll-form-label">
        {label}
        {required && (
          <span className="text-sr-danger" aria-hidden>
            {" "}
            *
          </span>
        )}
      </label>
      {children}
      {error && (
        <span id={`${id}-error`} className="enroll-form-error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

export function PersonalInfoStep() {
  const { state, updatePersonalInfo } = useEnrollment();
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({});

  const errors = validatePersonalInfo(state.personalInfo);
  const errorFor = (field: FieldName) => (touched[field] ? errors[field] : undefined);

  const inputClass = (field: FieldName) => {
    const error = errorFor(field);
    const hasValue = Boolean(state.personalInfo[field]?.trim());
    return cn("enroll-form-input", error && "error", !error && touched[field] && hasValue && "valid");
  };

  const handleInputChange = (field: FieldName, value: string) => {
    updatePersonalInfo({ [field]: value });
    setTouched((prev) => (prev[field] ? prev : { ...prev, [field]: true }));
  };

  const handleBlur = (field: FieldName) => () => {
    setTouched((prev) => (prev[field] ? prev : { ...prev, [field]: true }));
  };

  const describedBy = (field: FieldName) => (errorFor(field) ? `${field}-error` : undefined);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-enroll-heading mb-2">Let&#39;s Get to Know You!</h3>
        <p className="text-sm text-enroll-muted">
          Start your enrollment journey by providing your personal information. Please make sure all details are accurate and up to date.
        </p>
        <p className="text-xs text-enroll-text mt-1">
          Complete all required fields marked with an asterisk (*) to continue.
        </p>
      </div>

      {/* Section 1: Basic Information */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-enroll-heading">Basic Information</h4>
        
        <div className="grid md:grid-cols-3 gap-6">
          <Field id="firstName" label="First Name" required error={errorFor("firstName")}>
            <input
              id="firstName"
              type="text"
              value={state.personalInfo.firstName || ""}
              onChange={(e) => handleInputChange("firstName", e.target.value)}
              onBlur={handleBlur("firstName")}
              className={inputClass("firstName")}
              placeholder="Enter first name"
              aria-invalid={errorFor("firstName") ? true : undefined}
              aria-describedby={describedBy("firstName")}
              required
            />
          </Field>

          <Field id="middleName" label="Middle Name" error={errorFor("middleName")}>
            <input
              id="middleName"
              type="text"
              value={state.personalInfo.middleName || ""}
              onChange={(e) => handleInputChange("middleName", e.target.value)}
              onBlur={handleBlur("middleName")}
              className={inputClass("middleName")}
              placeholder="Enter middle name"
              aria-invalid={errorFor("middleName") ? true : undefined}
              aria-describedby={describedBy("middleName")}
            />
          </Field>

          <Field id="lastName" label="Last Name" required error={errorFor("lastName")}>
            <input
              id="lastName"
              type="text"
              value={state.personalInfo.lastName || ""}
              onChange={(e) => handleInputChange("lastName", e.target.value)}
              onBlur={handleBlur("lastName")}
              className={inputClass("lastName")}
              placeholder="Enter last name"
              aria-invalid={errorFor("lastName") ? true : undefined}
              aria-describedby={describedBy("lastName")}
              required
            />
          </Field>

          <Field id="birthDate" label="Date of Birth" required error={errorFor("birthDate")}>
            <input
              id="birthDate"
              type="date"
              value={state.personalInfo.birthDate || ""}
              onChange={(e) => handleInputChange("birthDate", e.target.value)}
              onBlur={handleBlur("birthDate")}
              className={inputClass("birthDate")}
              aria-invalid={errorFor("birthDate") ? true : undefined}
              aria-describedby={describedBy("birthDate")}
              required
            />
          </Field>

          <Field id="gender" label="Gender" required error={errorFor("gender")}>
            <select
              id="gender"
              value={state.personalInfo.gender || ""}
              onChange={(e) => handleInputChange("gender", e.target.value)}
              onBlur={handleBlur("gender")}
              className={inputClass("gender")}
              aria-invalid={errorFor("gender") ? true : undefined}
              aria-describedby={describedBy("gender")}
              required
            >
              <option value="">Select gender</option>
              {GENDER_OPTIONS.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </Field>

          <Field id="civilStatus" label="Civil Status" required error={errorFor("civilStatus")}>
            <select
              id="civilStatus"
              value={state.personalInfo.civilStatus || ""}
              onChange={(e) => handleInputChange("civilStatus", e.target.value)}
              onBlur={handleBlur("civilStatus")}
              className={inputClass("civilStatus")}
              aria-invalid={errorFor("civilStatus") ? true : undefined}
              aria-describedby={describedBy("civilStatus")}
              required
            >
              <option value="">Select status</option>
              {CIVIL_STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </Field>

          <Field id="placeOfBirth" label="Place of Birth" required error={errorFor("placeOfBirth")}>
            <input
              id="placeOfBirth"
              type="text"
              value={state.personalInfo.placeOfBirth || ""}
              onChange={(e) => handleInputChange("placeOfBirth", e.target.value)}
              onBlur={handleBlur("placeOfBirth")}
              className={inputClass("placeOfBirth")}
              placeholder="Enter place of birth"
              aria-invalid={errorFor("placeOfBirth") ? true : undefined}
              aria-describedby={describedBy("placeOfBirth")}
              required
            />
          </Field>

          <Field id="nationality" label="Nationality" required error={errorFor("nationality")}>
            <input
              id="nationality"
              type="text"
              value={state.personalInfo.nationality || ""}
              onChange={(e) => handleInputChange("nationality", e.target.value)}
              onBlur={handleBlur("nationality")}
              className={inputClass("nationality")}
              placeholder="Enter nationality"
              aria-invalid={errorFor("nationality") ? true : undefined}
              aria-describedby={describedBy("nationality")}
              required
            />
          </Field>

          <Field id="religion" label="Religion">
            <select
              id="religion"
              value={state.personalInfo.religion || ""}
              onChange={(e) => handleInputChange("religion", e.target.value)}
              onBlur={handleBlur("religion")}
              className={cn(
                "enroll-form-input",
                touched.religion && state.personalInfo.religion && "valid",
              )}
            >
              <option value="">Select religion</option>
              <option value="Roman Catholic">Roman Catholic</option>
              <option value="Islam">Islam</option>
              <option value="Protestant">Protestant</option>
              <option value="Other Christian">Other Christian</option>
              <option value="Other">Other</option>
            </select>
          </Field>
        </div>
      </div>

      {/* Section 2: Contact Information */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-enroll-heading">Contact Information</h4>
        
        <div className="grid md:grid-cols-3 gap-6">
          <Field id="email" label="Email Address" required error={errorFor("email")}>
            <input
              id="email"
              type="email"
              value={state.personalInfo.email || ""}
              onChange={(e) => handleInputChange("email", e.target.value)}
              onBlur={handleBlur("email")}
              className={inputClass("email")}
              placeholder="your.email@example.com"
              aria-invalid={errorFor("email") ? true : undefined}
              aria-describedby={describedBy("email")}
              required
            />
          </Field>

          <Field id="contactNumber" label="Contact Number" required error={errorFor("contactNumber")}>
            <input
              id="contactNumber"
              type="tel"
              value={state.personalInfo.contactNumber || ""}
              onChange={(e) => handleInputChange("contactNumber", e.target.value)}
              onBlur={handleBlur("contactNumber")}
              className={inputClass("contactNumber")}
              placeholder="09xxxxxxxxx"
              aria-invalid={errorFor("contactNumber") ? true : undefined}
              aria-describedby={describedBy("contactNumber")}
              required
            />
          </Field>

          <Field id="homeAddress" label="Home Address" required error={errorFor("homeAddress")}>
            <input
              id="homeAddress"
              type="text"
              value={state.personalInfo.homeAddress || ""}
              onChange={(e) => handleInputChange("homeAddress", e.target.value)}
              onBlur={handleBlur("homeAddress")}
              className={inputClass("homeAddress")}
              placeholder="Enter home address"
              aria-invalid={errorFor("homeAddress") ? true : undefined}
              aria-describedby={describedBy("homeAddress")}
              required
            />
          </Field>
        </div>
      </div>

      {/* Section 3: Emergency Contact */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-enroll-heading">Emergency Contact</h4>
        
        <div className="grid md:grid-cols-3 gap-6">
          <Field id="contactPerson" label="Contact Person" required error={errorFor("contactPerson")}>
            <input
              id="contactPerson"
              type="text"
              value={state.personalInfo.contactPerson || ""}
              onChange={(e) => handleInputChange("contactPerson", e.target.value)}
              onBlur={handleBlur("contactPerson")}
              className={inputClass("contactPerson")}
              placeholder="Enter contact person's name"
              aria-invalid={errorFor("contactPerson") ? true : undefined}
              aria-describedby={describedBy("contactPerson")}
              required
            />
          </Field>

          <Field id="relationship" label="Relationship" required error={errorFor("relationship")}>
            <select
              id="relationship"
              value={state.personalInfo.relationship || ""}
              onChange={(e) => handleInputChange("relationship", e.target.value)}
              onBlur={handleBlur("relationship")}
              className={inputClass("relationship")}
              aria-invalid={errorFor("relationship") ? true : undefined}
              aria-describedby={describedBy("relationship")}
              required
            >
              <option value="">Select relationship</option>
              <option value="Father">Father</option>
              <option value="Mother">Mother</option>
              <option value="Father/Mother">Father/Mother</option>
              <option value="Sibling">Sibling</option>
              <option value="Guardian">Guardian</option>
              <option value="Relative">Relative</option>
              <option value="Friend">Friend</option>
            </select>
          </Field>

          <Field id="emergencyContact" label="Contact Number" required error={errorFor("emergencyContact")}>
            <input
              id="emergencyContact"
              type="tel"
              value={state.personalInfo.emergencyContact || ""}
              onChange={(e) => handleInputChange("emergencyContact", e.target.value)}
              onBlur={handleBlur("emergencyContact")}
              className={inputClass("emergencyContact")}
              placeholder="09xxxxxxxxx"
              aria-invalid={errorFor("emergencyContact") ? true : undefined}
              aria-describedby={describedBy("emergencyContact")}
              required
            />
          </Field>
        </div>
      </div>
    </div>
  );
}