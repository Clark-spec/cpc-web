import "@/styles/global.css";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes, Outlet } from "react-router";
import { AuthProvider } from "@/hooks/useAuth";
import AuthLayout from "@/pages/auth/layout";
import StudentLoginPage from "@/pages/auth/student";
import StaffLoginPage from "@/pages/auth/staff";
import AdminLoginPage from "@/pages/auth/admin";
import OnlineEnrollmentPage from "@/pages/online-enrollment";
import EnrollmentConfirmationPage from "@/pages/online-enrollment/confirmation";
import EnrollmentStatusPage from "@/pages/online-enrollment/status";
import EnrollmentStep1Page from "@/pages/online-enrollment/step-1";
import EnrollmentStep2Page from "@/pages/online-enrollment/step-2";
import EnrollmentStep3Page from "@/pages/online-enrollment/step-3";
import EnrollmentStep4Page from "@/pages/online-enrollment/step-4";

function ProtectedEnrollment() {
  return <Outlet />;
}

function AppRoutes() {
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

      {/* Enrollment routes - no app layout, pages render directly */}
      <Route
        path="/online-enrollment"
        element={<ProtectedEnrollment />}
      >
        <Route index element={<OnlineEnrollmentPage />} />
        <Route path="step/1" element={<EnrollmentStep1Page />} />
        <Route path="step/2" element={<EnrollmentStep2Page />} />
        <Route path="step/3" element={<EnrollmentStep3Page />} />
        <Route path="step/4" element={<EnrollmentStep4Page />} />
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