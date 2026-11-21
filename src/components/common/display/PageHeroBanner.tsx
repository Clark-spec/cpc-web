import { useEffect, useState } from "react";
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
  /** Optional frosted chips under the description (e.g. clearance). */
  chips?: readonly string[];
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
  chips,
}: PageHeroBannerProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => setReady(true));
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, []);

  const reveal = (delay: number, extra = "") => ({
    className: `${extra} transition-[opacity,translate] duration-500 ease-out motion-reduce:transition-none ${
      ready
        ? "translate-y-0 opacity-100"
        : "translate-y-2 opacity-0 motion-reduce:translate-y-0 motion-reduce:opacity-100"
    }`,
    style: { transitionDelay: ready ? `${delay}ms` : "0ms" },
  });

  return (
    <section className="relative w-full overflow-hidden bg-cpc-navy-deep">
      <img
        src={backgroundImage}
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover object-[72%_center] md:object-[78%_center]"
      />

      {/* L→R navy wash: calm text area on the left, vivid photo on the right. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,36,104,0.95)_0%,rgba(15,36,104,0.85)_45%,rgba(15,36,104,0.35)_75%,rgba(15,36,104,0.15)_100%)] max-md:bg-[linear-gradient(to_right,rgba(15,36,104,0.85)_0%,rgba(15,36,104,0.85)_100%)]"
      />
      {/* Soft bottom→top depth. */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-[45%] bg-[linear-gradient(to_top,rgba(15,36,104,0.45)_0%,transparent_100%)]"
      />
      {/* Soft fade into content below. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-7 bg-[linear-gradient(to_bottom,transparent,rgba(244,247,252,0.55))] sm:h-8"
      />

      <div className="relative z-10 mx-auto flex min-h-[260px] w-full max-w-[var(--cpc-shell-max-width)] flex-col justify-center px-[var(--cpc-shell-gutter)] py-10 sm:min-h-[300px] lg:py-14">
        <nav aria-label="Breadcrumb" className="w-fit">
          <ol className="inline-flex flex-wrap items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs text-white/75 backdrop-blur-[8px] sm:text-sm">
            {breadcrumbItems.map((item, index) => {
              const isLast = index === breadcrumbItems.length - 1;
              return (
                <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
                  {typeof item.href === "string" ? (
                    <Link
                      to={item.href}
                      className="transition-colors hover:text-white hover:underline"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <span
                      className={isLast ? "font-bold text-white" : undefined}
                      aria-current={isLast ? "page" : undefined}
                    >
                      {item.label}
                    </span>
                  )}
                  {!isLast && (
                    <ChevronRight className="h-3.5 w-3.5 text-white/60" aria-hidden />
                  )}
                </li>
              );
            })}
          </ol>
        </nav>

        <div {...reveal(0, "mt-5 max-w-[min(100%,36rem)] md:max-w-[52%]")}>
          <div className="mb-3 h-[3px] w-10 rounded-full bg-cpc-blue-accent" />
          <span className="font-poppins text-[12px] font-bold tracking-[0.2em] text-cpc-muted-blue uppercase sm:text-[13px]">
            {eyebrow}
          </span>
        </div>

        <h1
          {...reveal(
            100,
            "mt-3 max-w-[min(100%,36rem)] font-poppins text-[clamp(2.25rem,5vw,4rem)] leading-[1.05] font-extrabold tracking-[-0.01em] text-white [text-shadow:0_2px_16px_rgba(0,0,0,0.25)] md:max-w-[52%]",
          )}
        >
          {title}
        </h1>

        <p
          {...reveal(
            200,
            "mt-4 max-w-[52ch] font-poppins text-sm leading-[1.6] text-white/85 text-balance sm:text-base",
          )}
        >
          {subtitle}
        </p>

        {chips && chips.length > 0 ? (
          <ul
            {...reveal(
              300,
              "mt-5 flex max-w-[min(100%,36rem)] flex-wrap gap-2 md:max-w-[52%]",
            )}
          >
            {chips.map((label) => (
              <li
                key={label}
                className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 font-poppins text-[11px] font-medium text-white/90 backdrop-blur-[8px] sm:text-xs"
              >
                {label}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
