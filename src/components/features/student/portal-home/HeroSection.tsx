import heroStudent from "@/assets/hero-student.png";

export function HeroSection() {
  return (
    <section
      aria-label="Welcome"
      className="relative w-full overflow-hidden bg-gradient-to-r from-[#f8faff] via-[#e8efff] to-[#dce8ff] lg:h-[479px]"
    >
      <div className="relative mx-auto w-full max-w-[1440px] lg:h-full">
        {/* Artwork stays at its original rendered size (h-479, no upscaling).
            The container trims only the left decorations that used to sit under
            the headline, and fades its edge into the band. */}
        <div
          className="pointer-events-none absolute inset-y-0 right-0 hidden w-[48%] overflow-hidden lg:block"
          style={{
            WebkitMaskImage:
              "linear-gradient(to right, transparent 0%, black 14%)",
            maskImage: "linear-gradient(to right, transparent 0%, black 14%)",
          }}
        >
          <img
            src={heroStudent}
            alt="Student holding a clipboard beside a graduation cap and a Cordova Public College ID card"
            className="absolute top-0 right-0 h-full w-auto max-w-none"
          />
        </div>

        {/* Copy keeps its own column, so text and artwork can never collide. */}
        <div className="relative z-10 flex flex-col justify-center px-5 py-9 font-poppins sm:px-8 sm:py-11 lg:h-full lg:w-[52%] lg:py-0 lg:pl-[100px] lg:pr-[56px]">
          <p className="text-[13px] leading-[18px] font-bold tracking-[0.3em] text-cpc-blue-accent uppercase sm:text-[15px] lg:text-[16px] lg:leading-[20px]">
            Welcome to
          </p>

          <h1 className="mt-[6px]">
            <span className="block text-[32px] leading-[38px] font-bold text-cpc-hero-title sm:text-[40px] sm:leading-[46px] lg:text-[46px] lg:leading-[52px]">
              Cordova Public College
            </span>
            <span className="block text-[32px] leading-[38px] font-bold text-cpc-blue-accent sm:text-[40px] sm:leading-[46px] lg:text-[46px] lg:leading-[52px]">
              Student Portal
            </span>
          </h1>

          <div aria-hidden className="mt-[16px] h-[3px] w-[64px] bg-cpc-blue-accent lg:mt-[20px]" />

          <p className="mt-[14px] text-[15px] leading-[24px] font-normal text-[#4a5a9a] sm:text-[17px] lg:mt-[18px] lg:text-[18px] lg:leading-[28px]">
            We Teach MINDS. We Touch HEARTS.
            <br />
            We Mold PEOPLE.
          </p>

          <div className="mt-[20px] flex flex-col gap-[12px] sm:flex-row lg:mt-[24px]">
            {/* TODO: point these at the schedule and account routes once they exist. */}
            <button
              type="button"
              className="cpc-btn cpc-btn-primary cpc-btn-lg w-full sm:w-[170px]"
            >
              View Schedule
            </button>
            <button
              type="button"
              className="cpc-btn cpc-btn-secondary cpc-btn-lg w-full sm:w-[168px]"
            >
              My Account
            </button>
          </div>
        </div>

        {/* Small screens get the artwork below the copy instead of beside it. */}
        <div className="w-full lg:hidden">
          <img
            src={heroStudent}
            alt="Student holding a clipboard beside a graduation cap and a Cordova Public College ID card"
            className="h-auto w-full object-contain"
          />
        </div>
      </div>
    </section>
  );
}
