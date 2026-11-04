import type { ReactNode } from "react";
import { BellIcon, MapPinIcon } from "@/components/common/icons";

const LOCATION = "Gabi, Cordova, Cebu";

/** `bell` lets a page swap in its own notification control (e.g. the
 *  clearance bell with unread dot + dropdown); the default uses the same
 *  clear, borderless bell treatment as the Online Clearance header. */
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

        {bell ?? (
          <button
            type="button"
            aria-label="Notifications"
            className="relative flex h-[50px] w-[50px] shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            {/* TODO: render an unread badge once the notifications API exists. */}
            <BellIcon className="h-[26px] w-[26px] text-white" />
          </button>
        )}
      </div>
    </div>
  );
}
