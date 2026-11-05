import { Navigate, Route } from "react-router";
import { AdminLoginRoute, AdminShell } from "@/admin/layout/AdminShell";
import ClearanceAdminPage from "@/admin/features/clearance/ClearanceAdminPage";
import ComingSoonPage from "@/admin/pages/ComingSoonPage";
import DashboardPage from "@/admin/pages/DashboardPage";
import EnrollmentApplicationsPage from "@/admin/pages/EnrollmentApplicationsPage";
import ServiceRequestManagementPage from "@/admin/pages/ServiceRequestsPage";

/**
 * The staff portal's own route subtree, mounted by `@/app/routes`.
 * Kept as JSX children rather than a component so react-router's
 * `createRoutesFromChildren` still traverses the `<Route>` elements.
 */
export const AdminRouteElements = (
  <>
    {/* Admin / staff portal. */}
    <Route path="/admin/login" element={<AdminLoginRoute />} />
    <Route path="/admin" element={<AdminShell />}>
      <Route index element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<DashboardPage />} />
      <Route path="clearance-requests" element={<ClearanceAdminPage />} />
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
  </>
);
