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
