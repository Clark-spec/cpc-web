import "@/styles/global.css";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes, Outlet } from "react-router";
import { AuthProvider } from "@/hooks/useAuth";
import AuthLayout from "@/pages/auth/layout";
import StudentLoginPage from "@/pages/auth/student";
import StaffLoginPage from "@/pages/auth/staff";
import AdminLoginPage from "@/pages/auth/admin";
import StudentHomePage from "@/pages/student/home";
import ServiceRequestsPage from "@/pages/student/service-requests";
import ClearancePage from "@/pages/student-services/online-clearance";
import ClassSchedulesPage from "@/pages/academics/class-schedules";
import AcademicCalendarPage from "@/pages/academics/academic-calendar";
import OnlineEnrollmentPage from "@/pages/online-enrollment";
import EnrollmentConfirmationPage from "@/pages/online-enrollment/confirmation";
import EnrollmentStatusPage from "@/pages/online-enrollment/status";
import EnrollmentStepPage from "@/pages/online-enrollment/step";

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
        <Route path="admin" element={<AdminLoginPage />} />
      </Route>

      {/* Plain placeholder so the Admin footer link does not 404. */}
      <Route path="/login/admin" element={<AdminLoginPage />} />

      {/* Student home, shown after the student signs in. */}
      <Route path="/student/home" element={<StudentHomePage />} />

      {/* Student services */}
      <Route path="/student/service-requests" element={<ServiceRequestsPage />} />
      {/* Student services. */}
      <Route path="/student-services/online-clearance" element={<ClearancePage />} />

      {/* Academics. */}
      <Route path="/academics/class-schedules" element={<ClassSchedulesPage />} />
      <Route path="/academics/academic-calendar" element={<AcademicCalendarPage />} />

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

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  </BrowserRouter>,
);