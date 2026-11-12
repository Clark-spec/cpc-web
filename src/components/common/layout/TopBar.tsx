import type { ReactNode } from "react";
import { BookOpen } from "lucide-react";
import { MapPinIcon } from "@/components/common/display/icons";
import { NotificationBell } from "@/components/common/feedback/NotificationBell";

const LOCATION = "Gabi, Cordova, Cebu";

/** `bell` lets a page swap in its own notification control (e.g. the
 *  clearance bell with unread dot + dropdown); the default renders the shared
 *  real-time student notification bell. */
export function TopBar({ bell }: { bell?: ReactNode }) {
  return (
    <div className="relative w-full overflow-hidden bg-cpc-navy-top">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_140%_at_0%_0%,rgba(255,255,255,0.10),transparent_55%)]"
      />
      <div className="relative mx-auto grid h-14 w-full max-w-[1440px] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4 px-4 sm:px-6 lg:px-[50px]">
        <div className="flex min-w-0 items-center gap-2.5">
          <MapPinIcon className="h-4 w-4 shrink-0 text-white/70" />
          <div className="min-w-0">
            <p className="truncate font-poppins text-[10.5px] leading-[14px] font-semibold tracking-[0.14em] text-white uppercase">
              {LOCATION}
            </p>
            <p className="truncate font-poppins text-[10px] leading-[14px] text-white/65">
              Cordova Public College
            </p>
          </div>
        </div>

        <div className="hidden items-center gap-2.5 md:flex md:border-x md:border-white/15 md:px-8">
          <BookOpen className="h-4 w-4 shrink-0 text-white/70" aria-hidden />
          <div>
            <p className="font-poppins text-[10.5px] leading-[14px] font-semibold tracking-[0.14em] text-white uppercase">
              Servire Populum
            </p>
            <p className="font-poppins text-[10px] leading-[14px] text-white/65">
              Service to the People
            </p>
          </div>
        </div>

        <div className="flex justify-self-end">
          {bell ?? <NotificationBell />}
        </div>
      </div>
    </div>
  );
}

