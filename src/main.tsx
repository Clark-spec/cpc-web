import "@/styles/global.css";
import { createRoot } from "react-dom/client";

import { Navigate, Route, RouterProvider, Routes } from "react-router";
import { AppProviders } from "@/components/context/app-providers";
import { createAppRouter } from "@/lib/router";
import AuthLayout from "@/pages/auth/layout";
import StudentLoginPage from "@/pages/auth/student";
import StaffLoginPage from "@/pages/auth/staff";
import { AdminLoginRoute, AdminShell } from "@/components/context/AdminShell";
import { ProtectedEnrollment } from "@/components/context/ProtectedEnrollment";
import ClearanceRequestsPage from "@/pages/admin/clearance-requests";
import ClassSchedulesAdminPage from "@/pages/admin/class-schedules";
import AcademicCalendarAdminPage from "@/pages/admin/academic-calendar";
import ComingSoonPage from "@/pages/admin/coming-soon";
import DashboardPage from "@/pages/admin/dashboard";
import EnrollmentApplicationsPage from "@/pages/admin/enrollment/applications";
import ServiceRequestManagementPage from "@/pages/admin/service-requests";
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

export function AppRoutes() {
  return (
    <Routes>
      {/* Auth routes */}
      <Route path="/" element={<Navigate to="/login/student" replace />} />
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
          path="academics/class-schedules"
          element={<ClassSchedulesAdminPage />}
        />
        <Route
          path="academics/academic-calendar"
          element={<AcademicCalendarAdminPage />}
        />
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
        {/* Every other sidebar destination renders the shared placeholder. */}
        <Route path="*" element={<ComingSoonPage />} />
      </Route>

      {/* Student home, shown after the student signs in. */}
      <Route path="/student/home" element={<StudentHomePage />} />

      {/* Student services */}
      <Route path="/student/service-requests" element={<ServiceRequestsPage />} />
      <Route path="/student/request-status" element={<RequestStatusPage />} />
      {/* Student services. */}
      <Route path="/student-services/online-clearance" element={<ClearancePage />} />

      {/* Student support. */}
      <Route path="/student-support/online-complaint" element={<OnlineComplaintPage />} />

      {/* Academics. */}
      <Route path="/academics/class-schedules" element={<ClassSchedulesPage />} />
      <Route path="/academics/academic-calendar" element={<AcademicCalendarPage />} />

      {/* My Account. */}
      <Route path="/my-account/profile" element={<StudentProfilePage />} />

      {/* Enrollment routes - no app layout, pages render directly */}
      <Route
        path="/online-enrollment"
        element={<ProtectedEnrollment />}
      >
        <Route index element={<OnlineEnrollmentPage />} />
        <Route path="step/:step" element={<EnrollmentStepPage />} />
        <Route path="confirmation" element={<EnrollmentConfirmationPage />} />
        <Route path="status" element={<EnrollmentStatusPage />} />
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
