import { useRef } from "react";
import { ErrorCard } from "@/components/ui/admin/ErrorCard";
import { useScheduleAdmin } from "../context/ScheduleAdminContext";
import { PublishStatusBar } from "./PublishStatusBar";
import { ScheduleBanner } from "./ScheduleBanner";
import { ScheduleKpiStrip } from "./ScheduleKpiStrip";
import { ScheduleTable } from "./ScheduleTable";
import { ScheduleToolbar } from "./ScheduleToolbar";
import { SectionTabs } from "./SectionTabs";

/**
 * The staff Class Schedules page.
 *
 * (1) Nothing here owns data. The banner, the status bar, the KPI strip and the
 * list all read the same context, so one draft edit repaints every part of the
 * page at once, and a publish in another tab arrives through the same path.
 * (2) The page keeps no scroll-position hacks or local copies of the filters:
 * the section, view and filters live in the URL, so this component is a pure
 * function of the store plus the address bar.
 */
export function ScheduleWorkspace() {
  const { error, reload } = useScheduleAdmin();
  const searchRef = useRef<HTMLInputElement>(null);

  if (error) {
    return (
      <div className="space-y-6">
        <ScheduleBanner />
        <ErrorCard message={error} onRetry={() => void reload()} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ScheduleBanner />

      <PublishStatusBar />

      <ScheduleKpiStrip />

      <SectionTabs />

      <ScheduleToolbar searchInputRef={searchRef} />

      <ScheduleTable />
    </div>
  );
}
