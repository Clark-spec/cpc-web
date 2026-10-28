import { useState, useEffect, useCallback } from "react";
import type { EnrollmentData, PersonalInfo, Subject, RequirementDocument } from "@/components/features/online-enrollment/data/mockData";
import { mockUserProfile, mockSubjects, mockRequirements } from "@/components/features/online-enrollment/data/mockData";

type EnrollmentState = {
  personalInfo: PersonalInfo;
  course: string;
  yearLevel: string;
  subjects: Subject[];
  requirements: RequirementDocument[];
  currentStep: number;
  isSaved: boolean;
  lastSaved?: string;
};

const STORAGE_KEY = "cpc_enrollment_data";
const STEPS = 4;

export function useEnrollment() {
  const [state, setState] = useState<EnrollmentState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Fall back to defaults
      }
    }

    return {
      personalInfo: {
        fullName: mockUserProfile.fullName || "",
        birthDate: mockUserProfile.birthDate || "",
        address: mockUserProfile.address || "",
        contactNumber: mockUserProfile.contactNumber || "",
        email: mockUserProfile.email || "",
        guardianName: mockUserProfile.guardianName || "",
        guardianContact: mockUserProfile.guardianContact || "",
        emergencyContact: mockUserProfile.emergencyContact || "",
      },
      course: "BS Computer Science",
      yearLevel: "2nd Year",
      subjects: mockSubjects,
      requirements: mockRequirements,
      currentStep: 1,
      isSaved: false,
    };
  });

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
  }, [state.personalInfo, state.course, state.yearLevel, state.subjects, state.requirements]);

  const updatePersonalInfo = useCallback((updates: Partial<PersonalInfo>) => {
    setState((prev) => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, ...updates },
    }));
  }, []);

  const updateCourse = useCallback((course: string, yearLevel: string) => {
    setState((prev) => ({ ...prev, course, yearLevel }));
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

  const updateRequirements = useCallback((requirements: RequirementDocument[]) => {
    setState((prev) => ({ ...prev, requirements }));
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
    setState({
      personalInfo: {
        fullName: mockUserProfile.fullName || "",
        birthDate: mockUserProfile.birthDate || "",
        address: mockUserProfile.address || "",
        contactNumber: mockUserProfile.contactNumber || "",
        email: mockUserProfile.email || "",
        guardianName: mockUserProfile.guardianName || "",
        guardianContact: mockUserProfile.guardianContact || "",
        emergencyContact: mockUserProfile.emergencyContact || "",
      },
      course: "BS Computer Science",
      yearLevel: "2nd Year",
      subjects: mockSubjects,
      requirements: mockRequirements,
      currentStep: 1,
      isSaved: false,
    });
  }, []);

  const enrollmentData: EnrollmentData = {
    personalInfo: state.personalInfo,
    course: state.course,
    yearLevel: state.yearLevel,
    subjects: state.subjects.filter((s) => s.isSelected),
    requirements: state.requirements,
  };

  const totalUnits = enrollmentData.subjects.reduce((sum, subject) => sum + subject.units, 0);
  const selectedSubjectsCount = enrollmentData.subjects.length;

  return {
    state,
    enrollmentData,
    totalUnits,
    selectedSubjectsCount,
    updatePersonalInfo,
    updateCourse,
    toggleSubject,
    updateRequirements,
    updateRequirementFile,
    goToStep,
    nextStep,
    prevStep,
    resetEnrollment,
  };
}