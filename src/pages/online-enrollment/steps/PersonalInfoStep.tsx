import { useEnrollment } from "@/components/features/online-enrollment/hooks/useEnrollment";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PersonalInfoStep() {
  const { state, updatePersonalInfo } = useEnrollment();

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="fullName" className="enroll-form-label">
            Full Name *
          </Label>
          <Input
            id="fullName"
            type="text"
            value={state.personalInfo.fullName}
            onChange={(e) => updatePersonalInfo({ fullName: e.target.value })}
            placeholder="Enter your full name"
            className="enroll-form-input"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="birthDate" className="enroll-form-label">
            Birth Date *
          </Label>
          <Input
            id="birthDate"
            type="date"
            value={state.personalInfo.birthDate}
            onChange={(e) => updatePersonalInfo({ birthDate: e.target.value })}
            className="enroll-form-input"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="contactNumber" className="enroll-form-label">
            Contact Number *
          </Label>
          <Input
            id="contactNumber"
            type="tel"
            value={state.personalInfo.contactNumber}
            onChange={(e) => updatePersonalInfo({ contactNumber: e.target.value })}
            placeholder="09xxxxxxxxx"
            className="enroll-form-input"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="enroll-form-label">
            Email Address *
          </Label>
          <Input
            id="email"
            type="email"
            value={state.personalInfo.email}
            onChange={(e) => updatePersonalInfo({ email: e.target.value })}
            placeholder="your.email@example.com"
            className="enroll-form-input"
            required
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="address" className="enroll-form-label">
            Address *
          </Label>
          <Input
            id="address"
            type="text"
            value={state.personalInfo.address}
            onChange={(e) => updatePersonalInfo({ address: e.target.value })}
            placeholder="Your complete address"
            className="enroll-form-input"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="guardianName" className="enroll-form-label">
            Guardian Name *
          </Label>
          <Input
            id="guardianName"
            type="text"
            value={state.personalInfo.guardianName}
            onChange={(e) => updatePersonalInfo({ guardianName: e.target.value })}
            placeholder="Guardian's full name"
            className="enroll-form-input"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="guardianContact" className="enroll-form-label">
            Guardian Contact *
          </Label>
          <Input
            id="guardianContact"
            type="tel"
            value={state.personalInfo.guardianContact}
            onChange={(e) => updatePersonalInfo({ guardianContact: e.target.value })}
            placeholder="Guardian's contact number"
            className="enroll-form-input"
            required
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="emergencyContact" className="enroll-form-label">
            Emergency Contact *
          </Label>
          <Input
            id="emergencyContact"
            type="text"
            value={state.personalInfo.emergencyContact}
            onChange={(e) => updatePersonalInfo({ emergencyContact: e.target.value })}
            placeholder="Emergency contact name and number"
            className="enroll-form-input"
            required
          />
        </div>
      </div>
    </div>
  );
}