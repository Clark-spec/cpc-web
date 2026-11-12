import type { ReactNode } from "react";

export type IconProps = {
  className?: string;
  /** Outline weight in device px; the stroke never scales with the icon size. */
  strokeWidth?: number;
};

export type IconComponent = (props: IconProps) => ReactNode;

function Svg({
  className,
  strokeWidth = 1.5,
  children,
}: IconProps & {
  children: ReactNode;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      vectorEffect="non-scaling-stroke"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      focusable="false"
      className={className}
    >
      {children}
    </svg>
  );
}

export function MapPinIcon({ className, strokeWidth }: IconProps) {
  return (
    <Svg className={className} strokeWidth={strokeWidth}>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </Svg>
  );
}

export function BellIcon({ className, strokeWidth }: IconProps) {
  return (
    <Svg className={className} strokeWidth={strokeWidth}>
      <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2.5 6.5.5.5.2 1.5-.8 1.5H4.3c-1 0-1.3-1-.8-1.5C4 15 6 14 6 9Z" />
      <path d="M9.8 20.5a2.4 2.4 0 0 0 4.4 0" />
    </Svg>
  );
}

/** Solid caret: the navbar chevrons are filled triangles, not outlines. */
export function CaretDownIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 12 8" fill="currentColor" aria-hidden focusable="false" className={className}>
      <path d="M6 8 0 0h12Z" />
    </svg>
  );
}

export function UsersIcon({ className, strokeWidth }: IconProps) {
  return (
    <Svg className={className} strokeWidth={strokeWidth}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </Svg>
  );
}

export function UserIcon({ className, strokeWidth }: IconProps) {
  return (
    <Svg className={className} strokeWidth={strokeWidth}>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </Svg>
  );
}

export function FileTextIcon({ className, strokeWidth }: IconProps) {
  return (
    <Svg className={className} strokeWidth={strokeWidth}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2v6h6" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
      <path d="M10 9H8" />
    </Svg>
  );
}

export function BookOpenIcon({ className, strokeWidth }: IconProps) {
  return (
    <Svg className={className} strokeWidth={strokeWidth}>
      <path d="M12 7v14" />
      <path d="M12 7a4 4 0 0 0-4-4H3a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h6a3 3 0 0 1 3 3 3 3 0 0 1 3-3h6a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1h-5a4 4 0 0 0-4 4Z" />
    </Svg>
  );
}

export function MegaphoneIcon({ className, strokeWidth }: IconProps) {
  return (
    <Svg className={className} strokeWidth={strokeWidth}>
      <path d="m3 11 16-6v14L3 13Z" />
      <path d="M3 11v2a1 1 0 0 0 1 1h1v5a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-5h1" />
      <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
    </Svg>
  );
}

export function GraduationCapIcon({ className, strokeWidth }: IconProps) {
  return (
    <Svg className={className} strokeWidth={strokeWidth}>
      <path d="m22 10-10-5L2 10l10 5Z" />
      <path d="M6 12.5V17c0 1.7 2.7 3 6 3s6-1.3 6-3v-4.5" />
      <path d="M22 10v6" />
    </Svg>
  );
}

export function HeartIcon({ className, strokeWidth }: IconProps) {
  return (
    <Svg className={className} strokeWidth={strokeWidth}>
      <path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5C2 10.8 3.5 12.5 5 14l7 7Z" />
    </Svg>
  );
}

export function CalendarIcon({ className, strokeWidth }: IconProps) {
  return (
    <Svg className={className} strokeWidth={strokeWidth}>
      <rect x="3" y="4.5" width="18" height="17" rx="2" />
      <path d="M8 2.5v4" />
      <path d="M16 2.5v4" />
      <path d="M3 10h18" />
    </Svg>
  );
}

export function AwardIcon({ className, strokeWidth }: IconProps) {
  return (
    <Svg className={className} strokeWidth={strokeWidth}>
      <circle cx="12" cy="8" r="6" />
      <path d="M15.5 13 17 22l-5-3-5 3 1.5-9" />
    </Svg>
  );
}

export function TrophyIcon({ className, strokeWidth }: IconProps) {
  return (
    <Svg className={className} strokeWidth={strokeWidth}>
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </Svg>
  );
}

export function LandmarkIcon({ className, strokeWidth }: IconProps) {
  return (
    <Svg className={className} strokeWidth={strokeWidth}>
      <path d="M3 22h18" />
      <path d="M6 18v-7" />
      <path d="M10 18v-7" />
      <path d="M14 18v-7" />
      <path d="M18 18v-7" />
      <path d="m12 2 8 4H4Z" />
    </Svg>
  );
}

export function BadgeCheckIcon({ className, strokeWidth }: IconProps) {
  return (
    <Svg className={className} strokeWidth={strokeWidth}>
      <path d="M3.9 8.6a4 4 0 0 1 4.7-4.8 4 4 0 0 1 6.8 0 4 4 0 0 1 4.7 4.8 4 4 0 0 1 0 6.8 4 4 0 0 1-4.7 4.7 4 4 0 0 1-6.8 0 4 4 0 0 1-4.7-4.7 4 4 0 0 1 0-6.8Z" />
      <path d="m9 12 2 2 4-4" />
    </Svg>
  );
}

export function PhoneIcon({ className, strokeWidth }: IconProps) {
  return (
    <Svg className={className} strokeWidth={strokeWidth}>
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.4 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z" />
    </Svg>
  );
}

export function MailIcon({ className, strokeWidth }: IconProps) {
  return (
    <Svg className={className} strokeWidth={strokeWidth}>
      <rect x="2" y="4.5" width="20" height="15" rx="2" />
      <path d="m2.5 6 9.5 6 9.5-6" />
    </Svg>
  );
}

export function ArrowRightIcon({ className, strokeWidth }: IconProps) {
  return (
    <Svg className={className} strokeWidth={strokeWidth}>
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </Svg>
  );
}

export function ChevronRightIcon({ className, strokeWidth }: IconProps) {
  return (
    <Svg className={className} strokeWidth={strokeWidth}>
      <path d="m9 18 6-6-6-6" />
    </Svg>
  );
}

export function FacebookIcon({ className, strokeWidth }: IconProps) {
  return (
    <Svg className={className} strokeWidth={strokeWidth}>
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3Z" />
    </Svg>
  );
}

export function XIcon({ className, strokeWidth }: IconProps) {
  return (
    <Svg className={className} strokeWidth={strokeWidth}>
      <path d="m4 4 16 16" />
      <path d="M20 4 4 20" />
    </Svg>
  );
}

export function InstagramIcon({ className, strokeWidth }: IconProps) {
  return (
    <Svg className={className} strokeWidth={strokeWidth}>
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37Z" />
      <path d="M17.5 6.5h.01" />
    </Svg>
  );
}

export function LinkedinIcon({ className, strokeWidth }: IconProps) {
  return (
    <Svg className={className} strokeWidth={strokeWidth}>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6Z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </Svg>
  );
}

export function YoutubeIcon({ className, strokeWidth }: IconProps) {
  return (
    <Svg className={className} strokeWidth={strokeWidth}>
      <path d="M2.5 17a24.1 24.1 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.6 49.6 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.1 24.1 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.6 49.6 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
      <path d="m10 15 5-3-5-3Z" />
    </Svg>
  );
}
