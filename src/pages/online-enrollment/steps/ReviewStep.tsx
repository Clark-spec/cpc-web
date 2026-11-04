import { useEnrollment } from "@/components/features/online-enrollment/hooks/useEnrollment";

export function ReviewStep() {
  const { state, enrollmentData, goToStep } = useEnrollment();

  const totalUnits = enrollmentData.subjects.reduce((sum: number, subject: any) => sum + subject.units, 0);

  // Build display name from new fields or fall back to old fields
  const displayName = [
    state.personalInfo.firstName,
    state.personalInfo.middleName,
    state.personalInfo.lastName
  ].filter(Boolean).join(' ');

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-semibold text-enroll-heading mb-2">Review Your Application</h3>
        <p className="text-sm text-enroll-muted">
          You're almost done! Review all the information you have provided and make sure everything is correct before submitting your enrollment application.
        </p>
        <p className="text-xs text-enroll-text mt-1">
          Once submitted, your application will proceed according to the existing enrollment process.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="enroll-card p-6">
            <h4 className="font-semibold text-enroll-heading mb-4">Personal Information</h4>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-enroll-text">Name:</span>
                <span className="font-medium">{displayName || (state.personalInfo.fullName || "N/A")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-enroll-text">Date of Birth:</span>
                <span className="font-medium">{state.personalInfo.birthDate || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-enroll-text">Gender:</span>
                <span className="font-medium">{state.personalInfo.gender || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-enroll-text">Civil Status:</span>
                <span className="font-medium">{state.personalInfo.civilStatus || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-enroll-text">Email:</span>
                <span className="font-medium">{state.personalInfo.email || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-enroll-text">Phone:</span>
                <span className="font-medium">{state.personalInfo.contactNumber || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-enroll-text">Address:</span>
                <span className="font-medium">{state.personalInfo.homeAddress || state.personalInfo.address || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-enroll-text">Emergency Contact:</span>
                <span className="font-medium">{state.personalInfo.contactPerson || "N/A"} ({state.personalInfo.relationship || "N/A"})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-enroll-text">Contact Number:</span>
                <span className="font-medium">{state.personalInfo.emergencyContact || "N/A"}</span>
              </div>
            </div>
            <button
              className="btn-secondary text-sm font-medium mt-4 px-4 py-2"
              onClick={() => goToStep(1)}
            >
              Edit Personal Info
            </button>
          </div>

          <div className="enroll-card p-6">
            <h4 className="font-semibold text-enroll-heading mb-4">Course & Year Level</h4>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-enroll-text">Course:</span>
                <span className="font-medium">{state.course}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-enroll-text">Year Level:</span>
                <span className="font-medium">{state.yearLevel}</span>
              </div>
            </div>
            <button
              className="btn-secondary text-sm font-medium mt-4 px-4 py-2"
              onClick={() => goToStep(2)}
            >
              Edit Course
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="enroll-card p-6">
            <h4 className="font-semibold text-enroll-heading mb-4">Selected Subjects</h4>
            <div className="space-y-3">
              {enrollmentData.subjects.map((subject: any) => (
                <div key={subject.code} className="flex justify-between items-center text-sm">
                  <div>
                    <span className="font-medium">{subject.code} - {subject.title}</span>
                    <div className="text-enroll-text">
                      {subject.schedule} | {subject.units} units
                    </div>
                  </div>
                  <span className="font-medium">{subject.units}</span>
                </div>
              ))}
            </div>
            <div className="pt-3 border-t border-enroll-border mt-4">
              <div className="flex justify-between font-semibold">
                <span>Total Units:</span>
                <span>{totalUnits}</span>
              </div>
            </div>
            <button
              className="btn-secondary text-sm font-medium mt-4 px-4 py-2"
              onClick={() => goToStep(2)}
            >
              Edit Subjects
            </button>
          </div>

          <div className="enroll-card p-6">
            <h4 className="font-semibold text-enroll-heading mb-4">Requirements</h4>
            <div className="space-y-3 text-sm">
              {enrollmentData.requirements.map((req: any) => (
                <div key={req.id} className="flex justify-between items-center">
                  <span className="font-medium">{req.name}</span>
                  <span className={`font-medium ${
                    req.status === "verified" ? "text-enroll-success" :
                    req.status === "uploaded" ? "text-enroll-primary" :
                    "text-enroll-warning"
                  }`}>
                    {req.status === "verified" ? "✓ Verified" :
                     req.status === "uploaded" ? "✓ Uploaded" :
                     req.status === "rejected" ? "✗ Rejected" : "○ Pending"}
                  </span>
                </div>
              ))}
            </div>
            <button
              className="btn-secondary text-sm font-medium mt-4 px-4 py-2"
              onClick={() => goToStep(3)}
            >
              Edit Requirements
            </button>
          </div>
        </div>
      </div>

      <div className="enroll-card p-6 bg-enroll-hero-bg">
        <div className="text-center">
          <h4 className="font-semibold text-enroll-heading mb-2">Enrollment Summary</h4>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-enroll-text">Course:</span>
              <div className="font-medium">{state.course}</div>
            </div>
            <div>
              <span className="text-enroll-text">Subjects:</span>
              <div className="font-medium">{enrollmentData.subjects.length}</div>
            </div>
            <div>
              <span className="text-enroll-text">Total Units:</span>
              <div className="font-medium">{totalUnits}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}