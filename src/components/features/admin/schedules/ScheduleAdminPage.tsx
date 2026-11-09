import { ScheduleAdminProvider } from "@/components/features/admin/schedules/ScheduleAdminContext";
import { ScheduleWorkspace } from "@/components/features/admin/schedules/ScheduleWorkspace";

/**
 * Route: /admin/academics/class-schedules — the staff side of the student
 * Class Schedules page. AdminLayout (sidebar, top bar, toasts) already wraps
 * it, so this file only mounts the module's own context.
 */
export default function ScheduleAdminPage() {
  return (
    <ScheduleAdminProvider>
      <ScheduleWorkspace />
    </ScheduleAdminProvider>
  );
}
