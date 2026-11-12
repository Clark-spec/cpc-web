import type { ReactNode } from "react";
import { MapPinIcon } from "@/components/common/display/icons";
import { NotificationBell } from "@/components/common/feedback/NotificationBell";

const LOCATION = "Gabi, Cordova, Cebu";

/** `bell` lets a page swap in its own notification control (e.g. the
 *  clearance bell with unread dot + dropdown); the default renders the shared
 *  real-time student notification bell. */
export function TopBar({ bell }: { bell?: ReactNode }) {
  return (
    <div className="h-[73px] w-full bg-cpc-navy-top">
      <div className="mx-auto flex h-full w-full max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-[50px]">
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3 lg:gap-[14px]">
          <MapPinIcon className="h-6 w-6 shrink-0 text-white sm:h-7 sm:w-7 lg:h-[34px] lg:w-[34px]" />
          <span className="truncate font-poppins text-sm leading-tight font-semibold text-white sm:text-base lg:text-[17px] lg:leading-[17px]">
            {LOCATION}
          </span>
        </div>

        {bell ?? <NotificationBell />}
      </div>
    </div>
  );
}

