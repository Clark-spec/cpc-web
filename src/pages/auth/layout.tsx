import { useEffect, useState } from "react";
import { Outlet } from "react-router";
import {
  AuthLayoutModeContext,
  type AuthLayoutMode,
} from "@/components/features/auth/auth-layout-mode";
import cpcBuilding from "@/assets/cpc-building.png";
import diploma from "@/assets/diploma.png";
import gradHat from "@/assets/gradhat.png";

const DESIGN_WIDTH = 1440;
const DESIGN_HEIGHT = 1024;
/** Never report a viewport wider/taller than this; anything beyond is a stale window rect. */
const MAX_TRUSTED_WIDTH = 2560;
const MAX_TRUSTED_HEIGHT = 1600;

/** Aspect ratio (width / height) at/above which the fluid wide layout takes over. */
const WIDE_LAYOUT_ASPECT = DESIGN_WIDTH / DESIGN_HEIGHT;
/** Aspect ratio below which the dedicated mobile layout takes over. */
const MOBILE_LAYOUT_ASPECT = 1.05;
/** Card geometry from the Figma frame: 34.5% of 1440 x 67% of 1024. */
const CARD_DESIGN_WIDTH = 496.8;
const CARD_DESIGN_HEIGHT = 686;

function resolveMode(viewportWidth: number, viewportHeight: number): AuthLayoutMode {
  const aspect = viewportWidth / viewportHeight;
  if (aspect < MOBILE_LAYOUT_ASPECT) return "mobile";
  return aspect > WIDE_LAYOUT_ASPECT ? "wide" : "frame";
}

/** Fraction of the window width the login card takes in wide mode. */
const WIDE_CARD_WIDTH_SHARE = 0.335;
/** Never let the card exceed this share of the window height. */
const WIDE_CARD_MAX_HEIGHT_SHARE = 0.84;

export default function AuthLayout() {
  const [viewport, setViewport] = useState(() => ({
    width: Math.min(window.innerWidth, MAX_TRUSTED_WIDTH),
    height: Math.min(window.innerHeight, MAX_TRUSTED_HEIGHT),
  }));

  useEffect(() => {
    const fitDesignFrame = () => {
      const width = Math.min(window.innerWidth, MAX_TRUSTED_WIDTH);
      const height = Math.min(window.innerHeight, MAX_TRUSTED_HEIGHT);
      setViewport({ width, height });
      document.documentElement.style.setProperty(
        "--auth-scale",
        String(Math.min(width / DESIGN_WIDTH, height / DESIGN_HEIGHT)),
      );
    };
    fitDesignFrame();
    window.addEventListener("resize", fitDesignFrame);
    return () => window.removeEventListener("resize", fitDesignFrame);
  }, []);

  const mode = resolveMode(viewport.width, viewport.height);

  return (
    <AuthLayoutModeContext.Provider value={mode}>
      <main className="flex h-screen w-screen items-center justify-center overflow-hidden bg-cpc-bg font-inter">
        {mode === "mobile" ? (
          <MobileStage />
        ) : mode === "wide" ? (
          <WideStage width={viewport.width} height={viewport.height} />
        ) : (
          <FrameStage />
        )}
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

      <section className="absolute inset-x-5 top-1/2 z-10 -translate-y-1/2 overflow-hidden rounded-[28px] border border-white/60 bg-white/70 shadow-[0_24px_80px_rgba(11,42,123,0.18)] backdrop-blur-md">
        <Outlet />
      </section>
    </div>
  );
}

/** Fluid layout for viewports wider than the design frame: same geometry
 *  expressed in vw/vh, so it fills the whole window without distortion. The
 *  card is sized from the window width (slightly wider than the original
 *  design share), capped so it never exceeds 84% of the window height, and
 *  centered vertically so the top and bottom margins are equal. */
