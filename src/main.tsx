import "@/styles/global.css";
import { createRoot } from "react-dom/client";
import {
  createBrowserRouter,
  Navigate,
  Outlet,
  Route,
  RouterProvider,
  Routes,
} from "react-router";
import { AuthProvider } from "@/hooks/useAuth";
import AuthLayout from "@/pages/auth/layout";
import StudentLoginPage from "@/pages/auth/student";
import StaffLoginPage from "@/pages/auth/staff";
import { AdminLoginRoute, AdminShell } from "@/admin/routes";
import DashboardPage from "@/admin/pages/DashboardPage";
import ClearanceAdminPage from "@/admin/features/clearance/ClearanceAdminPage";
import ComingSoonPage from "@/admin/pages/ComingSoonPage";
import StudentHomePage from "@/pages/student/home";
import ServiceRequestsPage from "@/pages/student/service-requests";
import RequestStatusPage from "@/pages/student/request-status";
import ClearancePage from "@/pages/student-services/online-clearance";
import ClassSchedulesPage from "@/pages/academics/class-schedules";
import AcademicCalendarPage from "@/pages/academics/academic-calendar";
import OnlineEnrollmentPage from "@/pages/online-enrollment";
import EnrollmentConfirmationPage from "@/pages/online-enrollment/confirmation";
import EnrollmentStatusPage from "@/pages/online-enrollment/status";
import EnrollmentStepPage from "@/pages/online-enrollment/step";
import StudentProfilePage from "@/features/profile/StudentProfilePage";

export function ProtectedEnrollment() {
  return (
    <Outlet />
  );
}

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
        <Route path="clearance-requests" element={<ClearanceAdminPage />} />
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
const router = createBrowserRouter([
  {
    path: "*",
    element: (
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    ),
  },
]);

createRoot(document.getElementById("root")!).render(<RouterProvider router={router} />);