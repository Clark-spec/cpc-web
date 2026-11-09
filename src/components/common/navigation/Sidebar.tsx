import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { Link, NavLink, useLocation } from "react-router";
import { PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import cpcLogo from "@/assets/cpc-logo.jpg";
import { cn } from "@/lib/cn";
import { useAdminAuth } from "@/components/context/AdminAuthContext";
import { useAdminData } from "@/components/context/AdminDataContext";
import { useSidebar } from "@/components/context/SidebarContext";
import {
  filterNavigation,
  findGroupForPath,
  isRouteActive,
  SETTINGS_NAV,
  type NavGroup,
} from "@/lib/navigation";
import { SidebarGroup } from "@/components/common/navigation/SidebarGroup";
import { SidebarItem } from "@/components/common/navigation/SidebarItem";
import { SidebarUserCard } from "@/components/common/navigation/SidebarUserCard";

type SidebarProps = {
  /** Mobile drawer variant: always expanded and shows a close button. */
  mobile?: boolean;
  onClose?: () => void;
};

type FlyoutState = {
  group: NavGroup;
  top: number;
  left: number;
  focusFirst: boolean;
  /** Route the flyout was opened on; a route change closes it. */
  path: string;
};

export function Sidebar({ mobile = false, onClose }: SidebarProps) {
  const { user } = useAdminAuth();
  const { badges } = useAdminData();
  const { collapsed, toggleCollapsed } = useSidebar();
  const { pathname } = useLocation();
  const navRef = useRef<HTMLElement>(null);
  const flyoutRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const closeTimer = useRef<number | null>(null);

  const isCollapsed = mobile ? false : collapsed;

  const sections = useMemo(
    () => (user ? filterNavigation(user.role) : []),
    [user],
  );
  const activeGroup = useMemo(
    () => (user ? findGroupForPath(sections, pathname) : null),
    [pathname, sections, user],
  );
  // `null` means "follow the active route"; an entry pins the choice to the
  // route it was made on, so navigating auto-opens the next group without an
  // effect.
  const [groupChoice, setGroupChoice] = useState<{ path: string; id: string | null } | null>(
    null,
  );
  const openGroup =
    groupChoice && groupChoice.path === pathname
      ? groupChoice.id
      : (activeGroup?.id ?? null);
  const [flyout, setFlyout] = useState<FlyoutState | null>(null);

  const toggleGroup = (id: string) => {
    setGroupChoice({
      path: pathname,
      id: openGroup === id ? null : id,
    });
  };

  useEffect(() => {
    return () => {
      if (closeTimer.current !== null) window.clearTimeout(closeTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!flyout?.focusFirst) return;
    const first = flyoutRef.current?.querySelector<HTMLElement>("a,button");
    first?.focus();
  }, [flyout]);

  const cancelClose = useCallback(() => {
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    cancelClose();
    closeTimer.current = window.setTimeout(() => setFlyout(null), 160);
  }, [cancelClose]);

  const openFlyout = useCallback(
    (group: NavGroup, rect: DOMRect, focusFirst = false) => {
      cancelClose();
      triggerRef.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;

      const estimatedHeight = 56 + group.children.length * 44;
      const top = Math.max(
        8,
        Math.min(rect.top, window.innerHeight - estimatedHeight - 16),
      );

      setFlyout({ group, top, left: rect.right + 8, focusFirst, path: pathname });
    },
    [cancelClose, pathname],
  );

  const handleNavKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Escape") {
      setFlyout(null);
      if (mobile) onClose?.();
      return;
    }
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;

    const items = Array.from(
      navRef.current?.querySelectorAll<HTMLElement>("[data-nav-item]") ?? [],
    ).filter((element) => element.offsetParent !== null);

    if (items.length === 0) return;
    const currentIndex = items.indexOf(document.activeElement as HTMLElement);
    const direction = event.key === "ArrowDown" ? 1 : -1;
    const nextIndex =
      currentIndex === -1
        ? 0
        : (currentIndex + direction + items.length) % items.length;

    event.preventDefault();
    items[nextIndex]?.focus();
  };

  if (!user) return null;

  const brand = (
    <div
      className={cn(
        "relative flex shrink-0 border-b border-cpc-tile-border/70",
        isCollapsed
          ? "flex-col items-center gap-2 px-2 py-3"
          : "items-center gap-3 px-4 py-4",
      )}
    >
      <Link
        to="/admin/dashboard"
        onClick={onClose}
        aria-label="Cordova Public College admin dashboard"
        className="flex min-w-0 items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
      >
        <img
          src={cpcLogo}
          alt=""
          className={cn(
            "shrink-0 rounded-full object-cover",
            isCollapsed ? "h-10 w-10" : "h-11 w-11",
          )}
        />
        {!isCollapsed && (
          <div className="min-w-0 pr-8">
            <p className="truncate font-poppins text-[13px] leading-tight font-bold text-cpc-navy-text">
              Cordova Public College
            </p>
            <p className="mt-0.5 truncate font-poppins text-[11px] leading-tight font-medium tracking-[0.08em] text-cpc-blue-accent">
              Servire Populum
            </p>
          </div>
        )}
      </Link>

      {mobile ? (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close navigation menu"
          className="absolute top-1/2 right-3 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg text-cpc-heading-soft transition-colors hover:bg-cpc-section-light hover:text-cpc-navy-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
      ) : (
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!isCollapsed}
          title={isCollapsed ? "Expand sidebar (Ctrl+B)" : "Collapse sidebar (Ctrl+B)"}
          className={cn(
            "flex cursor-pointer items-center justify-center rounded-lg text-cpc-heading-soft transition-colors hover:bg-cpc-section-light hover:text-cpc-navy-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent",
            isCollapsed
              ? "h-8 w-8"
              : "absolute top-1/2 right-3 h-8 w-8 -translate-y-1/2",
          )}
        >
          {isCollapsed ? (
            <PanelLeftOpen className="h-4 w-4" aria-hidden />
          ) : (
            <PanelLeftClose className="h-4 w-4" aria-hidden />
          )}
        </button>
      )}
    </div>
  );

  return (
    <aside
      aria-label="Admin sidebar"
      className={cn(
        "admin-sidebar z-40 flex flex-col border-r border-cpc-tile-border/70 bg-white",
        mobile
          ? "h-full w-[280px] max-w-[85vw]"
          : cn("fixed inset-y-0 left-0 hidden lg:flex", isCollapsed ? "w-20" : "w-[280px]"),
      )}
    >
      {brand}

      <nav
        ref={navRef}
        aria-label="Admin navigation"
        onKeyDown={handleNavKeyDown}
        onScroll={() => setFlyout(null)}
        className="admin-scrollbar flex-1 overflow-x-hidden overflow-y-auto px-3 pb-4"
      >
        {sections.map((section) => (
          <div key={section.id} className="mt-4 first:mt-3">
            <p
              className={cn(
                "px-3 pb-2 font-poppins text-[10px] font-bold tracking-[0.16em] text-cpc-heading-soft uppercase",
                isCollapsed && "sr-only",
              )}
            >
              {section.label}
            </p>
            <ul className="space-y-1">
              {section.items.map((item) =>
                item.type === "link" ? (
                  <SidebarItem
                    key={item.id}
                    item={item}
                    collapsed={isCollapsed}
                    badges={badges}
                    onNavigate={onClose}
                  />
                ) : (
                  <SidebarGroup
                    key={item.id}
                    group={item}
                    collapsed={isCollapsed}
                    open={openGroup === item.id}
                    onToggle={() => toggleGroup(item.id)}
                    badges={badges}
                    onNavigate={onClose}
                    flyoutOpen={flyout?.group.id === item.id}
                    onOpenFlyout={openFlyout}
                    onCloseFlyout={scheduleClose}
                  />
                ),
              )}
            </ul>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-cpc-tile-border/70 p-3">
        <p
          className={cn(
            "px-3 pb-2 font-poppins text-[10px] font-bold tracking-[0.16em] text-cpc-heading-soft uppercase",
            isCollapsed && "sr-only",
          )}
        >
          SYSTEM
        </p>
        <ul className="space-y-1">
          <SidebarItem
            item={SETTINGS_NAV}
            collapsed={isCollapsed}
            badges={badges}
            onNavigate={onClose}
          />
        </ul>
        <SidebarUserCard collapsed={isCollapsed} onNavigate={onClose} />
      </div>

      {flyout &&
        flyout.path === pathname &&
        createPortal(
          <div
            ref={flyoutRef}
            role="menu"
            aria-label={`${flyout.group.label} menu`}
            style={{ position: "fixed", top: flyout.top, left: flyout.left }}
            onMouseEnter={cancelClose}
            onMouseLeave={scheduleClose}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.preventDefault();
                setFlyout(null);
                triggerRef.current?.focus();
              }
            }}
            className="admin-fade-in z-[70] w-64 rounded-2xl border border-cpc-tile-border bg-white p-2 shadow-[0_18px_50px_rgba(15,36,104,0.22)]"
          >
            <p className="px-2 py-1.5 font-poppins text-[10px] font-bold tracking-[0.14em] text-cpc-heading-soft uppercase">
              {flyout.group.label}
            </p>
            <ul className="space-y-0.5">
              {flyout.group.children.map((child) => {
                const active = isRouteActive(pathname, child.to);
                const count = child.badgeKey ? badges[child.badgeKey] : 0;
                const Icon = child.icon;

                return (
                  <li key={child.id}>
                    <NavLink
                      to={child.to}
                      role="menuitem"
                      onClick={() => {
                        setFlyout(null);
                        onClose?.();
                      }}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg px-2.5 py-2 font-poppins text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent",
                        active
                          ? "bg-cpc-section-light font-semibold text-cpc-blue-accent"
                          : "text-cpc-heading-soft hover:bg-cpc-section-light/70 hover:text-cpc-navy-text",
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" aria-hidden />
                      <span className="min-w-0 flex-1 truncate">{child.label}</span>
                      {count > 0 && (
                        <span className="shrink-0 rounded-full bg-rose-100 px-1.5 py-0.5 font-poppins text-[10px] leading-none font-bold text-rose-700">
                          {count > 99 ? "99+" : count}
                        </span>
                      )}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>,
          document.body,
        )}
    </aside>
  );
}
