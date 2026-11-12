import {
  BadgeCheckIcon,
  GraduationCapIcon,
  HeartIcon,
  UsersIcon,
  type IconComponent,
} from "@/components/common/display/icons";
import aboutBuilding from "@/assets/about-building.png";

type AboutStat = {
  value: string;
  label: string;
  icon: IconComponent;
};

const aboutStats: AboutStat[] = [
  { value: "4+", label: "Academic Programs", icon: GraduationCapIcon },
  { value: "2,500+", label: "Enrolled Students", icon: HeartIcon },
  { value: "100+", label: "Faculty & Staff", icon: UsersIcon },
];

const highlights = ["Quality education", "Holistic development", "Opportunities to grow"];

export function AboutSection() {
  return (
    <section aria-label="About our college" className="w-full bg-white">
      <div className="mx-auto grid w-full max-w-[1440px] grid-cols-1 items-center gap-[40px] px-5 pt-12 pb-14 sm:px-8 lg:grid-cols-[1fr_600px] lg:gap-[76px] lg:px-[86px] lg:pt-[72px] lg:pb-[110px]">
        <div className="font-poppins">
          <div className="flex items-center gap-[12px]">
            <span aria-hidden className="h-[2px] w-[26px] bg-cpc-blue-accent" />
            <p className="text-[11px] leading-[14px] font-bold tracking-[0.1em] text-cpc-navy-text uppercase">
              About Our College
            </p>
          </div>

          <h2 className="mt-[16px] text-[30px] leading-[38px] font-bold text-cpc-heading-soft sm:text-[36px] sm:leading-[44px] lg:text-[42px] lg:leading-[50px]">
            Building Better
            <br />
            Futures Together
          </h2>

          <p className="mt-[18px] max-w-[520px] text-[15px] leading-[26px] font-normal text-[#1f2a6b] sm:text-[16px] lg:text-[17px] lg:leading-[28px]">
            Cordova Public College is committed to providing quality education, holistic development, and opportunities
            for a brighter tomorrow.
          </p>

          <ul className="mt-[26px] flex flex-wrap gap-x-[24px] gap-y-[12px]">
            {highlights.map((highlight) => (
              <li
                key={highlight}
                className="flex items-center gap-[10px] text-[14px] leading-[18px] font-medium text-cpc-navy-text"
              >
                <span className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-cpc-section-light">
                  <BadgeCheckIcon className="h-[16px] w-[16px] text-cpc-blue-accent" strokeWidth={2} />
                </span>
                {highlight}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative">
          <div
            aria-hidden
            className="absolute -top-[18px] -right-[18px] hidden h-[180px] w-[180px] rounded-[24px] bg-cpc-section-light lg:block"
          />
          <img
            src={aboutBuilding}
            alt="Cordova Public College building"
            className="relative h-[260px] w-full rounded-[18px] object-cover shadow-[0_22px_50px_rgba(15,36,104,0.2)] sm:h-[320px] lg:h-[352px]"
          />

          <div className="mt-[16px] grid w-full grid-cols-3 divide-x divide-cpc-tile-border/50 rounded-[14px] border border-cpc-tile-border/50 bg-white px-[8px] py-[18px] shadow-[0_16px_36px_rgba(15,36,104,0.18)] lg:absolute lg:-bottom-[30px] lg:left-[26px] lg:mt-0 lg:w-[calc(100%-52px)]">
            {aboutStats.map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col items-center justify-center gap-[6px] px-[6px] text-center sm:flex-row sm:gap-[10px] sm:text-left"
              >
                <stat.icon className="h-[24px] w-[24px] shrink-0 text-cpc-navy-text sm:h-[28px] sm:w-[28px]" />
                <div className="font-poppins">
                  <p className="text-[18px] leading-[22px] font-bold text-cpc-navy-text sm:text-[22px] sm:leading-[24px]">{stat.value}</p>
                  <p className="text-[10px] leading-[13px] font-normal text-cpc-muted-blue sm:text-[11px] sm:leading-[14px]">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
