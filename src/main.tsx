import "@/styles/global.css";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import AuthLayout from "@/pages/auth/layout";
import StudentLoginPage from "@/pages/auth/student";
import StaffLoginPage from "@/pages/auth/staff";
import AdminLoginPage from "@/pages/auth/admin";
import StudentHomePage from "@/pages/student/home";

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <Routes>
      {/* The student login is the default login screen. */}
      <Route path="/" element={<Navigate to="/login/student" replace />} />

      <Route path="/login" element={<AuthLayout />}>
        <Route index element={<Navigate to="student" replace />} />
        <Route path="student" element={<StudentLoginPage />} />
        <Route path="staff" element={<StaffLoginPage />} />
        <Route path="admin" element={<AdminLoginPage />} />
      </Route>

      {/* Student home, shown after the student signs in. */}
      <Route path="/student/home" element={<StudentHomePage />} />

      <Route path="*" element={<Navigate to="/login/student" replace />} />
    </Routes>
  </BrowserRouter>,
);
