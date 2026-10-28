import { GraduationCapIcon, HeartIcon, UsersIcon, type IconComponent } from "@/components/common/icons";
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

export function AboutSection() {
  return (
    <section aria-label="About our college" className="mx-auto mt-[46px] w-full max-w-[1440px] px-[86px]">
      <div className="grid grid-cols-[459fr_455fr_302fr] gap-x-[26px]">
        <div className="font-poppins">
          <p className="text-[11px] leading-[14px] font-bold tracking-[0.08em] text-cpc-navy-text uppercase">
            About Our College
          </p>
          <h2 className="mt-[10px] text-[38px] leading-[31px] font-bold text-cpc-heading-soft">
            Building Better
            <br />
            Futures Together
          </h2>
          <div aria-hidden className="mt-[20px] h-[3px] w-[36px] bg-cpc-blue-accent" />
          <p className="mt-[20px] text-[17px] leading-[17px] font-normal text-[#1f2a6b]">
            Cordova Public College is committed to providing quality education, holistic development, and opportunities
            for a brighter tomorrow.
          </p>
        </div>

        <img
          src={aboutBuilding}
          alt="Cordova Public College building"
          className="mt-[20px] h-[274px] w-full border border-dashed border-cpc-tile-border object-cover"
        />

        <div className="flex flex-col justify-between">
          {aboutStats.map((stat) => (
            <div
              key={stat.label}
              className="flex h-[91px] items-center rounded-[2px] border border-[#dfe6fb] bg-white pl-[35px] shadow-[0_2px_6px_rgba(27,47,158,0.08)]"
            >
              <stat.icon className="h-[40px] w-[40px] text-cpc-navy-text" />
              <div className="ml-[12px] font-poppins">
                <p className="text-[24px] leading-[26px] font-bold text-cpc-navy-text">{stat.value}</p>
                <p className="text-[14px] leading-[16px] font-normal text-[#7f8fb5]">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
