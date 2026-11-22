import "@/styles/global.css";
import { createRoot } from "react-dom/client";

// Clean up legacy demo data keys from previous test sessions so user starts fresh
const LEGACY_DEMO_KEYS = [
  "cpc-sr-demo-requests-v1",
  "cpc-sr-demo-requests-v2",
  "cpc-sr-demo-notifications-v1",
  "cpc-sr-demo-notifications-v2",
  "cpc-sr-demo-draft-v1",
  "cpc:notifications:clearance",
  "cpc.clearance.records.v1",
  "cpc.clearance.timeline.v1",
  "cpc.admin.notifications.v1",
  "cpc.admin.activity.v1",
  "cpc:clearance:records",
  "cpc:clearance:timeline",
];

const CLEANED_FLAG = "cpc:clean_demo_v3";
if (typeof window !== "undefined" && !window.localStorage.getItem(CLEANED_FLAG)) {
  for (const key of LEGACY_DEMO_KEYS) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // ignore
    }
  }
  try {
    window.localStorage.setItem(CLEANED_FLAG, "true");
  } catch {
    // ignore
  }
}

import { Navigate, Route, RouterProvider, Routes } from "react-router";
import { AppProviders } from "@/components/context/app-providers";
import { createAppRouter } from "@/lib/router";
import AuthLayout from "@/pages/auth/layout";
import StudentLoginPage from "@/pages/auth/student";
import StaffLoginPage from "@/pages/auth/staff";
import {
  AdminLoginRoute,
  AdminShell,
  RequireAdminRole,
} from "@/components/context/AdminShell";
import { RequireStudent } from "@/components/context/RequireStudent";
import { useAuth } from "@/components/context/useAuth";
import { useAdminAuth } from "@/components/context/AdminAuthContext";
import { ProtectedEnrollment } from "@/components/context/ProtectedEnrollment";
import ClearanceRequestsPage from "@/pages/admin/clearance-requests";
import ComplaintsAdminPage from "@/pages/admin/complaints";
import ClassSchedulesAdminPage from "@/pages/admin/class-schedules";
import AcademicCalendarAdminPage from "@/pages/admin/academic-calendar";
import ComingSoonPage from "@/pages/admin/coming-soon";
import DashboardPage from "@/pages/admin/dashboard";
import EnrollmentApplicationsPage from "@/pages/admin/enrollment/applications";
import EnrollmentClearanceRequestsPage from "@/pages/admin/enrollment/clearance-requests";
import ServiceRequestManagementPage from "@/pages/admin/service-requests";
import AllStudentsAdminPage from "@/pages/admin/students";
import ProfileCorrectionsAdminPage from "@/pages/admin/students/profile-corrections";
import AccountSettingsAdminPage from "@/pages/admin/students/account-settings";
import StudentHomePage from "@/pages/student/home";
import ServiceRequestsPage from "@/pages/student/service-requests";
import RequestStatusPage from "@/pages/student/request-status";
import ClearancePage from "@/pages/student/online-clearance";
import ClassSchedulesPage from "@/pages/student/class-schedules";
import AcademicCalendarPage from "@/pages/student/academic-calendar";
import OnlineEnrollmentPage from "@/pages/student/enrollment";
import EnrollmentConfirmationPage from "@/pages/student/enrollment/confirmation";
import EnrollmentStatusPage from "@/pages/student/enrollment/status";
import EnrollmentStepPage from "@/pages/student/enrollment/step";
import StudentProfilePage from "@/pages/student/profile";
import OnlineComplaintPage from "@/pages/student/online-complaint";
import ComplaintStatusPage from "@/pages/student/complaint-status";
import StudentVerifyPage from "@/pages/student/verify";
import StudentEnrollmentFormPage from "@/pages/student/enrollment-form";
import StudentQueuePage from "@/pages/student/queue";
import DisplayPage from "@/pages/display";
import StudyLoadSignatureDisplayPage from "@/pages/display/study-load-signatures";
import OfficeSignatureDisplayPage from "@/pages/display/office-signatures";
import CommitteeScreeningPage from "@/pages/committee/screening";
import GuidanceQueuePage from "@/pages/guidance/queue";
import ClinicQueuePage from "@/pages/clinic/queue";
import AccountingQueuePage from "@/pages/accounting/queue";
import RegistrarQueuePage from "@/pages/registrar/queue";
import RegistrarVerificationPage from "@/pages/registrar/verification";
import RegistrarSchedulePage from "@/pages/registrar/schedule";
import GradesRecordsPage from "@/pages/admin/grades";
import StudentGradesPage from "@/pages/student/grades";

/** Staff roles that can open Academics › Academic Calendar. */
const ACADEMIC_CALENDAR_ROLES = [
  "admin",
  "registrar",
  "dean_cs",
  "dean_edu",
  "dean_hm",
] as const;

