import heroStudent from "@/assets/hero-student.png";

export function HeroSection() {
  return (
    <section
      aria-label="Welcome"
      className="relative h-[479px] w-full overflow-hidden bg-gradient-to-r from-[#f8faff] via-[#e8efff] to-[#dce8ff]"
    >
      {/* Artwork and copy stay anchored to the 1440 design column, so their
          overlap is preserved on wider viewports. */}
      <div className="relative mx-auto h-full w-full max-w-[1440px]">
        {/* The exported artwork already carries the girl, clipboard, ID card, cap,
            seal, dashed arc and the navy bottom-right triangle. */}
        <img
          src={heroStudent}
          alt="Student holding a clipboard beside a graduation cap and a Cordova Public College ID card"
          className="absolute top-0 right-[15px] h-full w-auto"
        />

        {/* Text sits above the artwork so the college name overlaps the cap. */}
        <div className="absolute top-[95px] left-[107px] z-10 font-poppins">
          <p className="text-[22px] leading-[26px] font-bold tracking-[0.35em] text-cpc-blue-accent uppercase">
            Welcome to
          </p>
          <h1 className="mt-[3px]">
            <span className="block text-[46px] leading-[50px] font-bold text-cpc-hero-title">
              Cordova Public College
            </span>
            <span className="block text-[40px] leading-[44px] font-bold text-cpc-blue-accent">Student Portal</span>
          </h1>

          <div aria-hidden className="mt-[40px] h-[3px] w-[72px] bg-cpc-blue-accent" />

          <p className="mt-[36px] text-[19px] leading-[26px] font-normal text-[#4a5a9a]">
            We Teach MINDS. We Touch HEARTS.
            <br />
            We Mold PEOPLE.
          </p>

          <div className="mt-[30px] flex gap-[10px]">
            {/* TODO: point these at the schedule and account routes once they exist. */}
            <button
              type="button"
              className="h-[50px] w-[170px] cursor-pointer rounded-[4px] bg-cpc-button font-poppins text-[18px] font-medium text-white transition-colors hover:bg-[#3e518c]"
            >
              View Schedule
            </button>
            <button
              type="button"
              className="h-[50px] w-[168px] cursor-pointer rounded-[4px] border border-cpc-button bg-transparent font-poppins text-[18px] font-medium text-cpc-button transition-colors hover:bg-cpc-button/10"
            >
              My Account
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
