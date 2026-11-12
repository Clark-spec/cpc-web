import { ArrowRightIcon } from "@/components/common/display/icons";
import ctaBuilding from "@/assets/cta-building.png";

export function CtaSection() {
  return (
    <section aria-label="Get started" className="w-full bg-white">
      <div className="relative mx-auto flex w-full max-w-[1440px] flex-col items-start gap-[28px] overflow-hidden px-5 py-12 sm:px-8 lg:h-[300px] lg:flex-row lg:items-center lg:justify-between lg:gap-[48px] lg:px-[86px] lg:py-0">
        <div className="font-poppins">
          <p className="text-[11px] leading-[14px] font-bold tracking-[0.12em] text-cpc-navy-text uppercase">
            Get Started
          </p>

          <h2 className="mt-[10px] text-[26px] leading-[34px] font-bold text-cpc-navy-text sm:text-[30px] sm:leading-[38px] lg:text-[34px] lg:leading-[42px]">
            Continue Your Journey
            <br />
            at Cordova Public College
          </h2>

          <p className="mt-[12px] text-[14px] leading-[23px] font-normal text-[#1f2a6b] lg:text-[15px] lg:leading-[24px]">
            Join a community of learners, dreamers, and achievers.
            <br />
            Your future starts here.
          </p>

          {/* TODO: point this at the enrollment route once it exists. */}
          <button
            type="button"
            className="cpc-btn cpc-btn-primary mt-[22px]"
          >
            Enroll Now
            <ArrowRightIcon className="h-[18px] w-[18px]" />
          </button>
        </div>

        <div className="relative h-[200px] w-full shrink-0 sm:h-[240px] lg:h-[236px] lg:w-[520px]">
          <div
            aria-hidden
            className="absolute -top-[16px] -right-[16px] hidden h-[120px] w-[120px] rounded-[18px] border border-cpc-tile-border/60 lg:block"
          />
          <img
            src={ctaBuilding}
            alt="Aerial view of the Cordova Public College campus"
            className="relative h-full w-full rounded-[18px] object-cover shadow-[0_18px_40px_rgba(27,47,158,0.18)]"
          />
        </div>
      </div>
    </section>
  );
}
