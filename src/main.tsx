import "@/styles/global.css";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes, Outlet } from "react-router";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import AuthLayout from "@/pages/auth/layout";
import StudentLoginPage from "@/pages/auth/student";
import StaffLoginPage from "@/pages/auth/staff";
import AdminLoginPage from "@/pages/auth/admin";

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
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
        element={<ProtectedEnrollment><Outlet /></ProtectedEnrollment>}
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