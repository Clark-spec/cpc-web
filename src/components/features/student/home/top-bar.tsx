import { BellIcon, MapPinIcon } from "@/components/common/icons";

const LOCATION = "Gabi, Cordova, Cebu";

export function TopBar() {
  return (
    <div className="h-[73px] w-full bg-cpc-navy-top">
      <div className="mx-auto flex h-full w-full max-w-[1440px] items-center justify-between px-[50px]">
        <div className="flex items-center gap-[14px]">
          <MapPinIcon className="h-[34px] w-[34px] text-white" />
          <span className="font-poppins text-[17px] leading-[17px] font-semibold text-white">{LOCATION}</span>
        </div>

        <button
          type="button"
          aria-label="Notifications"
          className="flex h-[50px] w-[50px] cursor-pointer items-center justify-center rounded-full bg-[#c9d3f3] transition-colors hover:bg-[#b8c6f0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          {/* TODO: render an unread badge once the notifications API exists. */}
          <BellIcon className="h-[26px] w-[26px] text-white" />
        </button>
      </div>
    </div>
  );
}
