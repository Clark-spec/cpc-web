import { ChevronRight } from "lucide-react";
import { Link, useLocation } from "react-router";
import { getBreadcrumbs } from "@/lib/navigation";

/** "Admin / Student Services / Clearance Requests" trail for the top bar. */
export function Breadcrumbs() {
  const { pathname } = useLocation();
  const items = getBreadcrumbs(pathname);

  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex min-w-0 flex-wrap items-center gap-1.5 font-poppins text-xs text-cpc-heading-soft sm:text-sm">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex min-w-0 items-center gap-1.5">
              {item.to && !isLast ? (
                <Link
                  to={item.to}
                  className="max-w-[9rem] truncate transition-colors hover:text-cpc-blue-accent hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent md:max-w-none"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={isLast ? "page" : undefined}
                  className={
                    isLast
                      ? "max-w-[11rem] truncate font-semibold text-cpc-navy-text md:max-w-none"
                      : "max-w-[9rem] truncate"
                  }
                >
                  {item.label}
                </span>
              )}
              {!isLast && (
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-cpc-muted-blue" aria-hidden />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
