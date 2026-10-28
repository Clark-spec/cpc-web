export type PersonalInfo = {
  fullName: string;
  birthDate: string;
  address: string;
  contactNumber: string;
  email: string;
  guardianName: string;
  guardianContact: string;
  emergencyContact: string;
};

export type Subject = {
  code: string;
  title: string;
  units: number;
  schedule: string;
  section: string;
  instructor: string;
  prerequisites: string[];
  isSelected?: boolean;
};

export type RequirementDocument = {
  id: string;
  name: string;
  type: "Form 138" | "PSA Birth Certificate" | "ID Photo" | "Good Moral" | "Medical Certificate";
  fileName?: string;
  fileSize?: number;
  status: "pending" | "uploaded" | "verified" | "rejected";
  uploadDate?: string;
};

export type EnrollmentData = {
  personalInfo: PersonalInfo;
  course: string;
  yearLevel: string;
  subjects: Subject[];
  requirements: RequirementDocument[];
};

export const mockUserProfile: Partial<PersonalInfo> = {
  fullName: "Juan Dela Cruz",
  birthDate: "2004-03-15",
  address: "123 Mabini St, Cordova, Cebu",
  contactNumber: "09171234567",
  email: "juan.delacruz@cpc.edu.ph",
  guardianName: "Maria Dela Cruz",
  guardianContact: "09171234568",
  emergencyContact: "09171234569",
};

export const availableCourses = [
  "BS Computer Science",
  "BS Information Technology",
  "BS Accountancy",
  "BS Business Administration",
  "BA Political Science",
  "BS Psychology",
];

export const yearLevels = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

export const mockSubjects: Subject[] = [
  {
    code: "CS101",
    title: "Introduction to Computer Programming",
    units: 3,
    schedule: "MWF 8:00-9:00 AM",
    section: "A",
    instructor: "Prof. Ana Reyes",
    prerequisites: [],
    isSelected: true,
  },
  {
    code: "CS102",
    title: "Data Structures and Algorithms",
    units: 3,
    schedule: "TTH 10:00-11:30 AM",
    section: "A",
    instructor: "Prof. Miguel Santos",
    prerequisites: ["CS101"],
    isSelected: true,
  },
  {
    code: "MATH201",
    title: "Discrete Mathematics",
    units: 3,
    schedule: "MWF 9:00-10:00 AM",
    section: "B",
    instructor: "Prof. Elena Cruz",
    prerequisites: [],
    isSelected: false,
  },
  {
    code: "ENG101",
    title: "English Composition",
    units: 3,
    schedule: "TTH 1:00-2:30 PM",
    section: "A",
    instructor: "Prof. Luis Garcia",
    prerequisites: [],
    isSelected: true,
  },
  {
    code: "SCI101",
    title: "General Science",
    units: 3,
    schedule: "WF 2:00-5:00 PM",
    section: "A",
    instructor: "Prof. Rosa Mendoza",
    prerequisites: [],
    isSelected: false,
  },
  {
    code: "PE101",
    title: "Physical Education 1",
    units: 2,
    schedule: "MWF 5:00-6:00 PM",
    section: "A",
    instructor: "Coach Marco Lim",
    prerequisites: [],
    isSelected: true,
  },
];

export const mockRequirements: RequirementDocument[] = [
  {
    id: "req-1",
    name: "Form 138",
    type: "Form 138",
    fileName: "Form138_2025.pdf",
    fileSize: 2.4 * 1024 * 1024,
    status: "uploaded",
    uploadDate: "2025-01-15T10:30:00Z",
  },
  {
    id: "req-2",
    name: "PSA Birth Certificate",
    type: "PSA Birth Certificate",
    fileName: "PSA_Birth.pdf",
    fileSize: 1.8 * 1024 * 1024,
    status: "verified",
    uploadDate: "2025-01-14T15:20:00Z",
  },
  {
    id: "req-3",
    name: "ID Photo",
    type: "ID Photo",
    fileName: "ID_Photo.jpg",
    fileSize: 0.5 * 1024 * 1024,
    status: "pending",
  },
  {
    id: "req-4",
    name: "Good Moral Certificate",
    type: "Good Moral",
    fileName: "GoodMoral.pdf",
    fileSize: 0.3 * 1024 * 1024,
    status: "uploaded",
    uploadDate: "2025-01-16T09:00:00Z",
  },
];

export const mockEnrollmentStatus = {
  referenceNumber: "ENR2026-001234",
  status: "under_review" as const,
  submittedAt: "2025-01-20T14:30:00Z",
  steps: [
    { status: "completed", label: "Submitted", date: "2025-01-20" },
    { status: "active", label: "Under Review", date: "2025-01-21" },
    { status: "pending", label: "Approved", date: null },
    { status: "pending", label: "Enrolled", date: null },
  ],
};

export const enrollmentProgressSteps = [
  { id: "personal", title: "Personal Info", description: "Basic Information" },
  { id: "subjects", title: "Subjects", description: "Course Selection" },
  { id: "requirements", title: "Requirements", description: "Document Upload" },
  { id: "review", title: "Review", description: "Confirmation" },
];