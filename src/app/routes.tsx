import { Navigate, Route, RouterProvider, Routes } from "react-router";
import { AppProviders } from "@/app/providers";
import { createAppRouter } from "@/lib/router";
import AuthLayout from "@/pages/auth/layout";
import StudentLoginPage from "@/pages/auth/student/StudentLoginPage";
import StaffLoginPage from "@/pages/auth/staff/StaffLoginPage";
import { AdminRouteElements } from "@/admin/routes";
import { StudentRouteElements } from "@/student/routes";

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

      {AdminRouteElements}

      {StudentRouteElements}

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
