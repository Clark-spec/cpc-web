import {
  BarChart3,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Eye,
  FileCheck2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link } from "react-router";

type QuickAction = {
  label: string;
  description: string;
  to: string;
  icon: LucideIcon;
};

const ACTIONS: QuickAction[] = [
  {
    label: "View All Applications",
    description: "Browse the complete applicant list",
    to: "/admin/enrollment/applications",
    icon: ClipboardList,
  },
  {
    label: "Review Pending Applications",
    description: "Verify credentials waiting for review",
    to: "/admin/enrollment/for-review",
    icon: Eye,
  },
  {
    label: "View Approved Applications",
    description: "See applicants cleared for enrollment",
    to: "/admin/enrollment/approved",
    icon: CheckCircle2,
  },
  {
    label: "Manage Enrollment Requirements",
    description: "Follow up on missing documents",
    to: "/admin/enrollment/needs-requirements",
    icon: FileCheck2,
  },
  {
    label: "View Enrollment Reports",
    description: "Open enrollment periods and summaries",
    to: "/admin/enrollment/periods",
    icon: BarChart3,
  },
];

/** The five enrollment shortcuts requested for the dashboard. */
export function EnrollmentQuickActions() {
  return (
    <ul className="space-y-1.5">
      {ACTIONS.map((action) => {
        const Icon = action.icon;
        return (
          <li key={action.to}>
            <Link
              to={action.to}
              className="group flex items-center gap-2.5 rounded-lg border border-transparent px-2 py-2 transition-colors hover:border-admin-border hover:bg-admin-page/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-info"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-admin-accent/60 text-admin-secondary">
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-poppins text-[11.5px] leading-snug font-semibold text-admin-text">
                  {action.label}
                </span>
                <span className="mt-0.5 block font-poppins text-[10px] leading-snug text-admin-muted">
                  {action.description}
                </span>
              </span>
              <ChevronRight
                className="h-3.5 w-3.5 shrink-0 text-admin-muted transition-transform group-hover:translate-x-0.5 group-hover:text-admin-secondary"
                aria-hidden
              />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
