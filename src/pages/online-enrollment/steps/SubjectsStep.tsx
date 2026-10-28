import { useEnrollment } from "@/components/features/online-enrollment/hooks/useEnrollment";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export function SubjectsStep() {
  const { state, enrollmentData, updateCourse, toggleSubject } = useEnrollment();

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="course" className="enroll-form-label">
            Course *
          </Label>
          <Select
            id="course"
            value={state.course}
            onChange={(e) => updateCourse(e.target.value, state.yearLevel)}
            className="enroll-form-select"
            required
          >
            <option value="">Select a course</option>
            <option value="BS Computer Science">BS Computer Science</option>
            <option value="BS Information Technology">BS Information Technology</option>
            <option value="BS Accountancy">BS Accountancy</option>
            <option value="BS Business Administration">BS Business Administration</option>
            <option value="BA Political Science">BA Political Science</option>
            <option value="BS Psychology">BS Psychology</option>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="yearLevel" className="enroll-form-label">
            Year Level *
          </Label>
          <Select
            id="yearLevel"
            value={state.yearLevel}
            onChange={(e) => updateCourse(state.course, e.target.value)}
            className="enroll-form-select"
            required
          >
            <option value="">Select year level</option>
            <option value="1st Year">1st Year</option>
            <option value="2nd Year">2nd Year</option>
            <option value="3rd Year">3rd Year</option>
            <option value="4th Year">4th Year</option>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-cpc-navy">Select Subjects</h3>
        <p className="text-sm text-enroll-text">
          Choose the subjects you want to enroll in for the semester.
        </p>

        <div className="space-y-3">
          {state.subjects.map((subject) => (
            <div
              key={subject.code}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                subject.isSelected
                  ? "border-enroll-primary bg-enroll-hero-bg"
                  : "border-enroll-border hover:border-enroll-primary"
              }`}
              onClick={() => toggleSubject(subject.code)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={subject.isSelected}
                      onChange={() => toggleSubject(subject.code)}
                      className="w-5 h-5 text-enroll-primary rounded border-enroll-border focus:ring-enroll-primary"
                    />
                    <div>
                      <h4 className="font-semibold text-cpc-navy">
                        {subject.code} - {subject.title}
                      </h4>
                      <p className="text-sm text-enroll-text">
                        {subject.schedule} | Section {subject.section}
                      </p>
                      <p className="text-sm text-enroll-text">
                        Instructor: {subject.instructor}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-cpc-navy">
                    {subject.units} units
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-enroll-border">
          <div className="flex items-center justify-between">
            <span className="text-sm text-enroll-text">
              Total Selected: {enrollmentData.subjects.length} subjects
            </span>
            <span className="text-lg font-semibold text-cpc-navy">
              Total Units: {enrollmentData.subjects.reduce((sum: number, s: any) => sum + s.units, 0)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}