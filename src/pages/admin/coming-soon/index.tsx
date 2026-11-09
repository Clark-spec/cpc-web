import { useLocation } from "react-router";
import { Construction, Sparkles } from "lucide-react";
import { AdminPageHeader } from "@/components/common/AdminPageHeader";
import { getBreadcrumbs, getPageTitle } from "@/lib/navigation";

/**
 * Placeholder for sidebar destinations that are not built yet. It keeps the
 * shell, breadcrumbs and page title intact so navigation never dead-ends.
 */
export default function ComingSoonPage() {
  const { pathname } = useLocation();
  const title = getPageTitle(pathname);

  return (
    <div className="space-y-5">
      <AdminPageHeader
        eyebrow="ADMIN PORTAL"
        title={title}
        subtitle="This workspace is part of the admin portal roadmap and will be available soon."
        breadcrumbItems={getBreadcrumbs(pathname).slice(1)}
      />

      <section className="rounded-2xl border border-cpc-tile-border/70 bg-white px-5 py-12 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-cpc-section-light text-cpc-blue-accent">
          <Construction className="h-7 w-7" aria-hidden />
        </span>
        <h2 className="mt-3 font-poppins text-lg font-semibold text-cpc-navy-text">
          Coming soon
        </h2>
        <p className="mx-auto mt-1 max-w-md font-poppins text-sm leading-relaxed text-cpc-heading-soft">
          We&apos;re building the {title.toLowerCase()} workspace. The dashboard and clearance
          requests are fully functional in this demo.
        </p>

        <div className="mx-auto mt-5 grid max-w-lg gap-2 text-left sm:grid-cols-2">
          {[
            "Role-aware access",
            "Live demo data",
            "Accessible components",
            "Mobile-ready layout",
          ].map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-1.5 rounded-lg border border-cpc-tile-border/60 bg-cpc-section-light/40 px-2.5 py-2 font-poppins text-[11px] font-medium text-cpc-navy-text"
            >
              <Sparkles className="h-3 w-3 shrink-0 text-cpc-blue-accent" aria-hidden />
              {item}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
