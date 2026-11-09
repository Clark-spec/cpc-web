import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import type {
  EnrollmentData,
  PersonalInfo,
  RequirementDocument,
} from "@/components/features/student/enrollment/mockData";
import {
  mockUserProfile,
  mockSubjects,
  mockRequirements,
} from "@/components/features/student/enrollment/mockData";
import {
  EnrollmentContext,
  type EnrollmentContextValue,
  type EnrollmentState,
} from "@/components/features/student/enrollment/useEnrollment";

const STORAGE_KEY = "cpc_enrollment_data";
const STEPS = 4;

function createDefaultState(): EnrollmentState {
  return {
    personalInfo: {
      firstName: mockUserProfile.firstName || "",
      middleName: mockUserProfile.middleName || "",
      lastName: mockUserProfile.lastName || "",
      birthDate: mockUserProfile.birthDate || "",
      gender: mockUserProfile.gender || "",
      civilStatus: mockUserProfile.civilStatus || "",
      placeOfBirth: mockUserProfile.placeOfBirth || "",
      nationality: mockUserProfile.nationality || "",
      religion: mockUserProfile.religion || "",
      email: mockUserProfile.email || "",
      contactNumber: mockUserProfile.contactNumber || "",
      homeAddress: mockUserProfile.homeAddress || "",
      contactPerson: mockUserProfile.contactPerson || "",
      relationship: mockUserProfile.relationship || "",
      emergencyContact: mockUserProfile.emergencyContact || "",
      fullName: mockUserProfile.fullName,
      address: mockUserProfile.address,
      guardianName: mockUserProfile.guardianName,
      guardianContact: mockUserProfile.guardianContact,
    },
    course: "BS Computer Science",
    yearLevel: "2nd Year",
    subjects: mockSubjects,
    requirements: mockRequirements,
    currentStep: 1,
    isSaved: false,
  };
}

/** Shares one enrollment state across the stepper, step forms, and review. */
export function EnrollmentProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<EnrollmentState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved) as EnrollmentState;
      } catch {
        // Fall back to defaults
      }
    }

    return createDefaultState();
  });

  const { personalInfo, course, yearLevel, subjects, requirements } = state;

  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      setState((prev) => ({
        ...prev,
        isSaved: true,
        lastSaved: new Date().toISOString(),
      }));

      setTimeout(() => {
        setState((prev) => ({ ...prev, isSaved: false }));
      }, 2000);
    }, 500);

    return () => clearTimeout(timer);
    // The form fields are the trigger; `state` also carries isSaved/lastSaved,
    // which this effect writes, so depending on `state` would loop forever.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personalInfo, course, yearLevel, subjects, requirements]);

  const updatePersonalInfo = useCallback((updates: Partial<PersonalInfo>) => {
    setState((prev) => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, ...updates },
    }));
  }, []);

  const updateCourse = useCallback((nextCourse: string, nextYearLevel: string) => {
    setState((prev) => ({ ...prev, course: nextCourse, yearLevel: nextYearLevel }));
  }, []);

  const toggleSubject = useCallback((subjectCode: string) => {
    setState((prev) => ({
      ...prev,
      subjects: prev.subjects.map((subject) =>
        subject.code === subjectCode
          ? { ...subject, isSelected: !subject.isSelected }
          : subject
      ),
    }));
  }, []);

  const updateRequirements = useCallback((nextRequirements: RequirementDocument[]) => {
    setState((prev) => ({ ...prev, requirements: nextRequirements }));
  }, []);

  const updateRequirementFile = useCallback((id: string, file: File) => {
    setState((prev) => ({
      ...prev,
      requirements: prev.requirements.map((req) =>
        req.id === id
          ? {
              ...req,
              fileName: file.name,
              fileSize: file.size,
              status: "uploaded" as const,
              uploadDate: new Date().toISOString(),
            }
          : req
      ),
    }));
  }, []);

  const goToStep = useCallback((step: number) => {
    if (step >= 1 && step <= STEPS) {
      setState((prev) => ({ ...prev, currentStep: step }));
    }
  }, []);

  const nextStep = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentStep: Math.min(prev.currentStep + 1, STEPS),
    }));
  }, []);

  const prevStep = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentStep: Math.max(prev.currentStep - 1, 1),
    }));
  }, []);

  const resetEnrollment = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setState(createDefaultState());
  }, []);

  const enrollmentData = useMemo<EnrollmentData>(
    () => ({
      personalInfo: state.personalInfo,
      course: state.course,
      yearLevel: state.yearLevel,
      subjects: state.subjects.filter((s) => s.isSelected),
      requirements: state.requirements,
    }),
    [state.personalInfo, state.course, state.yearLevel, state.subjects, state.requirements],
  );

  const totalUnits = useMemo(
    () => enrollmentData.subjects.reduce((sum, subject) => sum + subject.units, 0),
    [enrollmentData.subjects],
  );

  const value = useMemo<EnrollmentContextValue>(
    () => ({
      state,
      enrollmentData,
      totalUnits,
      selectedSubjectsCount: enrollmentData.subjects.length,
      updatePersonalInfo,
      updateCourse,
      toggleSubject,
      updateRequirements,
      updateRequirementFile,
      goToStep,
      nextStep,
      prevStep,
      resetEnrollment,
    }),
    [
      state,
      enrollmentData,
      totalUnits,
      updatePersonalInfo,
      updateCourse,
      toggleSubject,
      updateRequirements,
      updateRequirementFile,
      goToStep,
      nextStep,
      prevStep,
      resetEnrollment,
    ],
  );

  return <EnrollmentContext.Provider value={value}>{children}</EnrollmentContext.Provider>;
}
