import {
  ArrowUpRight,
  ClipboardCheck,
  Inbox,
  Megaphone,
  ShieldCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link } from "react-router";
import { cn } from "@/lib/cn";
import type { AdminRole } from "@/types/admin";

type CountKey = "enrollments" | "clearance" | "serviceRequests";

type QuickAction = {
  label: string;
  description: string;
  to: string;
  icon: LucideIcon;
  roles: AdminRole[];
  /** Pending volume shown as a pill, when the task is queue-driven. */
  countKey?: CountKey;
};

const ALL_ROLES: AdminRole[] = [
  "admin",
  "registrar",
  "dean",
  "library",
  "accounting",
  "sao",
  "instructor",
];

const ACTIONS: QuickAction[] = [
  {
    label: "Review Enrollments",
    description: "Applications waiting for a decision",
    to: "/admin/enrollment/for-review",
    icon: ClipboardCheck,
    roles: ["admin", "registrar"],
    countKey: "enrollments",
  },
  {
    label: "Process Clearance",
    description: "Requests assigned to your office",
    to: "/admin/clearance-requests",
    icon: ShieldCheck,
    roles: ALL_ROLES,
    countKey: "clearance",
  },
  {
    label: "View Service Requests",
    description: "Certificates, transcripts and forms",
    to: "/admin/student-services/service-requests",
    icon: Inbox,
    roles: ["admin", "registrar", "sao"],
    countKey: "serviceRequests",
  },
  {
    label: "Publish Announcement",
    description: "Share news with the student portal",
    to: "/admin/news/announcements",
    icon: Megaphone,
    roles: ["admin", "sao"],
  },
];

type QuickActionsProps = {
  role: AdminRole;
  counts: Record<CountKey, number>;
};

/**
 * Role-filtered shortcuts. The first action the current role can take is the
 * primary button; the rest are outlined.
 */
export function QuickActions({ role, counts }: QuickActionsProps) {
  const actions = ACTIONS.filter((action) => action.roles.includes(role)).slice(0, 4);

  if (actions.length === 0) {
    return (
      <p className="font-poppins text-xs text-cpc-heading-soft">
        No quick actions are available for the {role} role.
      </p>
    );
  }

  return (
    <ul className="grid gap-2.5">
      {actions.map((action, index) => {
        const Icon = action.icon;
        const primary = index === 0;
        const count = action.countKey ? counts[action.countKey] : null;

        return (
          <li key={action.to}>
            <Link
              to={action.to}
              className={cn(
                "group flex h-full items-start gap-2.5 rounded-xl border p-3 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent",
                primary
                  ? "border-cpc-navy bg-cpc-navy text-white hover:bg-cpc-navy-deep"
                  : "border-cpc-tile-border/70 bg-white hover:border-cpc-tile-border hover:bg-cpc-section-light/50",
              )}
            >
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                  primary ? "bg-white/15 text-white" : "bg-cpc-section-light text-cpc-blue-accent",
                )}
              >
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className={cn(
                    "flex items-center gap-1 font-poppins text-xs font-semibold",
                    primary ? "text-white" : "text-cpc-navy-text",
                  )}
                >
                  {action.label}
                  <ArrowUpRight
                    className={cn(
                      "h-3 w-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-100",
                      primary ? "text-white" : "text-cpc-muted-blue",
                    )}
                    aria-hidden
                  />
                </span>
                <span
                  className={cn(
                    "mt-0.5 block font-poppins text-[10px] leading-snug",
                    primary ? "text-white/80" : "text-cpc-heading-soft",
                  )}
                >
                  {action.description}
                </span>
              </span>

              {count !== null && (
                <span
                  className={cn(
                    "shrink-0 rounded-full px-1.5 py-0.5 font-poppins text-[10px] font-bold tabular-nums",
                    primary
                      ? "bg-white/20 text-white"
                      : count > 0
                        ? "bg-amber-50 text-amber-700"
                        : "bg-cpc-section-light text-cpc-heading-soft",
                  )}
                >
                  {count > 99 ? "99+" : count}
                  <span className="sr-only"> waiting</span>
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
