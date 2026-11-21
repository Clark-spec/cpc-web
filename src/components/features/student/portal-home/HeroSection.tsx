import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import campusEntrance from "@/assets/cpc-hero-new.webp";

export function HeroSection() {
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => setReady(true));
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, []);

  const reveal = (delay: number, extra = "") => ({
    className: `${extra} transition-[opacity,translate] duration-700 ease-out motion-reduce:transition-none ${
      ready
        ? "translate-y-0 opacity-100"
        : "translate-y-3 opacity-0 motion-reduce:translate-y-0 motion-reduce:opacity-100"
    }`,
    style: { transitionDelay: ready ? `${delay}ms` : "0ms" },
  });

  return (
    <section
      aria-label="Welcome"
      className="relative isolate h-[max(560px,calc(100vh-7.875rem))] w-full overflow-hidden bg-[#e8efff] font-poppins"
    >
      {/* Full-bleed campus photo — edge to edge, no card. */}
      <img
        src={campusEntrance}
        alt="Cordova Public College campus entrance"
        width={1600}
        height={900}
        loading="eager"
        fetchPriority="high"
        className="absolute inset-0 z-0 h-full w-full object-cover object-[center_22%]"
      />

      {/* Light haze — covers the photo signboard text; canopy/gate stay clear below. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-[70%] bg-[linear-gradient(to_bottom,rgba(232,239,255,0.95)_0%,rgba(232,239,255,0.92)_26%,rgba(232,239,255,0.82)_40%,rgba(232,239,255,0.45)_52%,rgba(232,239,255,0.12)_62%,transparent_72%)]"
      />

      {/* Bottom navy scrim for tagline + actions. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-[48%] bg-[linear-gradient(to_bottom,transparent_0%,rgba(15,36,104,0.55)_55%,rgba(15,36,104,0.88)_100%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-[36%] bg-[radial-gradient(58%_100%_at_50%_100%,rgba(15,36,104,0.45)_0%,transparent_72%)]"
      />

      {/* Labels + heading (Poppins — same as site header brand). */}
      <div className="absolute inset-x-0 top-0 z-[2] mx-auto flex w-full max-w-[1200px] flex-col items-center px-4 pt-5 text-center sm:px-8 sm:pt-6 lg:pt-7">
        <div
          {...reveal(
            0,
            "flex flex-wrap items-center justify-center gap-x-3 gap-y-1",
          )}
        >
          <p className="text-[11px] leading-5 font-bold tracking-[0.3em] text-cpc-blue-accent uppercase sm:text-[12px] lg:text-[13px]">
            Welcome to
          </p>
          <p className="text-[10px] leading-5 font-semibold tracking-[0.35em] text-cpc-blue-accent uppercase sm:text-[11px] lg:text-[12px]">
            Student Portal
          </p>
        </div>

        <h1
          {...reveal(
            90,
            "mt-2 w-[min(95%,100%)] font-poppins text-[clamp(2.5rem,6.5vw,5.5rem)] leading-[1.05] font-extrabold tracking-[-0.01em] text-balance text-cpc-navy-text [text-shadow:0_0_24px_rgba(232,239,255,0.95)] max-md:max-w-[12ch] md:mt-3 md:whitespace-nowrap",
          )}
        >
          Cordova Public College
        </h1>
      </div>

      {/* Bottom: single-line tagline + paired actions (no divider). */}
      <div className="absolute inset-x-0 bottom-0 z-[2] mx-auto w-full max-w-[1120px] px-5 pb-7 text-center sm:px-8 sm:pb-8 lg:pb-9">
        <p
          {...reveal(
            180,
            "text-[12px] leading-5 font-light text-white/95 [text-shadow:0_1px_12px_rgba(6,20,60,0.55)] sm:text-[13px] sm:leading-6 lg:text-[15px]",
          )}
        >
          We Teach MINDS. We Touch HEARTS. We Mold PEOPLE.
        </p>

        <div
          {...reveal(
            270,
            "mt-4 flex flex-col items-stretch justify-center gap-3 sm:mt-5 sm:flex-row sm:items-center lg:gap-3.5",
          )}
        >
          <button
            type="button"
            onClick={() => navigate("/academics/class-schedules")}
            className="cpc-btn cpc-btn-primary cpc-btn-lg w-full duration-200! hover:[transform:translateY(-2px)] hover:shadow-[0_14px_30px_rgba(6,20,60,0.35)]! focus-visible:outline-white! sm:w-auto sm:min-w-[176px]"
          >
            View Schedule
          </button>
          <button
            type="button"
            onClick={() => navigate("/my-account/profile")}
            className="cpc-btn cpc-btn-secondary cpc-btn-lg w-full border-white/50! bg-white/15! text-white! shadow-[0_10px_26px_rgba(6,20,60,0.22)] backdrop-blur-[10px] duration-200! hover:[transform:translateY(-2px)] hover:bg-white/25! hover:text-white! focus-visible:outline-white! focus-visible:shadow-[0_0_0_3px_rgba(255,255,255,0.55)]! sm:w-auto sm:min-w-[176px]"
          >
            My Account
          </button>
        </div>
      </div>
    </section>
  );
}