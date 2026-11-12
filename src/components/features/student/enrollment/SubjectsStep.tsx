import { useState } from "react";
import { cn } from "@/lib/cn";
import { useEnrollment } from "@/components/features/student/enrollment/useEnrollment";
import {
  validateCourse,
  validateSubjectSelection,
  validateYearLevel,
} from "@/components/features/student/enrollment/validation";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export function SubjectsStep() {
  const { state, enrollmentData, updateCourse, toggleSubject } = useEnrollment();
  const [touched, setTouched] = useState({ course: false, yearLevel: false, subjects: false });

  const courseError = touched.course ? validateCourse(state.course) : undefined;
  const yearLevelError = touched.yearLevel ? validateYearLevel(state.yearLevel) : undefined;
  const subjectsError = touched.subjects
    ? validateSubjectSelection(enrollmentData.subjects.length)
    : undefined;

  const handleToggleSubject = (subjectCode: string) => {
    toggleSubject(subjectCode);
    setTouched((prev) => (prev.subjects ? prev : { ...prev, subjects: true }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-enroll-heading mb-2">Choose Your Subjects</h3>
        <p className="text-sm text-enroll-muted">
          Select the subjects applicable to your course and enrollment. Review your selections carefully before proceeding to the next step.
        </p>
        <p className="text-xs text-enroll-text mt-1">
          Make sure your selected subjects match your intended academic program.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="course" className="enroll-form-label">
            Course *
          </Label>
          <Select
            id="course"
            value={state.course}
            onChange={(e) => {
              updateCourse(e.target.value, state.yearLevel);
              setTouched((prev) => (prev.course ? prev : { ...prev, course: true }));
            }}
            onBlur={() => setTouched((prev) => (prev.course ? prev : { ...prev, course: true }))}
            className={cn("enroll-form-select", courseError && "error")}
            aria-invalid={courseError ? true : undefined}
            aria-describedby={courseError ? "course-error" : undefined}
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
          {courseError && (
            <span id="course-error" className="enroll-form-error" role="alert">
              {courseError}
            </span>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="yearLevel" className="enroll-form-label">
            Year Level *
          </Label>
          <Select
            id="yearLevel"
            value={state.yearLevel}
            onChange={(e) => {
              updateCourse(state.course, e.target.value);
              setTouched((prev) => (prev.yearLevel ? prev : { ...prev, yearLevel: true }));
            }}
            onBlur={() => setTouched((prev) => (prev.yearLevel ? prev : { ...prev, yearLevel: true }))}
            className={cn("enroll-form-select", yearLevelError && "error")}
            aria-invalid={yearLevelError ? true : undefined}
            aria-describedby={yearLevelError ? "yearLevel-error" : undefined}
            required
          >
            <option value="">Select year level</option>
            <option value="1st Year">1st Year</option>
            <option value="2nd Year">2nd Year</option>
            <option value="3rd Year">3rd Year</option>
            <option value="4th Year">4th Year</option>
          </Select>
          {yearLevelError && (
            <span id="yearLevel-error" className="enroll-form-error" role="alert">
              {yearLevelError}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-enroll-heading">Select Subjects</h3>
        <p className="text-sm text-enroll-text">
          Choose the subjects you want to enroll in for the semester.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          {state.subjects.map((subject) => (
            <div
              key={subject.code}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                subject.isSelected
                  ? "border-enroll-primary bg-enroll-hero-bg"
                  : "border-enroll-border hover:border-enroll-primary"
              }`}
              onClick={() => handleToggleSubject(subject.code)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={subject.isSelected}
                      onChange={() => handleToggleSubject(subject.code)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-5 h-5 shrink-0 text-enroll-primary rounded border-enroll-border focus:ring-enroll-primary"
                    />
                    <div className="min-w-0">
                      <h4 className="font-semibold text-enroll-heading">
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
                <div className="shrink-0 text-right">
                  <span className="text-sm font-semibold text-enroll-heading whitespace-nowrap">
                    {subject.units} units
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {subjectsError && (
          <span className="enroll-form-error" role="alert">
            {subjectsError}
          </span>
        )}

        <div className="pt-4 border-t border-enroll-border">
          <div className="flex items-center justify-between">
            <span className="text-sm text-enroll-text">
              Total Selected: {enrollmentData.subjects.length} subjects
            </span>
            <span className="text-lg font-semibold text-enroll-heading">
              Total Units: {enrollmentData.subjects.reduce((sum, s) => sum + s.units, 0)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}