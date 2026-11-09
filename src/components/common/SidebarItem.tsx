import { useState } from "react";
import { createPortal } from "react-dom";
import { NavLink, useLocation } from "react-router";
import { cn } from "@/lib/cn";
import { isRouteActive, type NavLeaf } from "@/lib/navigation";
import type { AdminBadgeCounts } from "@/types/admin";

type SidebarItemProps = {
  item: NavLeaf;
  collapsed: boolean;
  badges: AdminBadgeCounts;
  onNavigate?: () => void;
  /** Submenu items get a smaller icon and extra indentation. */
  nested?: boolean;
};

type TooltipPosition = { top: number; left: number };

export function SidebarItem({
  item,
  collapsed,
  badges,
  onNavigate,
  nested = false,
}: SidebarItemProps) {
  const { pathname } = useLocation();
  const active = isRouteActive(pathname, item.to);
  const count = item.badgeKey ? badges[item.badgeKey] : 0;
  const badge = count > 0 ? (count > 99 ? "99+" : String(count)) : null;
  const badgeTone =
    item.badgeKey === "enrollment" || item.badgeKey === "profileCorrections"
      ? "bg-amber-100 text-amber-800"
      : "bg-rose-100 text-rose-700";
  const [tooltip, setTooltip] = useState<TooltipPosition | null>(null);
  const Icon = item.icon;

  const showTooltip = (element: HTMLElement) => {
    if (!collapsed) return;
    const rect = element.getBoundingClientRect();
    setTooltip({ top: rect.top + rect.height / 2, left: rect.right + 8 });
  };

  const link = (
    <NavLink
      to={item.to}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      aria-label={
        collapsed
          ? `${item.label}${badge ? `, ${count} pending` : ""}`
          : undefined
      }
      data-nav-item
      onMouseEnter={(event) => showTooltip(event.currentTarget)}
      onMouseLeave={() => setTooltip(null)}
      onFocus={(event) => showTooltip(event.currentTarget)}
      onBlur={() => setTooltip(null)}
      className={cn(
        "group relative flex items-center rounded-xl font-poppins transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent",
        collapsed
          ? "mx-auto h-11 w-11 justify-center"
          : nested
            ? "gap-2.5 py-2 pr-3 pl-7 text-[13px]"
            : "gap-3 px-3 py-2.5 text-sm",
        active
          ? "bg-cpc-section-light font-semibold text-cpc-blue-accent"
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
      <Icon
        className={cn(
          "shrink-0",
          collapsed ? "h-5 w-5" : nested ? "h-4 w-4" : "h-[18px] w-[18px]",
        )}
        aria-hidden
      />

      {!collapsed && <span className="min-w-0 flex-1 truncate">{item.label}</span>}

      {!collapsed && badge && (
        <span
          className={cn(
            "ml-auto shrink-0 rounded-full px-1.5 py-0.5 font-poppins text-[10px] leading-none font-bold",
            badgeTone,
          )}
        >
          {badge}
        </span>
      )}

      {collapsed && badge && (
        <span
          aria-hidden
          className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white"
        />
      )}
    </NavLink>
  );

  return (
    <li className={cn(collapsed && "flex justify-center")}>
      {link}
      {tooltip &&
        createPortal(
          <span
            role="tooltip"
            style={{
              position: "fixed",
              top: tooltip.top,
              left: tooltip.left,
              transform: "translateY(-50%)",
            }}
            className="pointer-events-none z-[80] whitespace-nowrap rounded-md bg-cpc-navy px-2 py-1 font-poppins text-[11px] font-medium text-white shadow-lg"
          >
            {item.label}
            {badge ? ` · ${badge}` : ""}
          </span>,
          document.body,
        )}
    </li>
  );
}
