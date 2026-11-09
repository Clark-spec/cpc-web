import { useEnrollment } from "@/components/features/student/enrollment/useEnrollment";

const GENDER_OPTIONS = ["Male", "Female", "Other"];
const CIVIL_STATUS_OPTIONS = ["Single", "Married", "Widowed", "Divorced", "Separated"];

export function PersonalInfoStep() {
  const { state, updatePersonalInfo } = useEnrollment();

  const handleInputChange = (field: keyof typeof state.personalInfo, value: string) => {
    updatePersonalInfo({ [field]: value });
  };

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
          {/* Row 1 */}
          <div className="space-y-2">
            <label htmlFor="firstName" className="enroll-form-label">
              First Name *
            </label>
            <input
              id="firstName"
              type="text"
              value={state.personalInfo.firstName || ""}
              onChange={(e) => handleInputChange("firstName", e.target.value)}
              className="enroll-form-input"
              placeholder="Enter first name"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="middleName" className="enroll-form-label">
              Middle Name
            </label>
            <input
              id="middleName"
              type="text"
              value={state.personalInfo.middleName || ""}
              onChange={(e) => handleInputChange("middleName", e.target.value)}
              className="enroll-form-input"
              placeholder="Enter middle name"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="lastName" className="enroll-form-label">
              Last Name *
            </label>
            <input
              id="lastName"
              type="text"
              value={state.personalInfo.lastName || ""}
              onChange={(e) => handleInputChange("lastName", e.target.value)}
              className="enroll-form-input"
              placeholder="Enter last name"
              required
            />
          </div>

          {/* Row 2 */}
          <div className="space-y-2">
            <label htmlFor="birthDate" className="enroll-form-label">
              Date of Birth *
            </label>
            <input
              id="birthDate"
              type="date"
              value={state.personalInfo.birthDate || ""}
              onChange={(e) => handleInputChange("birthDate", e.target.value)}
              className="enroll-form-input"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="gender" className="enroll-form-label">
              Gender *
            </label>
            <select
              id="gender"
              value={state.personalInfo.gender || ""}
              onChange={(e) => handleInputChange("gender", e.target.value)}
              className="enroll-form-input"
              required
            >
              <option value="">Select gender</option>
              {GENDER_OPTIONS.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="civilStatus" className="enroll-form-label">
              Civil Status *
            </label>
            <select
              id="civilStatus"
              value={state.personalInfo.civilStatus || ""}
              onChange={(e) => handleInputChange("civilStatus", e.target.value)}
              className="enroll-form-input"
              required
            >
              <option value="">Select status</option>
              {CIVIL_STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          {/* Row 3 */}
          <div className="space-y-2">
            <label htmlFor="placeOfBirth" className="enroll-form-label">
              Place of Birth *
            </label>
            <input
              id="placeOfBirth"
              type="text"
              value={state.personalInfo.placeOfBirth || ""}
              onChange={(e) => handleInputChange("placeOfBirth", e.target.value)}
              className="enroll-form-input"
              placeholder="Enter place of birth"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="nationality" className="enroll-form-label">
              Nationality *
            </label>
            <input
              id="nationality"
              type="text"
              value={state.personalInfo.nationality || ""}
              onChange={(e) => handleInputChange("nationality", e.target.value)}
              className="enroll-form-input"
              placeholder="Enter nationality"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="religion" className="enroll-form-label">
              Religion
            </label>
            <select
              id="religion"
              value={state.personalInfo.religion || ""}
              onChange={(e) => handleInputChange("religion", e.target.value)}
              className="enroll-form-input"
            >
              <option value="">Select religion</option>
              <option value="Roman Catholic">Roman Catholic</option>
              <option value="Islam">Islam</option>
              <option value="Protestant">Protestant</option>
              <option value="Other Christian">Other Christian</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Section 2: Contact Information */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-enroll-heading">Contact Information</h4>
        
        <div className="grid md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label htmlFor="email" className="enroll-form-label">
              Email Address *
            </label>
            <input
              id="email"
              type="email"
              value={state.personalInfo.email || ""}
              onChange={(e) => handleInputChange("email", e.target.value)}
              className="enroll-form-input"
              placeholder="your.email@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="contactNumber" className="enroll-form-label">
              Contact Number *
            </label>
            <input
              id="contactNumber"
              type="tel"
              value={state.personalInfo.contactNumber || ""}
              onChange={(e) => handleInputChange("contactNumber", e.target.value)}
              className="enroll-form-input"
              placeholder="09xxxxxxxxx"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="homeAddress" className="enroll-form-label">
              Home Address *
            </label>
            <input
              id="homeAddress"
              type="text"
              value={state.personalInfo.homeAddress || ""}
              onChange={(e) => handleInputChange("homeAddress", e.target.value)}
              className="enroll-form-input"
              placeholder="Enter home address"
              required
            />
          </div>
        </div>
      </div>

      {/* Section 3: Emergency Contact */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-enroll-heading">Emergency Contact</h4>
        
        <div className="grid md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label htmlFor="contactPerson" className="enroll-form-label">
              Contact Person *
            </label>
            <input
              id="contactPerson"
              type="text"
              value={state.personalInfo.contactPerson || ""}
              onChange={(e) => handleInputChange("contactPerson", e.target.value)}
              className="enroll-form-input"
              placeholder="Enter contact person's name"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="relationship" className="enroll-form-label">
              Relationship *
            </label>
            <select
              id="relationship"
              value={state.personalInfo.relationship || ""}
              onChange={(e) => handleInputChange("relationship", e.target.value)}
              className="enroll-form-input"
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
          </div>

          <div className="space-y-2">
            <label htmlFor="emergencyContact" className="enroll-form-label">
              Contact Number *
            </label>
            <input
              id="emergencyContact"
              type="tel"
              value={state.personalInfo.emergencyContact || ""}
              onChange={(e) => handleInputChange("emergencyContact", e.target.value)}
              className="enroll-form-input"
              placeholder="09xxxxxxxxx"
              required
            />
          </div>
        </div>
      </div>
    </div>
  );
}