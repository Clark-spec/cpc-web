import { BookOpenIcon } from "@/components/common/display/icons";
import programIt from "@/assets/program-it.png";
import programHm from "@/assets/program-hm.png";
import programTeacherEd from "@/assets/program-teacher-ed.png";

type Program = {
  title: string;
  description: string;
  image: string;
  code: string;
};

const programs: Program[] = [
  {
    title: "Information Technology",
    description: "Build a strong foundation for your future.",
    image: programIt,
    code: "BSIT",
  },
  {
    title: "Hospitality Management",
    description: "Build a strong foundation for your future.",
    image: programHm,
    code: "BSHM",
  },
  {
    title: "Secondary and Elementary Education",
    description: "Build a strong foundation for your future.",
    image: programTeacherEd,
    code: "BEED · BSED",
  },
];

export function ProgramsSection() {
  return (
    <section aria-label="Academic programs" className="w-full bg-cpc-section-light">
      <div className="mx-auto w-full max-w-[1440px] px-5 py-12 sm:px-8 lg:px-[86px] lg:py-[72px]">
        <div className="flex flex-col items-start gap-[18px] font-poppins sm:flex-row sm:items-end sm:justify-between lg:gap-[40px]">
          <div>
            <div className="flex items-center gap-[12px]">
              <span aria-hidden className="h-[2px] w-[26px] bg-cpc-blue-accent" />
              <p className="text-[11px] leading-[14px] font-bold tracking-[0.1em] text-cpc-navy-text uppercase">
                Academic Programs
              </p>
            </div>
            <h2 className="mt-[14px] text-[30px] leading-[36px] font-bold text-cpc-heading-soft sm:text-[36px] sm:leading-[42px] lg:text-[40px] lg:leading-[46px]">Programs</h2>
            <p className="mt-[10px] text-[14px] leading-[22px] font-normal text-cpc-navy-text lg:text-[15px]">
              Choose from a wide range of programs designed to help you achieve your goals.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-[8px] rounded-full border border-cpc-tile-border/70 bg-white px-[16px] py-[8px] text-[12px] font-semibold text-cpc-navy-text">
            <BookOpenIcon className="h-[16px] w-[16px] text-cpc-blue-accent" />
            3 Programs Offered
          </div>
        </div>

        <div className="mt-[28px] grid grid-cols-1 gap-[20px] sm:grid-cols-2 lg:mt-[36px] lg:grid-cols-3 lg:gap-[28px]">
          {programs.map((program) => (
            <article
              key={program.title}
              className="group relative h-[340px] overflow-hidden rounded-[18px] bg-cpc-navy-deep shadow-[0_16px_36px_rgba(15,36,104,0.22)] sm:h-[400px]"
            >
              <img
                src={program.image}
                alt={program.title}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              />
              <div
                aria-hidden
                className="absolute inset-0 bg-[linear-gradient(to_top,rgba(15,36,104,0.98)_0%,rgba(15,36,104,0.85)_32%,rgba(15,36,104,0.35)_60%,rgba(15,36,104,0)_82%)]"
              />

              <div className="absolute inset-x-0 bottom-0 p-[24px] font-poppins">
                <h3 className="text-[22px] leading-[28px] font-bold text-white">{program.title}</h3>
                <p className="mt-[8px] max-w-[300px] text-[13px] leading-[20px] font-normal text-white/75">
                  {program.description}
                </p>

                <div className="mt-[14px] flex flex-wrap gap-[8px]">
                  <span className="rounded-full border border-white/25 bg-white/10 px-[12px] py-[5px] text-[11px] leading-[14px] font-semibold text-white backdrop-blur-sm">
                    {program.code}
                  </span>
                  <span className="rounded-full border border-white/25 bg-white/10 px-[12px] py-[5px] text-[11px] leading-[14px] font-semibold text-white backdrop-blur-sm">
                    Undergraduate
                  </span>
                </div>

                {/* TODO: point this at the program page once the route exists. */}
                <button
                  type="button"
                  className="mt-[16px] flex h-[44px] w-full cursor-pointer items-center justify-center rounded-full bg-white font-poppins text-[14px] font-semibold text-cpc-navy-text transition-colors hover:bg-cpc-section-light"
                >
                  View Program
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
