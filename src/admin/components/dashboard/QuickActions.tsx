import {
  ArrowUpRight,
  ClipboardCheck,
  Megaphone,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link } from "react-router";
import type { AdminRole } from "../../types";

type QuickAction = {
  label: string;
  description: string;
  to: string;
  icon: LucideIcon;
  roles: AdminRole[];
};

const ACTIONS: QuickAction[] = [
  {
    label: "Review enrollments",
    description: "Applications waiting for a decision",
    to: "/admin/enrollment/for-review",
    icon: ClipboardCheck,
    roles: ["admin", "registrar"],
  },
  {
    label: "Sign clearance",
    description: "Requests assigned to your office",
    to: "/admin/clearance-requests",
    icon: ShieldCheck,
    roles: ["admin", "registrar", "dean", "library", "accounting", "sao", "instructor"],
  },
  {
    label: "Publish announcement",
    description: "Share news with the student portal",
    to: "/admin/news/announcements",
    icon: Megaphone,
    roles: ["admin", "sao"],
  },
  {
    label: "Find a student",
    description: "Search accounts and records",
    to: "/admin/students",
    icon: UserRound,
    roles: ["admin", "registrar", "sao"],
  },
];

/** Role-filtered shortcuts for the tasks staff do most often. */
export function QuickActions({ role }: { role: AdminRole }) {
  const actions = ACTIONS.filter((action) => action.roles.includes(role)).slice(0, 4);

  return (
    <ul className="grid gap-2.5 sm:grid-cols-2">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <li key={action.to}>
            <Link
              to={action.to}
              className="group flex h-full items-start gap-2.5 rounded-xl border border-cpc-tile-border/70 bg-white p-3 transition-colors hover:border-cpc-tile-border hover:bg-cpc-section-light/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cpc-section-light text-cpc-blue-accent">
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1 font-poppins text-xs font-semibold text-cpc-navy-text">
                  {action.label}
                  <ArrowUpRight
                    className="h-3 w-3 shrink-0 text-cpc-muted-blue opacity-0 transition-opacity group-hover:opacity-100"
                    aria-hidden
                  />
                </span>
                <span className="mt-0.5 block font-poppins text-[10px] leading-snug text-cpc-heading-soft">
                  {action.description}
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
