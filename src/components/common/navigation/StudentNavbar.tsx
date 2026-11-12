import { useState } from "react";
import { Link, useLocation } from "react-router";
import {
  ArrowRight,
  ChevronDown,
  ClipboardList,
  FileCheck2,
  GraduationCap,
  LogOut,
  Menu,
  UserRound,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import cpcLogo from "@/assets/cpc-logo.jpg";
import { useAuth } from "@/components/context/useAuth";

type NavLink = {
  label: string;
  to: string;
};

type NavItem = {
  label: string;
  links: NavLink[];
};

// TODO: links without a route yet stay as "#" until their pages exist.
const navItems: NavItem[] = [
  {
    label: "Enrollment",
    links: [
      { label: "Online Enrollment", to: "/online-enrollment" },
      { label: "Enrollment Requirements", to: "#" },
      { label: "Registrar Information", to: "#" },
    ],
  },
  {
    label: "Student Service",
    links: [
      { label: "Online Clearance", to: "/student-services/online-clearance" },
      { label: "Online Kiosk", to: "#" },
      { label: "Service Request", to: "/student/service-requests" },
    ],
  },
  {
    label: "Academics",
    links: [





      { label: "Class Schedules", to: "/academics/class-schedules" },
      { label: "Academic Calendar", to: "/academics/academic-calendar" },
      { label: "Grades / Academic Records", to: "#" },
    ],
  },
  {
    label: "Student Support",
    links: [
      { label: "Opportunities", to: "#" },
      { label: "Online Complaint", to: "/student-support/online-complaint" },
      { label: "Scholarship", to: "#" },
    ],
  },
  {
    label: "News & Information",
    links: [
      { label: "News", to: "#" },
      { label: "Announcements", to: "#" },
      { label: "School Updates", to: "#" },
    ],
  },
  {
    label: "My Account",
    links: [
      { label: "Student Profile", to: "/my-account/profile" },
      { label: "Enrollment Status", to: "/online-enrollment/status" },
      { label: "Clearance Status", to: "/student-services/online-clearance" },
      { label: "Violations", to: "#" },
      { label: "Request Status", to: "/student/request-status" },
    ],
  },
];

const utilityLinks = [
  { label: "Student Profile", to: "/my-account/profile", icon: UserRound },
  { label: "Enrollment Status", to: "/online-enrollment/status", icon: FileCheck2 },
  { label: "Request Status", to: "/student/request-status", icon: ClipboardList },
];

const quickLinks = [
  { label: "Online Enrollment", to: "/online-enrollment" },
  { label: "Online Clearance", to: "/student-services/online-clearance" },
];

function isLinkActive(pathname: string, to: string): boolean {
  return to !== "#" && pathname === to;
}

function isGroupActive(pathname: string, item: NavItem): boolean {
  return item.links.some((link) => isLinkActive(pathname, link.to));
}

type StudentNavbarProps = {
  /**
   * Reflow at small widths and show the hamburger menu. The Home page scales
   * its 1440px frame with `zoom`, so it keeps the original fixed layout; the
   * clearance page is truly responsive and opts in.
   */
  fluid?: boolean;
};

export function StudentNavbar({ fluid = false }: StudentNavbarProps) {
  const { pathname } = useLocation();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { logout, user } = useAuth();

  const gutter = fluid ? "px-4 sm:px-6 lg:px-[50px]" : "px-[30px]";

  return (
    <div className="relative w-full border-b border-cpc-tile-border/50 bg-white shadow-[0_10px_30px_rgba(27,47,158,0.08)]">
      {/* Utility row: portal label + account shortcuts. */}
      <div className="hidden border-b border-cpc-input-border/70 lg:block">
        <div
          className={cn(
            "mx-auto flex h-9 w-full max-w-[1440px] items-center justify-between",
            gutter,
          )}
        >
          <p className="flex items-center gap-2 font-poppins text-[10.5px] font-semibold tracking-[0.16em] text-cpc-navy-text/75 uppercase">
            <GraduationCap className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Student Portal
          </p>

          <ul className="flex items-center gap-6">
            {utilityLinks.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  aria-current={isLinkActive(pathname, link.to) ? "page" : undefined}
                  className={cn(
                    "inline-flex items-center gap-1.5 font-poppins text-[11.5px] font-medium text-cpc-navy-text/75 transition-colors hover:text-cpc-blue-accent",
                    isLinkActive(pathname, link.to) && "font-semibold text-cpc-blue-accent",
                  )}
                >
                  <link.icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Brand row: centered lockup on desktop, school name + motto. */}
      <div className={cn("border-b border-cpc-input-border/70", fluid ? "h-16 lg:h-20" : "h-20")}>
        <div
          className={cn(
            "mx-auto flex h-full w-full max-w-[1440px] items-center justify-between lg:grid lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]",
            gutter,
          )}
        >
          <div className="hidden lg:block" />

          <Link
            to="/student/home"
            className="flex min-w-0 items-center gap-3 rounded-lg transition-opacity hover:opacity-90 lg:gap-4"
          >
            <img
              src={cpcLogo}
              alt="Cordova Public College seal"
              className="h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-cpc-tile-border/40 sm:h-11 sm:w-11 lg:h-14 lg:w-14"
            />
            <div className="min-w-0 font-poppins">
              <p className="text-[17px] leading-[20px] font-extrabold tracking-tight text-cpc-navy-text sm:text-[19px] sm:leading-[22px] lg:text-[26px] lg:leading-[30px]">
                Cordova Public College
              </p>
              <p className="text-center text-[10px] leading-[14px] font-medium tracking-[0.22em] text-[#2d3fa8] uppercase sm:text-[11px]">
                Servire Populum
              </p>
            </div>
          </Link>

          <div className="flex items-center justify-end gap-2">
            <Link
              to="/online-enrollment"
              className={cn(
                "inline-flex items-center gap-2 rounded-md bg-cpc-navy-top px-5 py-2.5 font-poppins text-[11px] font-semibold tracking-[0.12em] text-white uppercase shadow-[0_6px_18px_rgba(27,47,158,0.22)] transition-colors hover:bg-cpc-blue-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent",
                fluid && "hidden lg:inline-flex",
              )}
            >
              Enroll Now
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>

            {fluid && (
              <button
                type="button"
                aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
                aria-expanded={mobileOpen}
                aria-controls="mobile-nav"
                onClick={() => setMobileOpen((previous) => !previous)}
                className={cn(
                  "flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-md border transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent lg:hidden",
                  mobileOpen
                    ? "border-cpc-blue-accent/25 bg-cpc-blue-accent/10 text-cpc-blue-accent"
                    : "border-cpc-input-border bg-white text-cpc-navy-text hover:border-cpc-blue-accent/30 hover:bg-cpc-section-light hover:text-cpc-blue-accent",
                )}
              >
                {mobileOpen ? (
                  <X className="h-5 w-5" aria-hidden />
                ) : (
                  <Menu className="h-5 w-5" aria-hidden />
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Nav row: grouped dropdowns on the left, shortcuts on the right. */}
      <div
        className={cn(
          "bg-white",
          fluid ? "hidden lg:block" : "block",
        )}
      >
        <div
          className={cn(
            "mx-auto flex h-12 w-full max-w-[1440px] items-center justify-between",
            gutter,
          )}
        >
          <nav aria-label="Student portal">
            <ul className="flex items-center gap-6">
              {navItems.map((item, index) => {
                const open = openIndex === index;
                const active = isGroupActive(pathname, item);
                // The final item sits at the right edge, so its panel opens right-aligned.
                const align = index === navItems.length - 1 ? "right-0" : "left-0";

                return (
                  <li
                    key={item.label}
                    className="relative"
                    onMouseEnter={() => setOpenIndex(index)}
                    onMouseLeave={() => setOpenIndex(null)}
                    onKeyDown={(event) => {
                      if (event.key === "Escape") setOpenIndex(null);
                    }}
                  >
                    <button
                      type="button"
                      aria-expanded={open}
                      aria-haspopup="true"
                      onClick={() => setOpenIndex(open ? null : index)}
                      className={cn(
                        "relative flex cursor-pointer items-center gap-1.5 py-2 font-poppins text-[12px] leading-[18px] font-semibold tracking-[0.1em] whitespace-nowrap uppercase transition-colors",
                        "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cpc-blue-accent",
                        open || active
                          ? "text-cpc-blue-accent"
                          : "text-cpc-navy-text hover:text-cpc-blue-accent",
                      )}
                    >
                      {item.label === "My Account" && (
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-cpc-blue-accent/30 bg-cpc-section-light">
                          {user?.avatarUrl ? (
                            <img
                              src={user.avatarUrl}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="font-poppins text-[10px] font-bold text-cpc-blue-accent">
                              {(user?.name ?? "S")
                                .split(" ")
                                .map((n) => n[0])
                                .slice(0, 2)
                                .join("")}
                            </span>
                          )}
                        </span>
                      )}
                      {item.label}
                      <ChevronDown
                        className={cn(
                          "h-3 w-3 shrink-0 transition-transform duration-200",
                          open && "rotate-180",
                        )}
                        aria-hidden
                      />
                      {(open || active) && (
                        <span
                          aria-hidden
                          className="absolute inset-x-0 -bottom-1 h-[2px] rounded-full bg-cpc-blue-accent"
                        />
                      )}
                    </button>

                    {open && (
                      <div className={`student-nav-panel absolute top-full ${align} z-30 pt-2`}>
                        <ul className="min-w-[240px] overflow-hidden rounded-lg border border-cpc-input-border bg-white p-1 shadow-[0_18px_40px_rgba(15,36,104,0.16)]">
                          {item.links.map((link) => (
                            <li key={link.label}>
                              {link.to === "#" ? (
                                <a
                                  href="#"
                                  className="block cursor-default rounded-md px-3 py-2 font-poppins text-[13.5px] leading-[18px] font-normal whitespace-nowrap text-cpc-muted-blue/80"
                                  aria-disabled="true"
                                >
                                  {link.label}
                                </a>
                              ) : (
                                <Link
                                  to={link.to}
                                  aria-current={
                                    isLinkActive(pathname, link.to) ? "page" : undefined
                                  }
                                  className={cn(
                                    "block rounded-md px-3 py-2 font-poppins text-[13.5px] leading-[18px] font-normal whitespace-nowrap text-cpc-navy-text transition-colors hover:bg-cpc-section-light hover:text-cpc-blue-accent",
                                    isLinkActive(pathname, link.to) &&
                                      "bg-cpc-blue-accent/10 font-semibold text-cpc-blue-accent",
                                  )}
                                >
                                  {link.label}
                                </Link>
                              )}
                            </li>
                          ))}
                          {item.label === "My Account" && (
                            <li className="mt-1 border-t border-cpc-input-border/60 pt-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenIndex(null);
                                  logout();
                                }}
                                className="flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 font-poppins text-[13.5px] leading-[18px] font-normal whitespace-nowrap text-red-600 transition-colors hover:bg-red-50 hover:text-red-700"
                              >
                                <LogOut className="h-[15px] w-[15px]" aria-hidden />
                                Sign Out
                              </button>
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className={cn("items-center gap-5", fluid ? "hidden lg:flex" : "flex")}>
            {quickLinks.map((link, index) => (
              <span key={link.to} className="flex items-center gap-5">
                {index > 0 && (
                  <span aria-hidden className="h-3.5 w-px bg-cpc-input-border" />
                )}
                <Link
                  to={link.to}
                  className="font-poppins text-[11px] font-semibold tracking-[0.12em] text-cpc-navy-text uppercase transition-colors hover:text-cpc-blue-accent"
                >
                  {link.label}
                </Link>
              </span>
            ))}
          </div>
        </div>
      </div>

      {fluid && mobileOpen && (
        <div
          id="mobile-nav"
          className="student-nav-panel absolute inset-x-0 top-full z-40 max-h-[70vh] overflow-y-auto border-t border-cpc-input-border bg-white shadow-[0_24px_50px_rgba(15,36,104,0.18)] lg:hidden"
        >
          <nav
            aria-label="Student portal (mobile)"
            className="mx-auto max-w-[1440px] px-4 py-2 sm:px-6"
          >
            {user && (
              <div className="mb-2 flex items-center gap-3 border-b border-cpc-input-border/70 pb-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-cpc-blue-accent/30 bg-cpc-section-light">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="font-poppins text-xs font-bold text-cpc-blue-accent">
                      {user.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                    </span>
                  )}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-poppins text-sm font-semibold text-cpc-navy-text">
                    {user.name}
                  </p>
                  <p className="truncate font-poppins text-xs text-cpc-heading-soft">
                    {user.studentNumber ?? user.email}
                  </p>
                </div>
              </div>
            )}
            {navItems.map((item) => (
              <div
                key={item.label}
                className="border-b border-cpc-input-border/60 py-2.5 last:border-b-0"
              >
                <p className="px-1.5 font-poppins text-[10px] font-semibold tracking-[0.16em] text-cpc-muted-blue uppercase">
                  {item.label}
                </p>
                <ul className="mt-1 space-y-0.5">
                  {item.links.map((link) =>
                    link.to === "#" ? (
                      <li key={link.label}>
                        <a
                          href="#"
                          aria-disabled="true"
                          className="block cursor-default rounded-md px-1.5 py-2 font-poppins text-sm text-cpc-muted-blue"
                        >
                          {link.label}
                        </a>
                      </li>
                    ) : (
                      <li key={link.label}>
                        <Link
                          to={link.to}
                          onClick={() => setMobileOpen(false)}
                          aria-current={isLinkActive(pathname, link.to) ? "page" : undefined}
                          className={cn(
                            "block rounded-md px-1.5 py-2 font-poppins text-sm text-cpc-navy-text transition-colors hover:bg-cpc-section-light hover:text-cpc-blue-accent",
                            isLinkActive(pathname, link.to) &&
                              "bg-cpc-section-light font-semibold text-cpc-blue-accent",
                          )}
                        >
                          {link.label}
                        </Link>
                      </li>
                    ),
                  )}
                </ul>
              </div>
            ))}
            {/* Mobile Sign Out */}
            <div className="border-t border-cpc-input-border/70 pt-3 pb-1">
              <button
                type="button"
                onClick={() => { setMobileOpen(false); logout(); }}
                className="flex w-full items-center gap-2 rounded px-2 py-2 font-poppins text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 hover:text-red-700"
              >
                <LogOut className="h-4 w-4" aria-hidden />
                Sign Out
              </button>
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}
