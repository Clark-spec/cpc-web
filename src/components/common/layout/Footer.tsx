import { useState, type FormEvent } from "react";
import { cn } from "@/lib/cn";
import {
  ChevronRightIcon,
  FacebookIcon,
  InstagramIcon,
  LinkedinIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  XIcon,
  YoutubeIcon,
  type IconComponent,
} from "@/components/common/display/icons";
import cpcLogo from "@/assets/cpc-logo.jpg";

type FooterLink = {
  label: string;
  to: string;
};

type FooterLinkWithIcon = FooterLink & {
  icon: IconComponent;
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

const socialLinks: FooterLinkWithIcon[] = [
  { label: "Facebook", to: "#", icon: FacebookIcon },
  { label: "X", to: "#", icon: XIcon },
  { label: "Instagram", to: "#", icon: InstagramIcon },
  { label: "LinkedIn", to: "#", icon: LinkedinIcon },
  { label: "YouTube", to: "#", icon: YoutubeIcon },
];

const NEWSLETTER_BLURB = "Stay updated with the latest news and events from Cordova Public College.";

function SectionHeading({ children, fluid }: { children: string; fluid: boolean }) {
  return (
    <h3
      className={cn(
        "font-poppins text-[13px] leading-[18px] font-semibold tracking-[0.1em] text-white uppercase",
        fluid && "text-sm sm:text-[13px]",
      )}
    >
      {children}
    </h3>
  );
}

function NewsletterForm({ fluid }: { fluid: boolean }) {
  const [email, setEmail] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // TODO: subscribe `email` to the newsletter API once it exists.
  }

  return (
    <form onSubmit={handleSubmit} className="mt-[14px]">
      <label htmlFor="newsletter-email" className="sr-only">
        Email address
      </label>
      <input
        id="newsletter-email"
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="Your email address"
        className={cn(
          "h-[40px] w-full max-w-[300px] rounded-[4px] bg-white px-[12px] font-poppins text-[12px] leading-[12px] text-cpc-navy-text outline-none placeholder:text-[#8e9deb] focus-visible:ring-2 focus-visible:ring-cpc-placeholder focus-visible:ring-offset-2 focus-visible:ring-offset-cpc-navy-top",
          fluid && "sm:text-[13px] lg:text-[12px]",
        )}
      />
      <button
        type="submit"
        className="cpc-btn cpc-btn-primary cpc-btn-sm mt-[10px]"
      >
        Sign up
      </button>
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
      <div className={cn("mx-auto w-full max-w-[1440px]", fluid ? "px-4 sm:px-6 lg:px-[25px]" : "px-4 sm:px-6 lg:px-[86px]")}>
        <div className="flex flex-col items-start gap-[18px] border-b border-white/10 py-[26px] sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-[14px] gap-y-[8px]">
            <span className="flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-full border border-white/25 bg-white/10 p-[2px]">
              <img
                src={cpcLogo}
                alt="Cordova Public College seal"
                className="h-full w-full rounded-full object-cover"
              />
            </span>
            <p
              className={cn(
                "text-[18px] leading-[22px] font-bold text-white uppercase",
                fluid && "text-[16px] sm:text-[18px]",
              )}
            >
              Cordova Public College
            </p>
            <span aria-hidden className="hidden h-[22px] w-px bg-white/20 sm:block" />
            <p className="text-[11px] leading-[14px] font-normal tracking-[0.18em] text-white/60 uppercase">
              Servire Populum
            </p>
          </div>

          <ul className="flex items-center gap-[10px]">
            {socialLinks.map((social) => (
              <li key={social.label}>
                <a
                  href={social.to}
                  aria-label={social.label}
                  className="flex h-[34px] w-[34px] items-center justify-center rounded-full border border-white/15 text-white/70 transition-colors hover:border-white/40 hover:bg-white/10 hover:text-white"
                >
                  <social.icon className="h-[16px] w-[16px]" />
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="grid grid-cols-1 gap-x-[30px] gap-y-[28px] py-[30px] sm:grid-cols-2 lg:grid-cols-[340fr_230fr_300fr_308fr]">
          {linkGroups.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <SectionHeading fluid={fluid}>{group.title}</SectionHeading>
              <ul
                className={cn(
                  "mt-[14px]",
                  group.title === "Quick Links"
                    ? "grid grid-cols-2 gap-x-[16px] gap-y-[7px]"
                    : "space-y-[7px]",
                )}
              >
                {group.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.to}
                      className={cn(
                        "group flex items-center gap-[6px] text-[13px] leading-[20px] font-normal text-white/70 transition-colors hover:text-white",
                        fluid && "py-[1px]",
                      )}
                    >
                      <ChevronRightIcon className="h-[12px] w-[12px] shrink-0 text-white/40 transition-colors group-hover:text-white" />
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <div className="min-w-0">
            <SectionHeading fluid={fluid}>Contact Us</SectionHeading>
            <ul className="mt-[14px] space-y-[12px]">
              {contacts.map((contact) => (
                <li key={contact.text} className="flex items-start gap-[10px]">
                  <contact.icon className="mt-[3px] h-[14px] w-[14px] shrink-0 text-white/50" />
                  <span
                    className={cn(
                      "text-[13px] leading-[20px] font-normal text-white/70",
                      fluid && "break-all text-sm sm:text-[13px]",
                    )}
                  >
                    {contact.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="min-w-0">
            <SectionHeading fluid={fluid}>Newsletter</SectionHeading>
            <p
              className={cn(
                "mt-[14px] max-w-[300px] text-[12px] leading-[18px] font-normal text-white/60",
                fluid && "text-sm sm:text-[12px]",
              )}
            >
              {NEWSLETTER_BLURB}
            </p>
            <NewsletterForm fluid={fluid} />
          </div>
        </div>
      </div>

      <div className="w-full border-t border-white/10">
        <div
          className={cn(
            "mx-auto flex w-full max-w-[1440px] flex-col items-center gap-2 py-[18px] text-center sm:flex-row sm:justify-between sm:text-left",
            fluid ? "px-4 sm:px-6 lg:px-[25px]" : "px-4 sm:px-6 lg:px-[86px]",
          )}
        >
          <p className="text-[12px] leading-[16px] font-normal text-white/60">
            © 2026 Cordova Public College. All rights reserved.
          </p>
          <p className="flex items-center gap-[12px] text-[12px] leading-[16px] font-normal text-white/60">
            {legalLinks.map((link, index) => (
              <span key={link.label} className="flex items-center gap-[12px]">
                {index > 0 && <span aria-hidden className="text-white/30">|</span>}
                <a href={link.to} className="transition-colors hover:text-white hover:underline">
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
