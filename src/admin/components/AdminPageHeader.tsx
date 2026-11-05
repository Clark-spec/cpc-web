import type { ReactNode } from "react";
import { ChevronRight, House } from "lucide-react";
import { Link } from "react-router";
import { cn } from "@/lib/cn";

export type AdminBreadcrumb = {
  label: string;
  to?: string;
};

export type AdminHeaderVariant = "blue" | "soft" | "navy";

type AdminPageHeaderProps = {
  /** Page title, rendered at 32–36px on desktop. */
  title: string;
  subtitle: string;
  /** Ancillary trail shown above the title. Last item is the current page. */
  breadcrumbItems?: AdminBreadcrumb[];
  /** Light-blue by default; use "navy" for a stronger surface. */
  backgroundVariant?: AdminHeaderVariant;
  /** Small uppercase label above the title, when a page wants one. */
  eyebrow?: string;
  /** Right-hand slot: refresh buttons, scope pills, primary actions. */
  actions?: ReactNode;
  className?: string;
};

const VARIANTS: Record<
  AdminHeaderVariant,
  {
    surface: string;
    title: string;
    subtitle: string;
    crumb: string;
    crumbLink: string;
    crumbCurrent: string;
    eyebrow: string;
    shape: string;
    wave: string;
    divider: string;
  }
> = {
  blue: {
    surface: "border-admin-border/80 bg-admin-header",
    title: "text-admin-primary",
    subtitle: "text-admin-muted",
    crumb: "text-admin-muted",
    crumbLink: "hover:text-admin-primary",
    crumbCurrent: "text-admin-secondary",
    eyebrow: "text-admin-secondary",
    shape: "bg-white/45",
    wave: "text-white/55",
    divider: "border-admin-border/70",
  },
  soft: {
    surface: "border-admin-border/70 bg-admin-page",
    title: "text-admin-primary",
    subtitle: "text-admin-muted",
    crumb: "text-admin-muted",
    crumbLink: "hover:text-admin-primary",
    crumbCurrent: "text-admin-secondary",
    eyebrow: "text-admin-secondary",
    shape: "bg-admin-accent/70",
    wave: "text-white/70",
    divider: "border-admin-border/70",
  },
  navy: {
    surface: "border-white/10 bg-admin-navy",
    title: "text-white",
    subtitle: "text-white/75",
    crumb: "text-white/65",
    crumbLink: "hover:text-white",
    crumbCurrent: "text-white",
    eyebrow: "text-admin-accent",
    shape: "bg-white/10",
    wave: "text-white/10",
    divider: "border-white/15",
  },
};

/**
 * Shared admin page header.
 *
 * It spans the full content column (cancelling the shell's page padding) and
 * carries the CPC light-blue surface with soft wave shapes. Every admin page
 * can pass a title, supporting copy, breadcrumbs and an optional actions slot,
 * so the portal keeps one consistent page-opening pattern.
 */
export function AdminPageHeader({
  title,
  subtitle,
  breadcrumbItems,
  backgroundVariant = "blue",
  eyebrow,
  actions,
  className,
}: AdminPageHeaderProps) {
  const tone = VARIANTS[backgroundVariant];

  return (
    <header
      className={cn(
        "relative isolate -mx-4 -mt-5 overflow-hidden border-b px-4 pt-5 pb-6 sm:-mx-6 sm:-mt-6 sm:px-6 sm:pt-6 sm:pb-7 lg:-mx-8 lg:-mt-6 lg:px-8",
        tone.surface,
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <span
          className={cn(
            "absolute -top-24 -right-16 h-56 w-56 rounded-full blur-2xl",
            tone.shape,
          )}
        />
        <span
          className={cn(
            "absolute top-10 right-40 hidden h-28 w-28 rounded-full blur-xl sm:block",
            tone.shape,
          )}
        />
        <svg
          viewBox="0 0 900 260"
          preserveAspectRatio="none"
          className={cn(
            "absolute inset-y-0 right-0 h-full w-[78%] sm:w-[62%]",
            tone.wave,
          )}
        >
          <path
            d="M120 260 C 220 160 300 210 380 150 C 470 82 520 130 620 70 C 720 12 810 44 900 12 L900 260 Z"
            fill="currentColor"
            opacity="0.45"
          />
          <path
            d="M260 260 C 340 190 430 220 510 162 C 600 96 680 128 760 78 C 830 34 870 42 900 28 L900 260 Z"
            fill="currentColor"
            opacity="0.5"
          />
          <path
            d="M0 232 C 120 196 210 240 330 214 C 460 184 520 232 640 204 C 760 176 828 206 900 190 L900 260 L0 260 Z"
            fill="currentColor"
            opacity="0.42"
          />
        </svg>
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-[1376px] flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          {breadcrumbItems && breadcrumbItems.length > 0 && (
            <nav aria-label="Breadcrumb" className={cn("mb-2", tone.crumb)}>
              <ol className="flex flex-wrap items-center gap-1 font-poppins text-[10.5px] leading-none font-medium">
                <li className="flex items-center">
                  <Link
                    to="/admin/dashboard"
                    aria-label="Admin dashboard"
                    className={cn(
                      "inline-flex items-center rounded transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-info",
                      tone.crumbLink,
                    )}
                  >
                    <House className="h-3 w-3" aria-hidden />
                  </Link>
                </li>
                {breadcrumbItems.map((item, index) => {
                  const last = index === breadcrumbItems.length - 1;
                  return (
                    <li key={`${item.label}-${index}`} className="flex items-center gap-1">
                      <ChevronRight className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
                      {item.to && !last ? (
                        <Link
                          to={item.to}
                          className={cn(
                            "rounded transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-info",
                            tone.crumbLink,
                          )}
                        >
                          {item.label}
                        </Link>
                      ) : (
                        <span
                          aria-current={last ? "page" : undefined}
                          className={cn("font-semibold", last && tone.crumbCurrent)}
                        >
                          {item.label}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ol>
            </nav>
          )}

          {eyebrow && (
            <p
              className={cn(
                "font-poppins text-[10.5px] font-bold tracking-[0.16em] uppercase",
                tone.eyebrow,
              )}
            >
              {eyebrow}
            </p>
          )}

          <h1
            className={cn(
              "mt-1 font-poppins text-[28px] leading-[1.15] font-bold tracking-[-0.02em] sm:text-[34px]",
              tone.title,
            )}
          >
            {title}
          </h1>
          <p
            className={cn(
              "mt-1.5 max-w-2xl font-poppins text-[13px] leading-relaxed sm:text-sm",
              tone.subtitle,
            )}
          >
            {subtitle}
          </p>
        </div>

        {actions && (
          <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
            {actions}
          </div>
        )}
      </div>

      <span className={cn("absolute inset-x-0 bottom-0 border-b", tone.divider)} aria-hidden />
    </header>
  );
}
