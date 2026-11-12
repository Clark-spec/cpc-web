import {
  BookOpenIcon,
  LandmarkIcon,
  TrophyIcon,
  UsersIcon,
  type IconComponent,
} from "@/components/common/display/icons";

type BandStat = {
  value: string;
  label: string;
  icon: IconComponent;
};

const bandStats: BandStat[] = [
  { value: "5000+", label: "Students Enrolled", icon: UsersIcon },
  { value: "95%+", label: "Success Rate", icon: TrophyIcon },
  { value: "50+", label: "Expert Faculty", icon: BookOpenIcon },
  { value: "20+", label: "Centers Across City", icon: LandmarkIcon },
];

export function StatsBand() {
  return (
    <section aria-label="College statistics" className="w-full bg-cpc-navy-top">
      <div className="mx-auto grid w-full max-w-[1440px] grid-cols-2 gap-x-4 gap-y-6 px-5 py-6 sm:px-8 lg:flex lg:h-[104px] lg:items-center lg:gap-0 lg:px-[54px] lg:py-0">
        {bandStats.map((stat, index) => (
          <div
            key={stat.label}
            className="relative flex flex-1 items-center justify-center gap-[10px] lg:gap-[16px]"
          >
            <stat.icon className="h-[32px] w-[32px] shrink-0 text-white lg:h-[40px] lg:w-[40px]" />
            <div className="font-poppins">
              <p className="text-[20px] leading-[24px] font-bold text-white lg:text-[26px] lg:leading-[28px]">
                {stat.value}
              </p>
              <p className="text-[11px] leading-[14px] font-normal text-white/80 lg:text-[13px] lg:leading-[16px]">
                {stat.label}
              </p>
            </div>
            {index < bandStats.length - 1 && (
              <span
                aria-hidden
                className="absolute top-[26px] right-0 bottom-[26px] hidden w-px bg-white/20 lg:block"
              />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
