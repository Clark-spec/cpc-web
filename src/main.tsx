import "@/styles/global.css";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes, Outlet } from "react-router";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import AuthLayout from "@/pages/auth/layout";
import StudentLoginPage from "@/pages/auth/student";
import StaffLoginPage from "@/pages/auth/staff";
import AdminLoginPage from "@/pages/auth/admin";
import OnlineEnrollmentPage from "@/pages/online-enrollment";
import EnrollmentStepPage from "@/pages/online-enrollment/step-1";
import EnrollmentConfirmationPage from "@/pages/online-enrollment/confirmation";
import EnrollmentStatusPage from "@/pages/online-enrollment/status";

function ProtectedEnrollment({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="enroll-layout flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-enroll-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-enroll-text">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login/student" replace />;
  }

  if (user && user.role !== "student") {
    return <Navigate to="/login/student" replace />;
  }

  return <>{children}</>;
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
      </Route>
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