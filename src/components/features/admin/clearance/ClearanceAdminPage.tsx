import { ClearanceAdminProvider } from "@/components/features/admin/clearance/ClearanceAdminContext";
import { ClearanceWorkspace } from "@/components/features/admin/clearance/ClearanceWorkspace";

/**
 * Route: /admin/clearance-requests — the staff side of the student Online
 * Clearance page. The shell (sidebar, top bar, toasts, admin data) already
 * wraps it; this file only mounts the module's own context.
 */
export default function ClearanceAdminPage() {
  return (
    <ClearanceAdminProvider>
      <ClearanceWorkspace />
    </ClearanceAdminProvider>
  );
}
