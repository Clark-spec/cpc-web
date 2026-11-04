import { Link } from "react-router";

type BreadcrumbItem = {
  label: string;
  href?: string | null;
};

type PageHeroBannerProps = {
  breadcrumbItems: BreadcrumbItem[];
  eyebrow: string;
  title: string;
  subtitle: string;
  backgroundImage: string;
};

export function PageHeroBanner({
  breadcrumbItems,
  eyebrow,
  title,
  subtitle,
  backgroundImage,
}: PageHeroBannerProps) {
  return (
    <section
      className="page-hero-banner w-full bg-cover bg-center bg-no-repeat relative overflow-hidden"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-[#0B1F4B]/85 via-[#0B1F4B]/70 to-[#0B1F4B]/45" />

      <div className="absolute top-0 left-0 right-0 h-px bg-purple-600" />

      <div className="relative z-10 mx-auto h-full flex flex-col justify-center px-[50px] py-8">
        <nav aria-label="Breadcrumb" className="mb-4">
          <ol className="flex items-center space-x-2 text-sm text-white/90">
            {breadcrumbItems.map((item, index) => (
              <li key={index} className="flex items-center">
                {typeof item.href === "string" ? (
                  <Link
                    to={item.href}
                    className="hover:underline transition-colors"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span aria-current="page">{item.label}</span>
                )}
                {index < breadcrumbItems.length - 1 && (
                  <span className="mx-2">&gt;</span>
                )}
              </li>
            ))}
          </ol>
        </nav>

        <div className="mb-3">
          <div className="inline-block">
            <span className="text-[13px] font-bold uppercase tracking-[0.1em] text-white">
              {eyebrow}
            </span>
            <div className="mt-1 w-10 h-px bg-yellow-400" />
          </div>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-2">
          {title}
        </h1>

        <p className="text-base md:text-lg text-white/90">
          {subtitle}
        </p>
      </div>
    </section>
  );
}