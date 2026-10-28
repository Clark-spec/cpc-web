import { useState, type SubmitEvent } from "react";
import { Link, useNavigate } from "react-router";
import { useAuthLayoutMode } from "@/components/features/auth/auth-layout-mode";
import cpcLogo from "@/assets/cpc-logo.jpg";

export type LoginRole = "student" | "staff";

type FooterLink = {
  label: string;
  to: string;
};

type LoginFormProps = {
  role: LoginRole;
  title: string;
  idLabel: string;
  idPlaceholder: string;
  footerLinks: FooterLink[];
  /** Where a successful sign-in lands. Omitted until the role has a home page. */
  redirectTo?: string;
};

type Credentials = {
  id: string;
  password: string;
};

function useLoginForm(redirectTo?: string) {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState<Credentials>({ id: "", password: "" });

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    // TODO: send `credentials` to the real Cordova Public College login API for
    // this role, then navigate to the role's home page on success.
    if (redirectTo) {
      navigate(redirectTo);
    }
  }

  return { credentials, setCredentials, handleSubmit };
}

function IdBadgeIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="2.5" y="4.5" width="19" height="15" rx="2.5" />
      <circle cx="8.6" cy="10.6" r="2" />
      <path d="M5.8 16.4c.6-1.8 1.6-2.7 2.8-2.7s2.2.9 2.8 2.7" />
      <path d="M14.6 9.5h4M14.6 12.5h4M14.6 15.5h2.6" />
    </svg>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="4.5" y="10" width="15" height="10" rx="2.5" />
      <path d="M8 10V7.5a4 4 0 0 1 8 0V10" />
      <circle cx="12" cy="14.6" r="1.1" fill="currentColor" stroke="none" />
      <path d="M12 15.6v2" />
    </svg>
  );
}

function FooterLinks({ footerLinks }: { footerLinks: FooterLink[] }) {
  return (
    <>
      Log in as{" "}
      {footerLinks.map((link, index) => (
        <span key={link.to}>
          {index > 0 && " or "}
          <Link to={link.to} className="font-bold text-cpc-button underline underline-offset-2">
            {link.label}
          </Link>
        </span>
      ))}
    </>
  );
}

export function LoginForm(props: LoginFormProps) {
  const mode = useAuthLayoutMode();
  const form = useLoginForm(props.redirectTo);

  if (mode === "mobile") {
    return <MobileLoginForm {...props} {...form} />;
  }
  return <DesktopLoginForm {...props} {...form} />;
}

type FormInternals = ReturnType<typeof useLoginForm>;

/** Pixel-faithful Figma geometry: fixed design px sized for the 559x791 card,
 *  uniformly scaled by the layout's card wrapper. */
function DesktopLoginForm({
  role,
  title,
  idLabel,
  idPlaceholder,
  footerLinks,
  credentials,
  setCredentials,
  handleSubmit,
}: LoginFormProps & FormInternals) {
  const iconClass = "pointer-events-none absolute top-1/2 left-[17px] h-[28px] w-[28px] -translate-y-1/2 text-cpc-icon";
  const inputClass =
    "h-[70px] w-full rounded-[22px] border-2 border-cpc-input-border bg-white pr-[16px] pl-[56px] font-poppins text-[16px] text-cpc-label outline-none placeholder:text-cpc-placeholder focus:border-cpc-icon focus:ring-2 focus:ring-cpc-icon/30";
  const labelClass = "font-poppins text-[16px] leading-[1.3] font-semibold text-cpc-label";

  return (
    <div className="flex h-full w-full flex-col items-center pt-[25px]">
      <img
        src={cpcLogo}
        alt="Cordova Public College seal"
        className="aspect-square h-[174px] rounded-full object-cover shadow-[0_6px_24px_rgba(8,45,121,0.25)]"
      />

      <h1 className="mt-[18px] text-center font-poppins text-[40px] leading-tight font-semibold text-cpc-title">
        {title}
      </h1>

      <form onSubmit={handleSubmit} className="mt-[9px] flex w-[67%] flex-col">
        <label htmlFor={`${role}-id`} className={labelClass}>
          {idLabel}
        </label>
        <div className="relative mt-[3px]">
          <IdBadgeIcon className={iconClass} />
          <input
            id={`${role}-id`}
            type="text"
            autoComplete="username"
            required
            placeholder={idPlaceholder}
            value={credentials.id}
            onChange={(event) => setCredentials({ ...credentials, id: event.target.value })}
            className={inputClass}
          />
        </div>

        <label htmlFor={`${role}-password`} className={`mt-[24px] ${labelClass}`}>
          Password
        </label>
        <div className="relative mt-[3px]">
          <LockIcon className={iconClass} />
          <input
            id={`${role}-password`}
            type="password"
            autoComplete="current-password"
            required
            placeholder="Enter your password"
            value={credentials.password}
            onChange={(event) => setCredentials({ ...credentials, password: event.target.value })}
            className={inputClass}
          />
        </div>

        <button
          type="submit"
          className="mt-[46px] h-[62px] w-[85%] cursor-pointer self-center rounded-[11px] bg-cpc-button font-poppins text-[16px] font-bold text-white transition-colors hover:bg-[#3e518c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-icon"
        >
          Sign in
        </button>
      </form>

      <p className="mt-[18px] text-center font-poppins text-[16px] leading-[1.3] text-cpc-button">
        <FooterLinks footerLinks={footerLinks} />
      </p>
    </div>
  );
}

