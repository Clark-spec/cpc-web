import { useState, type FormEvent } from "react";
import { cn } from "@/lib/cn";
import {
  ArrowRightIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  type IconComponent,
} from "@/components/ui/student/icons";
import cpcLogo from "@/assets/cpc-logo.jpg";

type FooterLink = {
  label: string;
  to: string;
};

type LinkGroup = {
  title: string;
  links: FooterLink[];
};

const linkGroups: LinkGroup[] = [
  {
    title: "Quick Links",
    links: [
      { label: "Enrollment", to: "#" },
      { label: "Student Services", to: "#" },
      { label: "Academics", to: "#" },
      { label: "Student Support", to: "#" },
      { label: "News & Information", to: "#" },
      { label: "My Account", to: "#" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Student Handbook", to: "#" },
      { label: "Academic Calendar", to: "/academics/academic-calendar" },
      { label: "Library", to: "#" },
      { label: "FAQs", to: "#" },
      { label: "Support", to: "#" },
    ],
  },
];

type Contact = {
  text: string;
  icon: IconComponent;
};

const contacts: Contact[] = [
  { text: "Cordova, Cebu, Philippines", icon: MapPinIcon },
  { text: "(032) 487-xxxx", icon: PhoneIcon },
  { text: "info@cordovapubliccollege.edu.ph", icon: MailIcon },
];

const legalLinks: FooterLink[] = [
  { label: "Privacy Policy", to: "#" },
  { label: "Terms of Service", to: "#" },
];

const NEWSLETTER_BLURB = "Stay updated with the latest news and events from Cordova Public College.";

function NewsletterForm({ fluid }: { fluid: boolean }) {
  const [email, setEmail] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // TODO: subscribe `email` to the newsletter API once it exists.
  }

  return (
    <form onSubmit={handleSubmit} className="mt-[10px]">
      <div
        className={cn(
          "flex h-[37px] items-stretch border border-white",
          fluid ? "w-full max-w-[280px] lg:max-w-[243px]" : "w-full max-w-[243px]",
        )}
      >
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        <input
          id="newsletter-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Enter your email"
          className={cn(
            "min-w-0 flex-1 bg-white px-[10px] font-poppins text-[11px] leading-[11px] text-cpc-label outline-none placeholder:text-[#8e9deb]",
            fluid && "sm:text-[13px] lg:text-[11px]",
          )}
        />
        <button
          type="submit"
          aria-label="Subscribe"
          className="flex w-[33px] shrink-0 cursor-pointer items-center justify-center border border-white bg-cpc-navy-top transition-colors hover:bg-[#1d3690]"
        >
          <ArrowRightIcon className="h-[16px] w-[16px] text-white" />
        </button>
      </div>
    </form>
  );
}

type FooterProps = {
  /**
   * Reflow the footer at small widths instead of keeping the 1440px design
   * frame. The Home page scales its whole frame with `zoom`, so it keeps the
   * original layout; the clearance page is truly responsive and opts in.
   */
  fluid?: boolean;
};

export function Footer({ fluid = false }: FooterProps) {
  return (
    <footer className="w-full bg-cpc-navy-top font-poppins">
      <div
        className={cn(
          "mx-auto w-full max-w-[1440px]",
          fluid ? "px-4 py-6 sm:px-6 sm:py-8 lg:px-[25px] lg:py-[18px]" : "px-[25px] py-[18px]",
        )}
      >
        <div
          className={cn(
            "items-start",
            fluid
              ? "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-[373fr_222fr_224fr_311fr_243fr] lg:gap-0"
              : "grid grid-cols-[373fr_222fr_224fr_311fr_243fr]",
          )}
        >
          <div className="flex items-center gap-[12px]">
            <img
              src={cpcLogo}
              alt="Cordova Public College seal"
              className="h-[68px] w-[68px] rounded-full object-cover"
            />
            <div className="min-w-0">
              <p
                className={cn(
                  "text-[19px] leading-[22px] font-bold text-white uppercase",
                  fluid && "text-[17px] sm:text-[19px]",
                )}
              >
                Cordova Public College
              </p>
              <p className="text-[16px] leading-[20px] font-normal text-white">Servire Populum</p>
            </div>
          </div>

          {linkGroups.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <h3
                className={cn(
                  "text-[22px] leading-[24px] font-semibold text-white",
                  fluid && "text-lg sm:text-[22px]",
                )}
              >
                {group.title}
              </h3>
              <ul className="mt-[8px] leading-[18px]">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.to}
                      className={cn(
                        "text-[16px] font-normal text-white hover:underline",
                        fluid && "inline-block py-0.5 text-sm sm:text-[16px]",
                      )}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <div className="min-w-0">
            <h3
              className={cn(
                "text-[22px] leading-[24px] font-semibold text-white",
                fluid && "text-lg sm:text-[22px]",
              )}
            >
              Contact Us
            </h3>
            <ul className="mt-[8px] space-y-[4px]">
              {contacts.map((contact) => (
                <li key={contact.text} className="flex items-center gap-[8px]">
                  <contact.icon className="h-[16px] w-[16px] shrink-0 text-white" />
                  <span
                    className={cn(
                      "text-[16px] leading-[18px] font-normal text-white",
                      fluid && "text-sm break-all sm:text-[16px]",
                    )}
                  >
                    {contact.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3
              className={cn(
                "text-[22px] leading-[24px] font-semibold text-white",
                fluid && "text-lg sm:text-[22px]",
              )}
            >
              Newsletter
            </h3>
            <p
              className={cn(
                "mt-[8px] text-[16px] leading-[19px] font-normal text-white",
                fluid && "text-sm sm:text-[16px]",
              )}
            >
              {NEWSLETTER_BLURB}
            </p>
            <NewsletterForm fluid={fluid} />
          </div>
        </div>
      </div>

      <div className={cn("w-full bg-cpc-navy-deep", fluid ? "py-3 lg:h-[58px] lg:py-0" : "h-[58px]")}>
        <div
          className={cn(
            "mx-auto flex h-full w-full max-w-[1440px] items-center justify-between px-[30px]",
            fluid && "flex-col gap-2 px-4 text-center sm:flex-row sm:px-6 sm:text-left lg:px-[30px]",
          )}
        >
          <p className="text-[13px] leading-[13px] font-normal text-white">
            © 2026 Cordova Public College. All rights reserved.
          </p>
          <p className="flex items-center gap-[8px] text-[13px] leading-[13px] font-normal text-white">
            {legalLinks.map((link, index) => (
              <span key={link.label} className="flex items-center gap-[8px]">
                {index > 0 && <span aria-hidden>|</span>}
                <a href={link.to} className="hover:underline">
                  {link.label}
                </a>
              </span>
            ))}
          </p>
        </div>
      </div>
    </footer>
  );
}
