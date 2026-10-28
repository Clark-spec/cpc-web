import {
  BookOpenIcon,
  FileTextIcon,
  MegaphoneIcon,
  UserIcon,
  UsersIcon,
  type IconComponent,
} from "@/components/common/icons";

type QuickAccessTile = {
  label: string;
  title: string;
  description: string;
  to: string;
  icon: IconComponent;
};

const quickAccessTiles: QuickAccessTile[] = [
  {
    label: "Enrollment",
    title: "Enrollment",
    description: "Apply, enroll, and manage your academic journey.",
    to: "#",
    icon: UsersIcon,
  },
  {
    label: "Student Services",
    title: "Student Services",
    description: "Clearance, kiosk, and other essential services.",
    to: "#",
    icon: FileTextIcon,
  },
  {
    label: "Academics",
    title: "Academics",
    description: "View schedules, calendar, and your academic records.",
    to: "#",
    icon: BookOpenIcon,
  },
  {
    label: "Student Support",
    title: "Student Support",
    description: "File complaints and explore scholarship opportunities.",
    to: "#",
    icon: UserIcon,
  },
  {
    label: "News & Information",
    title: "News & Information",
    description: "Stay updated with the latest school news.",
    to: "#",
    icon: MegaphoneIcon,
  },
  {
    label: "My Account",
    title: "My Account",
    description: "Manage your profile, status and notifications.",
    to: "#",
    icon: UserIcon,
  },
];

export function QuickAccessCard() {
  return (
    <div className="mx-auto mt-[30px] w-full max-w-[1440px] px-[86px]">
      {/* TODO: replace the placeholder hrefs with the section routes. */}
      <div className="grid grid-cols-6 gap-[20px] rounded-[4px] bg-white p-[26px] shadow-[3px_3px_6px_rgba(0,0,0,0.25)]">
        {quickAccessTiles.map((tile) => (
          <a
            key={tile.label}
            href={tile.to}
            className="flex h-[147px] flex-col rounded-[2px] border border-cpc-tile-border bg-white p-[14px] text-left"
          >
            <tile.icon className="h-[36px] w-[36px] text-cpc-label" />
            <p className="mt-[6px] font-poppins text-[15px] leading-[17px] font-semibold text-cpc-label">{tile.title}</p>
            <p className="mt-[4px] font-poppins text-[11px] leading-[13px] font-normal text-cpc-muted-blue">
              {tile.description}
            </p>
          </a>
        ))}
      </div>
    </div>
  );
}
