/**
 * Sidebar configuration.
 *
 * The menu is data-driven: every item declares the roles that may see it, an
 * optional badge key, and (for groups) its children. `filterNavigation` is the
 * single place role visibility is applied, while `isRouteActive` is the single
 * place active-route detection lives. Sidebar components only render what this
 * module returns.
 */
import {
  AlertCircle,
  BookOpen,
  Briefcase,
  CalendarDays,
  CalendarHeart,
  CalendarRange,
  CheckCircle2,
  ClipboardList,
  Eye,
  FileStack,
  FileText,
  GraduationCap,
  HelpCircle,
  LayoutDashboard,
  LayoutGrid,
  LifeBuoy,
  Megaphone,
  MessageSquareWarning,
  Newspaper,
  Send,
  Settings,
  Settings2,
  ShieldCheck,
  Ticket,
  UserPen,
  UserRound,
  Users,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { OfficeId } from "@/types/clearance";
import type { AdminBadgeKey, AdminRole, AdminUser } from "@/types/admin";

export type NavLeaf = {
  type: "link";
  id: string;
  label: string;
  to: string;
  icon: LucideIcon;
  roles: AdminRole[];
  badgeKey?: AdminBadgeKey;
};

export type NavGroup = {
  type: "group";
  id: string;
  label: string;
  icon: LucideIcon;
  roles: AdminRole[];
  badgeKey?: AdminBadgeKey;
  children: NavLeaf[];
};

export type NavItem = NavLeaf | NavGroup;

export type NavSection = {
  id: string;
  label: string;
  items: NavItem[];
};

export const ALL_ROLES: AdminRole[] = [
  "admin",
  "registrar",
  "dean",
  "library",
  "accounting",
  "sao",
  "instructor",
];

export const ROLE_LABELS: Record<AdminRole, string> = {
  admin: "Administrator",
  registrar: "Registrar Staff",
  dean: "Dean",
  library: "Library Staff",
  accounting: "Accounting Staff",
  sao: "SAO / SSG Adviser",
  instructor: "Instructor",
};

export const ROLE_OFFICES: Record<AdminRole, OfficeId | null> = {
  admin: null,
  registrar: "registrar",
  dean: "dean",
  library: "library",
  accounting: "accounting",
  sao: "sao",
  instructor: "instructor",
};

/** Mock staff accounts used by the demo login and the role switcher. */
export const ADMIN_USERS: Record<AdminRole, AdminUser> = {
  admin: {
    id: "admin",
    name: "Maria Santos",
    role: "admin",
    office: null,
    initials: "MS",
    title: "Administrator",
  },
  registrar: {
    id: "registrar",
    name: "Mrs. Liza Reyes",
    role: "registrar",
    office: "registrar",
    initials: "LR",
    title: "Registrar Staff",
  },
  dean: {
    id: "dean",
    name: "Dr. Miguel Santos",
    role: "dean",
    office: "dean",
    initials: "MS",
    title: "Dean",
  },
  library: {
    id: "library",
    name: "Ms. Ana Villanueva",
    role: "library",
    office: "library",
    initials: "AV",
    title: "Library Staff",
  },
  accounting: {
    id: "accounting",
    name: "Mr. Jose Cruz",
    role: "accounting",
    office: "accounting",
    initials: "JC",
    title: "Accounting Staff",
  },
  sao: {
    id: "sao",
    name: "Prof. Lorna Fernandez",
    role: "sao",
    office: "sao",
    initials: "LF",
    title: "SAO / SSG Adviser",
  },
  instructor: {
    id: "instructor",
    name: "Prof. Ramon Dela Cruz",
    role: "instructor",
    office: "instructor",
    initials: "RD",
    title: "Instructor",
  },
};

export const NAV_SECTIONS: NavSection[] = [
  {
    id: "main",
    label: "MAIN MENU",
    items: [
      {
        type: "link",
        id: "dashboard",
        label: "Dashboard",
        to: "/admin/dashboard",
        icon: LayoutDashboard,
        roles: ALL_ROLES,
      },
      {
        type: "group",
        id: "enrollment",
        label: "Enrollment",
        icon: ClipboardList,
        roles: ["admin", "registrar"],
        badgeKey: "enrollment",
        children: [
          {
            type: "link",
            id: "applications",
            label: "Applications",
            to: "/admin/enrollment/applications",
            icon: FileText,
            roles: ["admin", "registrar"],
          },
          {
            type: "link",
            id: "for-review",
            label: "For Review",
            to: "/admin/enrollment/for-review",
            icon: Eye,
            roles: ["admin", "registrar"],
          },
          {
            type: "link",
            id: "approved",
            label: "Approved",
            to: "/admin/enrollment/approved",
            icon: CheckCircle2,
            roles: ["admin", "registrar"],
          },
          {
            type: "link",
            id: "needs-requirements",
            label: "Needs Requirements",
            to: "/admin/enrollment/needs-requirements",
            icon: AlertCircle,
            roles: ["admin", "registrar"],
          },
          {
            type: "link",
            id: "periods",
            label: "Enrollment Periods",
            to: "/admin/enrollment/periods",
            icon: CalendarRange,
            roles: ["admin", "registrar"],
          },
        ],
      },
      {
        type: "group",
        id: "student-services",
        label: "Student Services",
        icon: Briefcase,
        roles: ALL_ROLES,
        children: [
          {
            type: "link",
            id: "clearance",
            label: "Clearance Requests",
            to: "/admin/clearance-requests",
            icon: ShieldCheck,
            roles: ALL_ROLES,
            badgeKey: "clearance",
          },
          {
            type: "link",
            id: "service-requests",
            label: "Service Requests",
            to: "/admin/service-requests",
            icon: Wrench,
            roles: ["admin", "registrar", "sao", "dean"],
          },
          {
            type: "link",
            id: "document-requests",
            label: "Document Requests",
            to: "/admin/document-requests",
            icon: FileStack,
            roles: ["admin", "registrar"],
          },
        ],
      },
      {
        type: "group",
        id: "academics",
        label: "Academics",
        icon: GraduationCap,
        roles: ["admin", "registrar", "dean", "instructor"],
        children: [
          {
            type: "link",
            id: "class-schedules",
            label: "Class Schedules",
            to: "/admin/academics/class-schedules",
            icon: CalendarDays,
            roles: ["admin", "registrar", "dean", "instructor"],
          },
          {
            type: "link",
            id: "sections",
            label: "Sections",
            to: "/admin/academics/sections",
            icon: LayoutGrid,
            roles: ["admin", "registrar", "dean"],
          },
          {
            type: "link",
            id: "subjects",
            label: "Subjects",
            to: "/admin/academics/subjects",
            icon: BookOpen,
            roles: ["admin", "registrar", "dean", "instructor"],
          },
          {
            type: "link",
            id: "instructors",
            label: "Instructors",
            to: "/admin/academics/instructors",
            icon: UserRound,
            roles: ["admin", "registrar", "dean"],
          },
        ],
      },
      {
        type: "group",
        id: "student-support",
        label: "Student Support",
        icon: LifeBuoy,
        roles: ["admin", "registrar", "dean", "sao"],
        children: [
          {
            type: "link",
            id: "complaints",
            label: "Complaints",
            to: "/admin/support/complaints",
            icon: MessageSquareWarning,
            roles: ["admin", "registrar", "dean", "sao"],
            badgeKey: "complaints",
          },
          {
            type: "link",
            id: "tickets",
            label: "Support Tickets",
            to: "/admin/support/tickets",
            icon: Ticket,
            roles: ["admin", "registrar", "sao"],
          },
          {
            type: "link",
            id: "faqs",
            label: "FAQs",
            to: "/admin/support/faqs",
            icon: HelpCircle,
            roles: ["admin", "registrar", "sao"],
          },
        ],
      },
      {
        type: "group",
        id: "news",
        label: "News & Information",
        icon: Newspaper,
        roles: ["admin", "sao"],
        children: [
          {
            type: "link",
            id: "announcements",
            label: "Announcements",
            to: "/admin/news/announcements",
            icon: Megaphone,
            roles: ["admin", "sao"],
          },
          {
            type: "link",
            id: "events",
            label: "Events",
            to: "/admin/news/events",
            icon: CalendarHeart,
            roles: ["admin", "sao"],
          },
          {
            type: "link",
            id: "publish",
            label: "Publish",
            to: "/admin/news/publish",
            icon: Send,
            roles: ["admin", "sao"],
          },
        ],
      },
    ],
  },
  {
    id: "accounts",
    label: "ACCOUNTS",
    items: [
      {
        type: "group",
        id: "student-accounts",
        label: "Student Accounts",
        icon: Users,
        roles: ["admin", "registrar", "sao"],
        children: [
          {
            type: "link",
            id: "all-students",
            label: "All Students",
            to: "/admin/students",
            icon: Users,
            roles: ["admin", "registrar", "sao"],
          },
          {
            type: "link",
            id: "profile-corrections",
            label: "Profile Correction Requests",
            to: "/admin/students/profile-corrections",
            icon: UserPen,
            roles: ["admin", "registrar"],
            badgeKey: "profileCorrections",
          },
          {
            type: "link",
            id: "account-settings",
            label: "Account Settings",
            to: "/admin/students/account-settings",
            icon: Settings2,
            roles: ["admin"],
          },
        ],
      },
    ],
  },
];

/** Settings lives in the pinned bottom block, not in the scrolling menu. */
export const SETTINGS_NAV: NavLeaf = {
  type: "link",
  id: "settings",
  label: "Settings",
  to: "/admin/settings",
  icon: Settings,
  roles: ALL_ROLES,
};

/** Applies role visibility to both groups and their children. */
export function filterNavigation(role: AdminRole): NavSection[] {
  return NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.flatMap<NavItem>((item) => {
      if (!item.roles.includes(role)) return [];
      if (item.type === "link") return [item];

      const children = item.children.filter((child) => child.roles.includes(role));
      return children.length > 0 ? [{ ...item, children }] : [];
    }),
  })).filter((section) => section.items.length > 0);
}

