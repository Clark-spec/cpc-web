import { ArrowRightIcon, GraduationCapIcon } from "@/components/common/icons";
import ctaBuilding from "@/assets/cta-building.png";

export function CtaSection() {
  return (
    <section aria-label="Get started" className="relative h-[248px] w-full overflow-hidden bg-cpc-section-light">
      <div className="relative mx-auto h-full w-full max-w-[1440px]">
        {/* The right edge is slanted: narrower at the top, wider at the bottom. */}
        <img
          src={ctaBuilding}
          alt="Aerial view of the Cordova Public College campus"
          className="absolute top-[18px] left-[16px] h-[220px] w-[656px] object-cover"
          style={{ clipPath: "polygon(0 0, 92% 0, 100% 100%, 0 100%)" }}
        />

        <div className="absolute top-[38px] left-[694px] font-poppins">
          <p className="text-[10px] leading-[14px] font-bold tracking-[0.1em] text-cpc-navy-text uppercase">
            Get Started
          </p>
          <h2 className="mt-[8px] text-[30px] leading-[33px] font-bold text-cpc-navy-text">
            Continue Your Journey
            <br />
            at Cordova Public College
          </h2>
          <p className="mt-[10px] text-[14px] leading-[18px] font-normal text-cpc-navy-text">
            Join a community of learners, dreamers, and achievers.
            <br />
            Your future starts here.
          </p>
          {/* TODO: point this at the enrollment route once it exists. */}
          <button
            type="button"
            className="mt-[16px] flex h-[43px] w-[170px] cursor-pointer items-center justify-between rounded-[2px] bg-cpc-navy-top px-[14px] font-poppins text-[14px] font-semibold text-white transition-colors hover:bg-[#1d3690]"
          >
            Enroll Now
            <ArrowRightIcon className="h-[18px] w-[18px] text-white" />
          </button>
        </div>

        <GraduationCapIcon
          className="absolute top-[38px] left-[1203px] h-[205px] w-[205px] text-cpc-navy-text"
          strokeWidth={3}
        />
      </div>
    </section>
  );
}
