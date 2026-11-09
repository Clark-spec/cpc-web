import {
  CalendarPlus,
  Download,
  FolderCog,
  ListChecks,
  PencilLine,
  Printer,
  Send,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { primaryButtonClass } from "./CalendarPieces";

type CalendarQuickActionsProps = {
  draftCount: number;
  onAddEvent: () => void;
  onEditEvent: () => void;
  onViewAllEvents: () => void;
  onManageCategories: () => void;
  onPublishCalendar: () => void;
  onExport: () => void;
  onPrint: () => void;
};

export function CalendarQuickActions({
  draftCount,
  onAddEvent,
  onEditEvent,
  onViewAllEvents,
  onManageCategories,
  onPublishCalendar,
  onExport,
  onPrint,
}: CalendarQuickActionsProps) {
  const actions = [
    {
      label: "Add Calendar Event",
      icon: CalendarPlus,
      onClick: onAddEvent,
      primary: true,
    },
    { label: "Edit Calendar Event", icon: PencilLine, onClick: onEditEvent },
    { label: "View All Events", icon: ListChecks, onClick: onViewAllEvents },
    { label: "Manage Event Categories", icon: FolderCog, onClick: onManageCategories },
    { label: "Publish Calendar", icon: Send, onClick: onPublishCalendar },
    { label: "Export Calendar", icon: Download, onClick: onExport },
    { label: "Print Calendar", icon: Printer, onClick: onPrint },
  ];

  return (
    <section
      aria-labelledby="calendar-quick-actions-heading"
      className="overflow-hidden rounded-2xl border border-cpc-tile-border/70 bg-white shadow-[0_18px_50px_rgba(15,36,104,0.22)]"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cpc-tile-border/60 px-4 py-3">
        <div>
          <h2
            id="calendar-quick-actions-heading"
            className="font-poppins text-sm leading-tight font-semibold text-cpc-navy-text"
          >
            Calendar Quick Actions
          </h2>
          <p className="mt-0.5 font-poppins text-[11px] text-cpc-heading-soft">
            Every action updates the shared frontend calendar state.
          </p>
        </div>
        <p className="font-poppins text-[11px] text-cpc-heading-soft">
          {draftCount > 0
            ? `${draftCount} event${draftCount === 1 ? "" : "s"} ready to publish`
            : "No drafts waiting for publication"}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 px-4 py-4 sm:grid-cols-4 xl:grid-cols-7">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              type="button"
              onClick={action.onClick}
              className={cn(
                action.primary
                  ? primaryButtonClass("px-2 py-2 text-xs")
                  : "inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-cpc-tile-border bg-white px-2 py-2 font-poppins text-xs font-semibold text-cpc-navy-text transition-colors hover:border-cpc-blue-accent/40 hover:bg-cpc-section-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent",
              )}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span className="truncate">{action.label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
