import { useState } from "react";
import { Link } from "react-router";
import { Menu, X } from "lucide-react";
import { CaretDownIcon } from "@/components/common/icons";
import { cn } from "@/lib/cn";
import cpcLogo from "@/assets/cpc-logo.jpg";

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
      { label: "Online Complaint", to: "#" },
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

type StudentNavbarProps = {
  /**
   * Reflow at small widths and show the hamburger menu. The Home page scales
   * its 1440px frame with `zoom`, so it keeps the original fixed layout; the
   * clearance page is truly responsive and opts in.
   */
  fluid?: boolean;
};

export function StudentNavbar({ fluid = false }: StudentNavbarProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div
      className={cn(
        "relative w-full bg-white shadow-[0_4px_16px_rgba(27,47,158,0.10)]",
        fluid ? "h-[88px] lg:h-[120px]" : "h-[120px]",
      )}
    >
      <div
        className={cn(
          "mx-auto flex h-full w-full max-w-[1440px] items-center justify-between",
          fluid ? "px-4 sm:px-6 lg:px-[30px]" : "px-[30px]",
        )}
      >
        <Link
          to="/student/home"
          className={cn("flex items-center", fluid ? "gap-3 lg:gap-[14px]" : "gap-[14px]")}
        >
          <img
            src={cpcLogo}
            alt="Cordova Public College seal"
            className={cn(
              "rounded-full object-cover",
              fluid ? "h-[52px] w-[52px] lg:h-[68px] lg:w-[68px]" : "h-[68px] w-[68px]",
            )}
          />
          <div className="font-poppins">
            <p
              className={cn(
                "font-bold text-cpc-navy-text",
                fluid
                  ? "text-[16px] leading-[20px] sm:text-[19px] lg:text-[22px] lg:leading-[24px]"
                  : "text-[22px] leading-[24px]",
              )}
            >
              Cordova Public College
            </p>
            <p
              className={cn(
                "font-medium tracking-[0.12em] text-[#2d3fa8]",
                fluid
                  ? "text-[12px] leading-[16px] sm:text-[14px] lg:text-[20px] lg:leading-[24px]"
                  : "text-[20px] leading-[24px]",
              )}
            >
              Servire Populum
            </p>
          </div>
        </Link>

        <nav aria-label="Student portal" className={cn(fluid && "hidden lg:block")}>
          <ul className="flex items-center gap-[28px]">
            {navItems.map((item, index) => {
              const open = openIndex === index;
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
                    className="flex cursor-pointer items-center gap-[8px] font-poppins text-[17px] leading-[17px] font-medium text-cpc-navy-text transition-colors hover:text-cpc-blue-accent focus-visible:text-cpc-blue-accent"
                  >
                    {item.label}
                    <CaretDownIcon
                      className={`h-[8px] w-[12px] transition-transform duration-150 ${open ? "rotate-180" : ""}`}
                    />
                  </button>

                  {open && (
                    <div className={`absolute top-full ${align} z-30 pt-[10px]`}>
                      <ul className="min-w-[220px] rounded-[4px] border border-cpc-input-border bg-white py-[8px] shadow-[0_14px_30px_rgba(27,47,158,0.18)]">
                        {item.links.map((link) => (
                          <li key={link.label}>
                            {link.to === "#" ? (
                              <a
                                href="#"
                                className="block px-[18px] py-[8px] font-poppins text-[15px] leading-[18px] font-normal whitespace-nowrap text-cpc-muted-blue"
                                aria-disabled="true"
                              >
                                {link.label}
                              </a>
                            ) : (
                              <Link
                                to={link.to}
                                className="block px-[18px] py-[8px] font-poppins text-[15px] leading-[18px] font-normal whitespace-nowrap text-cpc-navy-text transition-colors hover:bg-cpc-section-light hover:text-cpc-blue-accent"
                              >
                                {link.label}
                              </Link>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {fluid && (
          <button
            type="button"
            aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            onClick={() => setMobileOpen((previous) => !previous)}
            className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg border border-cpc-input-border text-cpc-navy-text transition-colors hover:bg-cpc-section-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent lg:hidden"
          >
            {mobileOpen ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
          </button>
        )}
      </div>

      {fluid && mobileOpen && (
        <div
          id="mobile-nav"
          className="absolute inset-x-0 top-full z-40 max-h-[70vh] overflow-y-auto border-t border-cpc-input-border bg-white shadow-[0_18px_40px_rgba(27,47,158,0.18)] lg:hidden"
        >
          <nav aria-label="Student portal (mobile)" className="mx-auto max-w-[1440px] px-4 py-3">
            {navItems.map((item) => (
              <div key={item.label} className="border-b border-cpc-input-border/70 py-2 last:border-b-0">
                <p className="font-poppins text-[11px] font-semibold tracking-[0.14em] text-cpc-muted-blue uppercase">
                  {item.label}
                </p>
                <ul className="mt-1.5 space-y-1">
                  {item.links.map((link) =>
                    link.to === "#" ? (
                      <li key={link.label}>
                        <a
                          href="#"
                          aria-disabled="true"
                          className="block rounded px-2 py-1.5 font-poppins text-sm text-cpc-muted-blue"
                        >
                          {link.label}
                        </a>
                      </li>
                    ) : (
                      <li key={link.label}>
                        <Link
                          to={link.to}
                          onClick={() => setMobileOpen(false)}
                          className="block rounded px-2 py-1.5 font-poppins text-sm text-cpc-navy-text transition-colors hover:bg-cpc-section-light hover:text-cpc-blue-accent"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ),
                  )}
                </ul>
              </div>
            ))}
          </nav>
        </div>
      )}
    </div>
  );
}
