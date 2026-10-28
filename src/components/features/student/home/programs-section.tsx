import programIt from "@/assets/program-it.png";
import programHm from "@/assets/program-hm.png";
import programTeacherEd from "@/assets/program-teacher-ed.png";

type Program = {
  title: string;
  description: string;
  image: string;
  titleClass: string;
};

const programs: Program[] = [
  {
    title: "Information Technology",
    description: "Build a strong foundation for your future.",
    image: programIt,
    titleClass: "text-[18px]",
  },
  {
    title: "Hospitality Management",
    description: "Build a strong foundation for your future.",
    image: programHm,
    titleClass: "text-[18px]",
  },
  {
    title: "Secondary and Elementary Education",
    description: "Build a strong foundation for your future.",
    image: programTeacherEd,
    // Slightly smaller so the longer title stays on one line, as designed.
    titleClass: "text-[16px]",
  },
];

export function ProgramsSection() {
  return (
    <section aria-label="Academic programs" className="mx-auto mt-[69px] w-full max-w-[1440px] px-[86px]">
      <div className="mx-auto w-full max-w-[1118px] text-center font-poppins">
        <p className="text-[11px] leading-[14px] font-bold tracking-[0.08em] text-cpc-navy-text uppercase">
          Academic Programs
        </p>
        <h2 className="mt-[6px] text-[32px] leading-[36px] font-bold text-[#2a3fa0]">Programs</h2>
        <p className="mt-[10px] text-[14px] leading-[18px] font-normal whitespace-nowrap text-cpc-navy-text">
          Choose from a wide range of programs designed to help you achieve your goals.
        </p>
      </div>

      <div className="mx-auto mt-[26px] grid w-full max-w-[1118px] grid-cols-3 gap-[46px]">
        {programs.map((program) => (
          <article
            key={program.title}
            className="h-[329px] overflow-hidden rounded-[2px] border border-[#e3e8f8] bg-white shadow-[0_2px_6px_rgba(27,47,158,0.06)]"
          >
            <img src={program.image} alt={program.title} className="h-[158px] w-full object-cover" />
            <h3 className={`mt-[18px] pr-[8px] pl-[24px] font-poppins leading-[20px] font-semibold text-cpc-label ${program.titleClass}`}>
              {program.title}
            </h3>
            <p className="mt-[10px] max-w-[220px] pr-[24px] pl-[24px] font-poppins text-[15px] leading-[23px] font-normal text-cpc-muted-blue">
              {program.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
