import { useEnrollment } from "@/components/features/online-enrollment/hooks/useEnrollment";
import { Button } from "@/components/ui/button";

export function ReviewStep() {
  const { state, enrollmentData, goToStep } = useEnrollment();

  const totalUnits = enrollmentData.subjects.reduce((sum: number, subject: any) => sum + subject.units, 0);

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-cpc-navy">Review Your Enrollment</h3>
        <p className="text-sm text-enroll-text">
          Please review all information carefully before submitting.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="enroll-card p-6">
            <h4 className="font-semibold text-cpc-navy mb-4">Personal Information</h4>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-enroll-text">Full Name:</span>
                <span className="font-medium">{state.personalInfo.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-enroll-text">Birth Date:</span>
                <span className="font-medium">{state.personalInfo.birthDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-enroll-text">Email:</span>
                <span className="font-medium">{state.personalInfo.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-enroll-text">Contact:</span>
                <span className="font-medium">{state.personalInfo.contactNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-enroll-text">Address:</span>
                <span className="font-medium">{state.personalInfo.address}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-enroll-text">Guardian:</span>
                <span className="font-medium">{state.personalInfo.guardianName}</span>
              </div>
            </div>
            <Button
              variant="secondary"
              className="mt-4"
              onClick={() => goToStep(1)}
            >
              Edit Personal Info
            </Button>
          </div>

          <div className="enroll-card p-6">
            <h4 className="font-semibold text-cpc-navy mb-4">Course & Year Level</h4>
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
            <Button
              variant="secondary"
              className="mt-4"
              onClick={() => goToStep(2)}
            >
              Edit Course
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="enroll-card p-6">
            <h4 className="font-semibold text-cpc-navy mb-4">Selected Subjects</h4>
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
            <Button
              variant="secondary"
              className="mt-4"
              onClick={() => goToStep(2)}
            >
              Edit Subjects
            </Button>
          </div>

          <div className="enroll-card p-6">
            <h4 className="font-semibold text-cpc-navy mb-4">Requirements</h4>
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
            <Button
              variant="secondary"
              className="mt-4"
              onClick={() => goToStep(2)}
            >
              Edit Requirements
            </Button>
          </div>
        </div>
      </div>

      <div className="enroll-card p-6 bg-enroll-hero-bg">
        <div className="text-center">
          <h4 className="font-semibold text-cpc-navy mb-2">Enrollment Summary</h4>
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