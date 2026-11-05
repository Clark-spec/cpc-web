import { Outlet } from "react-router";

/** Enrollment subtree wrapper: renders the flow pages without the app chrome. */
export function ProtectedEnrollment() {
  return (
    <Outlet />
  );
}
