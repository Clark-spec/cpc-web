import {
  AwardIcon,
  BadgeCheckIcon,
  CalendarIcon,
  GraduationCapIcon,
  UsersIcon,
  type IconComponent,
} from "@/components/common/icons";

type BandStat = {
  value: string;
  label: string;
  icon: IconComponent;
};

const bandStats: BandStat[] = [
  { value: "20+", label: "Years of Excellence", icon: CalendarIcon },
  { value: "2000+", label: "Active Students", icon: UsersIcon },
  { value: "100+", label: "Qualified Faculty", icon: GraduationCapIcon },
  { value: "100+", label: "Awards & Recognitions", icon: AwardIcon },
  { value: "95%", label: "Graduate Success Rate", icon: BadgeCheckIcon },
];

export function StatsBand() {
  return (
    <section aria-label="College statistics" className="mt-[31px] h-[125px] w-full bg-cpc-navy-top">
      <div className="mx-auto flex h-full w-full max-w-[1440px] items-center justify-between px-[110px]">
        {bandStats.map((stat) => (
          <div key={stat.label} className="flex items-center gap-[14px]">
            <stat.icon className="h-[38px] w-[38px] text-white" />
            <div className="font-poppins">
              <p className="text-[26px] leading-[28px] font-bold text-white">{stat.value}</p>
              <p className="text-[14px] leading-[16px] font-normal text-[#d7dfff]">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