const SCREENING_ROLES = ["admin", "dean_cs", "dean_edu", "dean_hm"] as const;
const GUIDANCE_ROLES = ["admin", "guidance"] as const;
const CLINIC_ROLES = ["admin", "clinic"] as const;
const ACCOUNTING_ROLES = ["admin", "accounting"] as const;
const REGISTRAR_ROLES = ["admin", "registrar"] as const;
const ENROLLMENT_SIGNATURE_ROLES = ["admin", "registrar", "dean_cs", "dean_edu", "dean_hm", "guidance", "clinic", "accounting"] as const;

function RootRedirect() {
  const { user, isLoading } = useAuth();
  const { user: adminUser } = useAdminAuth();
  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center font-poppins text-sm text-cpc-heading-soft">Restoring your session…</div>;
  }
  if (user?.role === "student") return <Navigate to="/student/home" replace />;
  if (user?.role === "staff") return <Navigate to="/admin/dashboard" replace />;
  if (adminUser) return <Navigate to="/admin/dashboard" replace />;
  return <Navigate to="/login/student" replace />;
}

export function AppRoutes() {
  return (
    <Routes>
      {/* Auth routes */}
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<AuthLayout />}>
        <Route index element={<Navigate to="student" replace />} />
        <Route path="student" element={<StudentLoginPage />} />
        <Route path="staff" element={<StaffLoginPage />} />
        <Route path="admin" element={<Navigate to="/admin/login" replace />} />
      </Route>

      {/* Admin / staff portal. */}
      <Route path="/admin/login" element={<AdminLoginRoute />} />
      <Route path="/admin" element={<AdminShell />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="clearance-requests" element={<ClearanceRequestsPage />} />
        <Route
          path="enrollment/clearance-requests"
          element={
            <RequireAdminRole roles={ENROLLMENT_SIGNATURE_ROLES}>
              <EnrollmentClearanceRequestsPage />
            </RequireAdminRole>
          }
        />
        <Route path="support/complaints" element={<ComplaintsAdminPage />} />
        <Route
          path="academics/class-schedules"
          element={<ClassSchedulesAdminPage />}
        />
        <Route
          path="academics/academic-calendar"
          element={
            <RequireAdminRole roles={ACADEMIC_CALENDAR_ROLES}>
              <AcademicCalendarAdminPage />
            </RequireAdminRole>
          }
        />
        <Route path="academics/sections" element={<RequireAdminRole roles={["admin", "registrar"]}><GradesRecordsPage /></RequireAdminRole>} />
        <Route
          path="enrollment/applications"
          element={<EnrollmentApplicationsPage view="all" />}
        />
        <Route
          path="enrollment/for-review"
          element={<EnrollmentApplicationsPage view="for-review" />}
        />
        <Route
          path="enrollment/approved"
          element={<EnrollmentApplicationsPage view="approved" />}
        />
        <Route
          path="enrollment/needs-requirements"
          element={<EnrollmentApplicationsPage view="needs-requirements" />}
        />
        <Route path="service-requests" element={<ServiceRequestManagementPage />} />
        <Route path="students" element={<AllStudentsAdminPage />} />
        <Route
          path="students/profile-corrections"
          element={<ProfileCorrectionsAdminPage />}
        />
        <Route
          path="students/account-settings"
          element={<AccountSettingsAdminPage />}
        />
        <Route
          path="enrollment/screening"
          element={
            <RequireAdminRole roles={SCREENING_ROLES}>
              <CommitteeScreeningPage />
            </RequireAdminRole>
          }
        />
        <Route
          path="enrollment/guidance"
          element={
            <RequireAdminRole roles={GUIDANCE_ROLES}>
              <GuidanceQueuePage />
            </RequireAdminRole>
          }
        />
        <Route
          path="enrollment/clinic"
          element={
            <RequireAdminRole roles={CLINIC_ROLES}>
              <ClinicQueuePage />
            </RequireAdminRole>
          }
        />
        <Route
          path="enrollment/accounting"
          element={
            <RequireAdminRole roles={ACCOUNTING_ROLES}>
              <AccountingQueuePage />
            </RequireAdminRole>
          }
        />
        <Route
          path="enrollment/registrar-queue"
          element={
            <RequireAdminRole roles={REGISTRAR_ROLES}>
              <RegistrarQueuePage />
            </RequireAdminRole>
          }
        />
        <Route
          path="enrollment/verification"
          element={
            <RequireAdminRole roles={REGISTRAR_ROLES}>
              <RegistrarVerificationPage />
            </RequireAdminRole>
          }
        />
        <Route
          path="enrollment/schedule"
          element={
            <RequireAdminRole roles={REGISTRAR_ROLES}>
              <RegistrarSchedulePage />
            </RequireAdminRole>
          }
        />
        {/* Every other sidebar destination renders the shared placeholder. */}
        <Route path="*" element={<ComingSoonPage />} />
      </Route>

      {/* ── Public Live Queue Display (TV screen) ────────────────────── */}
      <Route path="/display" element={<DisplayPage />} />
      <Route path="/display/study-load-signatures" element={<StudyLoadSignatureDisplayPage />} />
      <Route path="/display/office-signatures" element={<OfficeSignatureDisplayPage />} />

      {/* ── Office Stations Direct Routes (Spec Section 6) ──────────── */}
      <Route
        path="/committee/screening"
        element={
          <RequireAdminRole roles={SCREENING_ROLES}>
            <CommitteeScreeningPage />
          </RequireAdminRole>
        }
      />
      <Route
        path="/guidance/queue"
        element={
          <RequireAdminRole roles={GUIDANCE_ROLES}>
            <GuidanceQueuePage />
          </RequireAdminRole>
        }
      />
      <Route
        path="/clinic/queue"
        element={
          <RequireAdminRole roles={CLINIC_ROLES}>
            <ClinicQueuePage />
          </RequireAdminRole>
        }
      />
      <Route
        path="/accounting/queue"
        element={
          <RequireAdminRole roles={ACCOUNTING_ROLES}>
            <AccountingQueuePage />
          </RequireAdminRole>
        }
      />
      <Route
        path="/registrar/queue"
        element={
          <RequireAdminRole roles={REGISTRAR_ROLES}>
            <RegistrarQueuePage />
          </RequireAdminRole>
        }
      />
      <Route
        path="/registrar/verification"
        element={
          <RequireAdminRole roles={REGISTRAR_ROLES}>
            <RegistrarVerificationPage />
          </RequireAdminRole>
        }
      />
      <Route
        path="/registrar/schedule"
        element={
          <RequireAdminRole roles={REGISTRAR_ROLES}>
            <RegistrarSchedulePage />
          </RequireAdminRole>
        }
      />

      {/* ── Protected student portal ─────────────────────────────────────── */}
      <Route element={<RequireStudent />}>
        {/* Student home */}
        <Route path="/student/home" element={<StudentHomePage />} />

        {/* Student enrollment workflow (Spec Section 6) */}
        <Route path="/student/verify" element={<StudentVerifyPage />} />
        <Route path="/student/enrollment-form" element={<StudentEnrollmentFormPage />} />
        <Route path="/student/queue" element={<StudentQueuePage />} />

        {/* Student services */}
        <Route path="/student/service-requests" element={<ServiceRequestsPage />} />
        <Route path="/student/request-status" element={<RequestStatusPage />} />
        <Route path="/student-services/online-clearance" element={<ClearancePage />} />

        {/* Student support */}
        <Route path="/student-support/online-complaint" element={<OnlineComplaintPage />} />

        {/* Academics */}
        <Route path="/academics/class-schedules" element={<ClassSchedulesPage />} />
        <Route path="/academics/academic-calendar" element={<AcademicCalendarPage />} />
        <Route path="/academics/grades" element={<StudentGradesPage />} />

        {/* My Account */}
        <Route path="/my-account/profile" element={<StudentProfilePage />} />
        <Route path="/student/complaint-status" element={<ComplaintStatusPage />} />

        {/* Enrollment flow */}
        <Route path="/online-enrollment" element={<ProtectedEnrollment />}>
          <Route index element={<OnlineEnrollmentPage />} />
          <Route path="verify" element={<StudentVerifyPage />} />
          <Route path="form" element={<StudentEnrollmentFormPage />} />
          <Route path="queue" element={<StudentQueuePage />} />
          <Route path="step/:step" element={<EnrollmentStepPage />} />
          <Route path="confirmation" element={<EnrollmentConfirmationPage />} />
          <Route path="status" element={<EnrollmentStatusPage />} />
        </Route>
      </Route>

      {/* Catch-all redirect to login */}
      <Route path="*" element={<Navigate to="/login/student" replace />} />
    </Routes>
  );
}

/**
 * The app uses a data router so feature pages can rely on `useBlocker`
 * (e.g. the Student Profile unsaved-changes guard). The nested <Routes> in
 * `AppRoutes` keep the existing route definitions unchanged.
 */
const router = createAppRouter([
  {
    path: "*",
    element: (
      <AppProviders>
        <AppRoutes />
      </AppProviders>
    ),
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}

createRoot(document.getElementById("root")!).render(<AppRouter />);

// Production-only PWA registration. Dev and preview builds stay SW-free, and
// a failed registration never blocks the app from rendering.
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`)
      .catch(() => undefined);
  });
}
