import { ChevronRight } from "lucide-react";
import { Link } from "react-router";

export type HeroBreadcrumb = {
  label: string;
  href?: string | null;
};

type PageHeroBannerProps = {
  breadcrumbItems: HeroBreadcrumb[];
  eyebrow: string;
  title: string;
  subtitle: string;
  backgroundImage: string;
};

/**
 * Full-bleed page hero used by the inner student pages. The artwork is
 * supplied by the page, while the navy wash, breadcrumb, eyebrow, H1 and
 * subtitle stay identical across the portal.
 */
export function PageHeroBanner({
  breadcrumbItems,
  eyebrow,
  title,
  subtitle,
  backgroundImage,
}: PageHeroBannerProps) {
  return (
    <section
      className="relative w-full overflow-hidden bg-cpc-navy-deep bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-cpc-navy-deep/95 via-cpc-navy/85 to-cpc-navy/55" />

      <div className="relative z-10 mx-auto flex min-h-[260px] w-full max-w-[1440px] flex-col justify-center px-4 py-10 sm:min-h-[310px] sm:px-6 lg:px-[50px]">
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1.5 text-xs text-white/80 sm:text-sm">
            {breadcrumbItems.map((item, index) => {
              const isLast = index === breadcrumbItems.length - 1;
              return (
                <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
                  {typeof item.href === "string" ? (
                    <Link to={item.href} className="transition-colors hover:text-white hover:underline">
                      {item.label}
                    </Link>
                  ) : (
                    <span
                      className={isLast ? "font-medium text-white" : undefined}
                      aria-current={isLast ? "page" : undefined}
                    >
                      {item.label}
                    </span>
                  )}
                  {!isLast && <ChevronRight className="h-3.5 w-3.5 text-white/60" aria-hidden />}
                </li>
              );
            })}
          </ol>
        </nav>

        <div className="mt-5">
          <span className="font-poppins text-[12px] font-bold tracking-[0.14em] text-white uppercase sm:text-[13px]">
            {eyebrow}
          </span>
          <div className="mt-1.5 h-0.5 w-10 bg-cpc-blue-accent" />
        </div>

        <h1 className="mt-3 font-poppins text-3xl leading-tight font-bold text-white sm:text-4xl lg:text-5xl">
          {title}
        </h1>

        <p className="mt-2 max-w-2xl font-poppins text-sm leading-relaxed text-white/85 sm:text-base lg:text-lg">
          {subtitle}
        </p>
      </div>
    </section>
  );
}