/** Exact match keeps `/admin/students` from also highlighting its child page. */
export function isRouteActive(pathname: string, to: string): boolean {
  if (to === "/admin/dashboard") {
    return pathname === "/admin" || pathname === "/admin/dashboard";
  }
  return pathname === to;
}

export function isNavItemActive(pathname: string, item: NavItem): boolean {
  if (item.type === "link") return isRouteActive(pathname, item.to);
  return item.children.some((child) => isRouteActive(pathname, child.to));
}

export function findGroupForPath(
  sections: NavSection[],
  pathname: string,
): NavGroup | null {
  for (const section of sections) {
    for (const item of section.items) {
      if (item.type === "group" && isNavItemActive(pathname, item)) return item;
    }
  }
  return null;
}

export type FlatNavLink = {
  label: string;
  to: string;
  group: string;
  icon: LucideIcon;
};

export function flattenNavigation(role: AdminRole): FlatNavLink[] {
  const links: FlatNavLink[] = [];
  for (const section of filterNavigation(role)) {
    for (const item of section.items) {
      if (item.type === "link") {
        links.push({ label: item.label, to: item.to, group: section.label, icon: item.icon });
      } else {
        for (const child of item.children) {
          links.push({
            label: child.label,
            to: child.to,
            group: item.label,
            icon: child.icon,
          });
        }
      }
    }
  }
  if (SETTINGS_NAV.roles.includes(role)) {
    links.push({
      label: SETTINGS_NAV.label,
      to: SETTINGS_NAV.to,
      group: "System",
      icon: SETTINGS_NAV.icon,
    });
  }
  return links;
}

