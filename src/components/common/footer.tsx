import { useState, type FormEvent } from "react";
import {
  ArrowRightIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  type IconComponent,
} from "@/components/common/icons";
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
      { label: "Academic Calendar", to: "#" },
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

function NewsletterForm() {
  const [email, setEmail] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // TODO: subscribe `email` to the newsletter API once it exists.
  }

  return (
    <form onSubmit={handleSubmit} className="mt-[10px]">
      <div className="flex h-[37px] w-full max-w-[243px] items-stretch border border-white">
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        <input
          id="newsletter-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Enter your email"
          className="min-w-0 flex-1 bg-white px-[10px] font-poppins text-[11px] leading-[11px] text-cpc-label outline-none placeholder:text-[#8e9deb]"
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

export function Footer() {
  return (
    <footer className="w-full bg-cpc-navy-top font-poppins">
      <div className="mx-auto w-full max-w-[1440px] px-[25px] py-[18px]">
        <div className="grid grid-cols-[373fr_222fr_224fr_311fr_243fr] items-start">
          <div className="flex items-center gap-[12px]">
            <img src={cpcLogo} alt="Cordova Public College seal" className="h-[68px] w-[68px] rounded-full object-cover" />
            <div>
              <p className="text-[19px] leading-[22px] font-bold text-white uppercase">Cordova Public College</p>
              <p className="text-[16px] leading-[20px] font-normal text-white">Servire Populum</p>
            </div>
          </div>

          {linkGroups.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <h3 className="text-[22px] leading-[24px] font-semibold text-white">{group.title}</h3>
              <ul className="mt-[8px] leading-[18px]">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.to} className="text-[16px] font-normal text-white hover:underline">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <div>
            <h3 className="text-[22px] leading-[24px] font-semibold text-white">Contact Us</h3>
            <ul className="mt-[8px] space-y-[4px]">
              {contacts.map((contact) => (
                <li key={contact.text} className="flex items-center gap-[8px]">
                  <contact.icon className="h-[16px] w-[16px] shrink-0 text-white" />
                  <span className="text-[16px] leading-[18px] font-normal text-white">{contact.text}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-[22px] leading-[24px] font-semibold text-white">Newsletter</h3>
            <p className="mt-[8px] text-[16px] leading-[19px] font-normal text-white">{NEWSLETTER_BLURB}</p>
            <NewsletterForm />
          </div>
        </div>
      </div>

      <div className="h-[58px] w-full bg-cpc-navy-deep">
        <div className="mx-auto flex h-full w-full max-w-[1440px] items-center justify-between px-[30px]">
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
