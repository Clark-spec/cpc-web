import { ChevronDown } from "lucide-react";
import { useLocation } from "react-router";
import { cn } from "@/lib/cn";
import {
  isRouteActive,
  type NavGroup,
} from "@/lib/navigation";
import type { AdminBadgeCounts } from "@/types/admin";
import { SidebarItem } from "@/components/common/SidebarItem";

type SidebarGroupProps = {
  group: NavGroup;
  collapsed: boolean;
  open: boolean;
  onToggle: () => void;
  badges: AdminBadgeCounts;
  onNavigate?: () => void;
  flyoutOpen: boolean;
  onOpenFlyout: (group: NavGroup, rect: DOMRect, focusFirst?: boolean) => void;
  onCloseFlyout: () => void;
};

export function SidebarGroup({
  group,
  collapsed,
  open,
  onToggle,
  badges,
  onNavigate,
  flyoutOpen,
  onOpenFlyout,
  onCloseFlyout,
}: SidebarGroupProps) {
  const { pathname } = useLocation();
  const active = group.children.some((child) => isRouteActive(pathname, child.to));
  const groupCount = group.badgeKey ? badges[group.badgeKey] : 0;
  const groupBadge = groupCount > 0 ? (groupCount > 99 ? "99+" : String(groupCount)) : null;
  const childBadgeTotal = group.children.reduce(
    (total, child) => total + (child.badgeKey ? badges[child.badgeKey] : 0),
    0,
  );
  const Icon = group.icon;
  const panelId = `admin-nav-group-${group.id}`;

  if (collapsed) {
    return (
      <li className="flex justify-center">
        <button
          type="button"
          data-nav-item
          data-nav-group
          aria-haspopup="menu"
          aria-expanded={flyoutOpen}
          aria-label={`${group.label} menu`}
          onMouseEnter={(event) => onOpenFlyout(group, event.currentTarget.getBoundingClientRect())}
          onMouseLeave={onCloseFlyout}
          onClick={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            if (flyoutOpen) onCloseFlyout();
            else onOpenFlyout(group, rect);
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowRight") {
              event.preventDefault();
              onOpenFlyout(group, event.currentTarget.getBoundingClientRect(), true);
            }
            if (event.key === "ArrowLeft" || event.key === "Escape") {
              event.preventDefault();
              onCloseFlyout();
            }
          }}
          className={cn(
            "group relative flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent",
            active || flyoutOpen
              ? "bg-cpc-section-light text-cpc-blue-accent"
              : "text-cpc-heading-soft hover:bg-cpc-section-light/70 hover:text-cpc-navy-text",
          )}
        >
          <span
            aria-hidden
            className={cn(
              "absolute top-1/2 left-0 h-6 w-1 -translate-y-1/2 rounded-r-full bg-cpc-blue-accent transition-opacity",
              active ? "opacity-100" : "opacity-0",
            )}
          />
          <Icon className="h-5 w-5" aria-hidden />
          {childBadgeTotal > 0 && (
            <span
              aria-hidden
              className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white"
            />
          )}
        </button>
      </li>
    );
  }

  return (
    <li>
      <button
        type="button"
        data-nav-item
        data-nav-group
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight" && !open) {
            event.preventDefault();
            onToggle();
          }
          if ((event.key === "ArrowLeft" || event.key === "Escape") && open) {
            event.preventDefault();
            onToggle();
          }
        }}
        className={cn(
          "group relative flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 font-poppins text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent",
          active
            ? "bg-cpc-section-light/60 font-semibold text-cpc-blue-accent"
            : "text-cpc-heading-soft hover:bg-cpc-section-light/70 hover:text-cpc-navy-text",
        )}
      >
        <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
        <span className="min-w-0 flex-1 truncate text-left">{group.label}</span>

        {groupBadge && (
          <span className="shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 font-poppins text-[10px] leading-none font-bold text-amber-800">
            {groupBadge}
          </span>
        )}

        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-cpc-muted-blue transition-transform duration-200",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      {open && (
        <ul id={panelId} className="relative mt-1 space-y-0.5 pl-2">
          <span
            aria-hidden
            className="absolute top-0 bottom-0 left-[22px] w-px bg-cpc-tile-border/80"
          />
          {group.children.map((child) => (
            <SidebarItem
              key={child.id}
              item={child}
              collapsed={false}
              badges={badges}
              onNavigate={onNavigate}
              nested
            />
          ))}
        </ul>
      )}
    </li>
  );
}
