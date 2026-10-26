import "@/styles/global.css";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import AuthLayout from "@/pages/auth/layout";
import StudentLoginPage from "@/pages/auth/student";
import StaffLoginPage from "@/pages/auth/staff";
import AdminLoginPage from "@/pages/auth/admin";

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <Routes>
      {/* The student login is the default login screen. */}
      <Route path="/" element={<Navigate to="/login/student" replace />} />

      <Route path="/login" element={<AuthLayout />}>
        <Route index element={<Navigate to="student" replace />} />
        <Route path="student" element={<StudentLoginPage />} />
        <Route path="staff" element={<StaffLoginPage />} />
      </Route>

      {/* Plain placeholder so the Admin footer link does not 404. */}
      <Route path="/login/admin" element={<AdminLoginPage />} />

      <Route path="*" element={<Navigate to="/login/student" replace />} />
    </Routes>
  </BrowserRouter>,
);
