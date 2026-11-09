import type { StudentProfile } from "@/components/features/student/profile/types";

/**
 * Seed profile for the demo. `profileService` stores edits on top of this in
 * localStorage; "Reset demo data" drops back to this object.
 */
export const mockProfile: StudentProfile = {
  studentId: "12345678",
  fullName: "Harry Styles",
  program: "BS Information Technology",
  yearLevel: "3rd Year",
  section: "BSIT-3A",
  enrollmentStatus: "Enrolled",
  avatarUrl: undefined,
  email: "harrystyles@cpc.edu.ph",
  phone: "+63 912 345 6789",
  alternateContact: "",
  address: {
    street: "Purok 4",
    barangay: "Brgy. Poblacion",
    city: "Cordova",
    province: "Cebu",
  },
  gender: "Male",
  dateOfBirth: "2005-05-14",
  placeOfBirth: "Cordova, Cebu",
  civilStatus: "Single",
  religion: "Roman Catholic",
  nationality: "Filipino",
  motherName: "Harley Potter",
  fatherName: "Harvey Potter",
  guardianName: "Harry Roque",
  guardianContact: "",
  updatedAt: "2026-10-04T09:30:00.000Z",
};

export const PROFILE_STORAGE_KEY = "cpc.student-profile.v1";
