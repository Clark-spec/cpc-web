import { Route } from "react-router";
import { ProtectedEnrollment } from "@/layouts/ProtectedEnrollment";
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
import StudentProfilePage from "@/pages/student/StudentProfilePage";

/**
 * The student portal's own route subtree, mounted by `@/app/routes`.
 * Kept as JSX children rather than a component so react-router's
 * `createRoutesFromChildren` still traverses the `<Route>` elements.
 */
export const StudentRouteElements = (
  <>
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
  </>
);
