import { useState } from "react";
import { Link } from "react-router";
import { CaretDownIcon } from "@/components/common/icons";
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
      { label: "Online Clearance", to: "#" },
      { label: "Online Kiosk", to: "#" },
      { label: "Service Request", to: "#" },
    ],
  },
  {
    label: "Academics",
    links: [
      { label: "Class Schedules", to: "#" },
      { label: "Academic Calendar", to: "#" },
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
      { label: "Student Profile", to: "#" },
      { label: "Enrollment Status", to: "/online-enrollment/status" },
      { label: "Clearance Status", to: "#" },
      { label: "Violations", to: "#" },
      { label: "Scholarship Status", to: "#" },
    ],
  },
];

export function Navbar() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="h-[120px] w-full bg-white shadow-[0_4px_16px_rgba(27,47,158,0.10)]">
      <div className="mx-auto flex h-full w-full max-w-[1440px] items-center justify-between px-[30px]">
        <Link to="/student/home" className="flex items-center gap-[14px]">
          <img src={cpcLogo} alt="Cordova Public College seal" className="h-[68px] w-[68px] rounded-full object-cover" />
          <div className="font-poppins">
            <p className="text-[22px] leading-[24px] font-bold text-cpc-navy-text">Cordova Public College</p>
            <p className="text-[20px] leading-[24px] font-medium tracking-[0.12em] text-[#2d3fa8]">Servire Populum</p>
          </div>
        </Link>

        <nav aria-label="Student portal">
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
      </div>
    </div>
  );
}