/** Fluid variant for phones and portrait windows: rem-based sizing, 16px input
 *  text (prevents iOS focus zoom), 52px touch targets, full-width button. */
function MobileLoginForm({
  role,
  title,
  idLabel,
  idPlaceholder,
  footerLinks,
  credentials,
  setCredentials,
  handleSubmit,
}: LoginFormProps & FormInternals) {
  const iconClass = "pointer-events-none absolute top-1/2 left-4 h-[22px] w-[22px] -translate-y-1/2 text-cpc-icon";
  const inputClass =
    "h-[52px] w-full rounded-2xl border border-cpc-input-border bg-white pr-4 pl-12 font-poppins text-base text-cpc-label shadow-[inset_0_1px_4px_rgba(75,91,163,0.08),0_2px_10px_rgba(75,91,163,0.10)] outline-none placeholder:text-cpc-placeholder focus:border-cpc-icon focus:ring-2 focus:ring-cpc-icon/30";
  const labelClass = "font-poppins text-[15px] leading-[1.3] font-semibold text-cpc-label";

  return (
    <div className="flex w-full flex-col items-center px-6 pt-8 pb-7">
      <img
        src={cpcLogo}
        alt="Cordova Public College seal"
        className="h-20 w-20 rounded-full object-cover shadow-[0_6px_24px_rgba(8,45,121,0.25)]"
      />

      <h1 className="mt-3 text-center font-poppins text-[26px] leading-tight font-semibold text-cpc-title">
        {title}
      </h1>

      <form onSubmit={handleSubmit} className="mt-6 flex w-full flex-col">
        <label htmlFor={`${role}-id`} className={labelClass}>
          {idLabel}
        </label>
        <div className="relative mt-2">
          <IdBadgeIcon className={iconClass} />
          <input
            id={`${role}-id`}
            type="text"
            autoComplete="username"
            required
            placeholder={idPlaceholder}
            value={credentials.id}
            onChange={(event) => setCredentials({ ...credentials, id: event.target.value })}
            className={inputClass}
          />
        </div>

        <label htmlFor={`${role}-password`} className={`mt-5 ${labelClass}`}>
          Password
        </label>
        <div className="relative mt-2">
          <LockIcon className={iconClass} />
          <input
            id={`${role}-password`}
            type="password"
            autoComplete="current-password"
            required
            placeholder="Enter your password"
            value={credentials.password}
            onChange={(event) => setCredentials({ ...credentials, password: event.target.value })}
            className={inputClass}
          />
        </div>

        <button
          type="submit"
          className="mt-8 h-[52px] w-full cursor-pointer rounded-xl bg-cpc-button font-poppins text-base font-bold text-white transition-colors hover:bg-[#3e518c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-icon"
        >
          Sign in
        </button>
      </form>

      <p className="mt-5 mb-1 text-center font-poppins text-[15px] leading-[1.3] text-cpc-button">
        <FooterLinks footerLinks={footerLinks} />
      </p>
    </div>
  );
}
