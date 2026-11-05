import { Route } from "react-router";
import { ProtectedEnrollment } from "@/student/layout/ProtectedEnrollment";
import StudentHomePage from "@/student/pages/home";
import ServiceRequestsPage from "@/student/pages/service-requests";
import RequestStatusPage from "@/student/pages/request-status";
import ClearancePage from "@/student/pages/online-clearance";
import ClassSchedulesPage from "@/student/pages/class-schedules";
import AcademicCalendarPage from "@/student/pages/academic-calendar";
import OnlineEnrollmentPage from "@/student/pages/enrollment";
import EnrollmentConfirmationPage from "@/student/pages/enrollment/confirmation";
import EnrollmentStatusPage from "@/student/pages/enrollment/status";
import EnrollmentStepPage from "@/student/pages/enrollment/step";
import StudentProfilePage from "@/student/pages/StudentProfilePage";

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