export type BreadcrumbItem = {
  label: string;
  to?: string;
};

export function getBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const crumbs: BreadcrumbItem[] = [{ label: "Admin", to: "/admin/dashboard" }];

  for (const section of NAV_SECTIONS) {
    for (const item of section.items) {
      if (item.type === "link" && item.to === pathname) {
        crumbs.push({ label: item.label });
        return crumbs;
      }
      if (item.type === "group") {
        const child = item.children.find((entry) => entry.to === pathname);
        if (child) {
          crumbs.push({ label: item.label });
          crumbs.push({ label: child.label });
          return crumbs;
        }
      }
    }
  }

  if (pathname === SETTINGS_NAV.to) {
    crumbs.push({ label: SETTINGS_NAV.label });
    return crumbs;
  }

  if (pathname.startsWith("/admin/settings/")) {
    const label = pathname
      .slice("/admin/settings/".length)
      .split("/")
      .filter(Boolean)
      .map((part) => part.replace(/-/g, " "))
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" / ");
    crumbs.push({ label: "Settings", to: SETTINGS_NAV.to });
    if (label) crumbs.push({ label });
    return crumbs;
  }

  const fallback = pathname
    .replace(/^\/admin\/?/, "")
    .split("/")
    .filter(Boolean)
    .map((part) => part.replace(/-/g, " "))
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" / ");

  if (fallback) crumbs.push({ label: fallback });
  return crumbs;
}

export function getPageTitle(pathname: string): string {
  const crumbs = getBreadcrumbs(pathname);
  return crumbs[crumbs.length - 1]?.label ?? "Admin";
}
