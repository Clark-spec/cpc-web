import { createContext, useContext } from "react";
import type {
  EnrollmentData,
  PersonalInfo,
  RequirementDocument,
  Subject,
} from "@/components/features/student/enrollment/mockData";

export type EnrollmentState = {
  personalInfo: PersonalInfo;
  course: string;
  yearLevel: string;
  subjects: Subject[];
  requirements: RequirementDocument[];
  currentStep: number;
  isSaved: boolean;
  lastSaved?: string;
};

export type EnrollmentContextValue = {
  state: EnrollmentState;
  enrollmentData: EnrollmentData;
  totalUnits: number;
  selectedSubjectsCount: number;
  updatePersonalInfo: (updates: Partial<PersonalInfo>) => void;
  updateCourse: (course: string, yearLevel: string) => void;
  toggleSubject: (subjectCode: string) => void;
  updateRequirements: (requirements: RequirementDocument[]) => void;
  updateRequirementFile: (id: string, file: File) => void;
  goToStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  resetEnrollment: () => void;
};

export const EnrollmentContext = createContext<EnrollmentContextValue | null>(null);

export function useEnrollment(): EnrollmentContextValue {
  const context = useContext(EnrollmentContext);
  if (!context) {
    throw new Error("useEnrollment must be used within an EnrollmentProvider");
  }
  return context;
}