function WideStage({ width, height }: { width: number; height: number }) {
  const scale = Math.min(
    (width * WIDE_CARD_WIDTH_SHARE) / CARD_DESIGN_WIDTH,
    (height * WIDE_CARD_MAX_HEIGHT_SHARE) / CARD_DESIGN_HEIGHT,
  );
  const cardWidth = CARD_DESIGN_WIDTH * scale;
  const cardHeight = CARD_DESIGN_HEIGHT * scale;
  const cardTop = (height - cardHeight) / 2;

  return (
    <div className="relative h-full w-full">
      {/* Washed-out campus building along the bottom. */}
      <img
        src={cpcBuilding}
        alt=""
        aria-hidden
        className="absolute top-[33.81vh] left-[7.22vw] z-[1] h-[67.3vh] w-auto opacity-75 mix-blend-multiply"
      />

      {/* Dark navy diagonal shapes. */}
      <div className="absolute inset-0 z-[2] bg-cpc-navy" style={{ clipPath: "polygon(0 0, 65% 0, 0 54%)" }} />
      <div className="absolute inset-0 z-[2] bg-cpc-navy" style={{ clipPath: "polygon(100% 72%, 100% 100%, 65% 100%)" }} />

      {/* Diploma behind the graduation cap. */}
      <img
        src={diploma}
        alt=""
        aria-hidden
        className="absolute top-[19.06vh] left-[84.4vw] z-[3] h-[11.06vh] w-auto"
      />
      <img
        src={gradHat}
        alt=""
        aria-hidden
        className="absolute top-[1.52vh] left-[75.82vw] z-[4] h-[21.35vh] w-auto"
      />

      {/* Glass login card, vertically centered. */}
      <section
        className="absolute left-[8.6vw] z-10 overflow-hidden border border-white/60 bg-white/70 shadow-[0_24px_80px_rgba(11,42,123,0.18)] backdrop-blur-md"
        style={{
          top: cardTop,
          height: cardHeight,
          width: cardWidth,
          borderRadius: 46 * scale,
        }}
      >
        <div
          className="h-[686px] w-[496.8px] flex-none origin-top-left pt-[36px] pb-[20px]"
          style={{ transform: `scale(${scale})` }}
        >
          <Outlet />
        </div>
      </section>

      {/* Welcome message, scaled to match the card. */}
      <div
        className="absolute top-[36.27vh] left-[53.6vw] z-10 origin-top-left"
        style={{ transform: `scale(${scale})` }}
      >
        <p className="text-[64px] leading-[64px] font-normal text-cpc-welcome">Welcome to</p>
        <p className="text-[95px] leading-[99.6px] font-extrabold text-cpc-cordova">Cordova</p>
        <p className="text-[64px] leading-[92.8px] font-bold text-cpc-cordova">Public College</p>
      </div>
    </div>
  );
}

/** Fixed 1440x1024 design frame, uniformly scaled to fit the viewport. */
function FrameStage() {
  return (
    <div className="auth-stage relative h-[1024px] w-[1440px] flex-none">
      {/* Washed-out campus building along the bottom. */}
      <img
        src={cpcBuilding}
        alt=""
        aria-hidden
        className="absolute top-[33.81%] left-[7.22%] z-[1] h-[67.3%] w-auto opacity-75 mix-blend-multiply"
      />

      {/* Dark navy diagonal shapes. */}
      <div className="absolute inset-0 z-[2] bg-cpc-navy" style={{ clipPath: "polygon(0 0, 65% 0, 0 54%)" }} />
      <div className="absolute inset-0 z-[2] bg-cpc-navy" style={{ clipPath: "polygon(100% 72%, 100% 100%, 65% 100%)" }} />

      {/* Diploma behind the graduation cap. */}
      <img
        src={diploma}
        alt=""
        aria-hidden
        className="absolute top-[19.06%] left-[84.4%] z-[3] h-[11.06%] w-auto"
      />
      <img
        src={gradHat}
        alt=""
        aria-hidden
        className="absolute top-[1.52%] left-[75.82%] z-[4] h-[21.35%] w-auto"
      />

      {/* Glass login card. */}
      <section className="absolute top-[19%] left-[8.6%] z-10 flex h-[67%] w-[34.5%] flex-col items-center overflow-hidden rounded-[46px] border border-white/60 bg-white/70 pt-[36px] pb-[20px] shadow-[0_24px_80px_rgba(11,42,123,0.18)] backdrop-blur-md">
        <Outlet />
      </section>

      {/* Welcome message. */}
      <div className="absolute top-[36.27%] left-[53.6%] z-10">
        <p className="text-[64px] leading-[64px] font-normal text-cpc-welcome">Welcome to</p>
        <p className="text-[95px] leading-[99.6px] font-extrabold text-cpc-cordova">Cordova</p>
        <p className="text-[64px] leading-[92.8px] font-bold text-cpc-cordova">Public College</p>
      </div>
    </div>
  );
}
