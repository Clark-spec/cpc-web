import { useEffect, useState } from "react";
import { Outlet } from "react-router";
import {
  AuthLayoutModeContext,
  type AuthLayoutMode,
} from "@/components/features/auth/auth-layout-mode";
import cpcBuilding from "@/assets/cpc-building.png";
import diploma from "@/assets/diploma.png";
import gradHat from "@/assets/gradhat.png";

/** Every geometry below is a design px measured from the 1440x1024 login
 *  artwork, applied through one uniform scale so the proportions of the design
 *  survive at any desktop window size. */
const DESIGN_WIDTH = 1440;
const DESIGN_HEIGHT = 1024;
/** Aspect ratio below which the dedicated mobile layout takes over. */
const MOBILE_LAYOUT_ASPECT = 1.05;
/** Never report a viewport wider/taller than this; anything beyond is a stale window rect. */
const MAX_TRUSTED_WIDTH = 2560;
const MAX_TRUSTED_HEIGHT = 1600;

/** Glass card box, measured from the design. */
const CARD = { width: 559, height: 791, left: 87, top: 121, radius: 46 };

/** The right-hand group — cap, diploma and welcome message — measured from the
 *  design's right edge, so it can be scaled from that corner as one unit. */
const RIGHT_GROUP_WIDTH = 668;

function readViewport() {
  return {
    width: Math.min(window.innerWidth, MAX_TRUSTED_WIDTH),
    height: Math.min(window.innerHeight, MAX_TRUSTED_HEIGHT),
  };
}

export default function AuthLayout() {
  const [viewport, setViewport] = useState(readViewport);

  useEffect(() => {
    const fit = () => setViewport(readViewport());
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  const mode: AuthLayoutMode =
    viewport.width / viewport.height < MOBILE_LAYOUT_ASPECT ? "mobile" : "desktop";

  return (
    <AuthLayoutModeContext.Provider value={mode}>
      <main className="flex h-screen w-full items-center justify-center overflow-hidden bg-cpc-bg font-inter">
        {mode === "mobile" ? <MobileStage /> : <DesktopStage {...viewport} />}
      </main>
    </AuthLayoutModeContext.Provider>
  );
}

/** Dedicated small-screen layout: a full-width glass card centered on the
 *  brand background. The welcome message and grad cap are omitted — there is
 *  no room for them in portrait — and the form renders its fluid variant. */
function MobileStage() {
  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Dark navy diagonal across the top. */}
      <div
        className="absolute inset-0 z-[1] bg-cpc-navy"
        style={{ clipPath: "polygon(0 0, 100% 0, 0 34%)" }}
      />
      {/* Washed-out campus building along the bottom, roof fully visible. */}
      <img
        src={cpcBuilding}
        alt=""
        aria-hidden
        className="absolute right-0 bottom-0 z-[1] w-[94%] opacity-50 mix-blend-multiply"
      />

      <section className="absolute inset-x-5 top-1/2 z-10 -translate-y-1/2 overflow-hidden rounded-[28px] border border-white/60 bg-white/70 shadow-[0_24px_80px_rgba(8,45,121,0.18)] backdrop-blur-md">
        <Outlet />
      </section>
    </div>
  );
}

/** Desktop and tablet layout. Each layer keeps the edge it is pinned to in the
 *  design — the card and the upper diagonal to the top-left, the building and
 *  lower triangle to the bottom-right, the cap, diploma and welcome message to
 *  the top-right — so the window fills completely while every element holds the
 *  design's proportions.
 *
 *  The blended artwork is placed with computed px instead of a `transform`
 *  wrapper: a transformed ancestor would isolate `mix-blend-multiply` from the
 *  page background and the building would stop washing out. */
function DesktopStage({ width, height }: { width: number; height: number }) {
  const scale = Math.min(width / DESIGN_WIDTH, height / DESIGN_HEIGHT);
  const px = (designPx: number) => `${designPx * scale}px`;

  return (
    <div className="relative h-full w-full">
      {/* Washed-out campus building along the bottom. */}
      <img
        src={cpcBuilding}
        alt=""
        aria-hidden
        className="absolute right-0 bottom-0 z-[1] h-auto w-auto mix-blend-multiply"
        style={{ height: px(689), right: px(-19), bottom: px(-7) }}
      />

      {/* Dark navy diagonals: one cut across the top-left, one tucked into the
          bottom-right corner. */}
      <div
        className="absolute inset-0 z-[2] bg-cpc-navy"
        style={{ clipPath: `polygon(0 0, ${px(928)} 0, 0 ${px(549)})` }}
      />
      <div
        className="absolute right-0 bottom-0 z-[2] bg-cpc-navy"
        style={{ width: px(495), height: px(293), clipPath: "polygon(100% 0, 100% 100%, 0 100%)" }}
      />

      {/* Cap, diploma and welcome message, scaled from the top-right corner. */}
      <div
        className="absolute top-0 right-0 z-[3] h-[1024px] origin-top-right"
        style={{ width: RIGHT_GROUP_WIDTH, transform: `scale(${scale})` }}
      >
        <img
          src={diploma}
          alt=""
          aria-hidden
          className="absolute top-[195px] right-[61px] z-[3] h-[113px] w-auto"
        />
        <img
          src={gradHat}
          alt=""
          aria-hidden
          className="absolute top-[16px] right-[47px] z-[4] h-[219px] w-auto"
        />
        <div className="absolute top-[369px] left-0 z-10">
          <p className="text-[64px] leading-[64px] font-normal text-cpc-welcome">Welcome to</p>
          <p className="text-[95px] leading-[99.6px] font-extrabold text-cpc-cordova">Cordova</p>
          <p className="text-[64px] leading-[92.8px] font-bold text-cpc-cordova">Public College</p>
        </div>
      </div>

      {/* Glass login card, pinned to the design's top-left corner. */}
      <section
        className="absolute z-10 overflow-hidden border border-white/60 bg-white/[0.93] shadow-[0_24px_80px_rgba(8,45,121,0.18)] backdrop-blur-md"
        style={{
          left: px(CARD.left),
          top: px(CARD.top),
          width: px(CARD.width),
          height: px(CARD.height),
          borderRadius: CARD.radius * scale,
        }}
      >
        <div
          className="h-[791px] w-[559px] flex-none origin-top-left"
          style={{ transform: `scale(${scale})` }}
        >
          <Outlet />
        </div>
      </section>
    </div>
  );
}
