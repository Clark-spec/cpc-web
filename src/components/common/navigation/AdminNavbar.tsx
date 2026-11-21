import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { ChevronDown, LogOut, Menu, Search, User } from "lucide-react";
import { cn } from "@/lib/cn";
import { useAdminAuth } from "@/components/context/AdminAuthContext";
import { useSidebar } from "@/components/context/SidebarContext";
import { useClickOutside } from "@/hooks/useClickOutside";
import { AdminNotificationBell } from "@/components/common/feedback/AdminNotificationBell";
import { Breadcrumbs } from "@/components/common/navigation/Breadcrumbs";
import { ConfirmDialog } from "@/components/common/feedback/ConfirmDialog";

type AdminNavbarProps = { onOpenSearch: () => void };
export function AdminNavbar({ onOpenSearch }: AdminNavbarProps) {
  const { user, logout } = useAdminAuth();
  const { openMobile } = useSidebar();
  const navigate = useNavigate();
  const [userOpen, setUserOpen] = useState(false);
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const userRef = useRef<HTMLDivElement>(null);
  useClickOutside(userRef, () => setUserOpen(false), userOpen);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  if (!user) return null;
  return <header className={cn("sticky top-0 z-30 border-b bg-white transition-shadow", scrolled ? "border-cpc-tile-border/80 shadow-[0_6px_20px_rgba(15,36,104,0.08)]" : "border-transparent")}>
    <div className="flex h-[72px] items-center gap-3 px-4 sm:px-6 lg:px-8">
      <button type="button" onClick={openMobile} aria-label="Open navigation menu" aria-controls="admin-mobile-nav" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cpc-tile-border/70 bg-white text-cpc-heading-soft hover:bg-cpc-section-light lg:hidden"><Menu className="h-5 w-5"/></button>
      <div className="hidden min-w-0 flex-1 md:block"><Breadcrumbs/></div>
      <button type="button" onClick={onOpenSearch} aria-label="Search students and requests" className="flex h-10 w-10 items-center justify-center rounded-xl border border-cpc-tile-border/70 bg-white text-cpc-heading-soft hover:bg-cpc-section-light md:hidden"><Search className="h-[18px] w-[18px]"/></button>
      <div className="flex shrink-0 items-center gap-2"><AdminNotificationBell/><div ref={userRef} className="relative">
        <button type="button" onClick={() => setUserOpen((open) => !open)} aria-expanded={userOpen} aria-haspopup="menu" aria-label={`${user.name}. Open account menu`} className="flex h-10 items-center gap-2 rounded-xl border border-cpc-tile-border/70 bg-white px-1.5 hover:bg-cpc-section-light sm:pr-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-cpc-navy text-[10px] font-semibold text-white">{user.initials}</span><span className="hidden min-w-0 text-left lg:block"><span className="block max-w-[9rem] truncate text-xs font-semibold text-cpc-navy-text">{user.name}</span><span className="block max-w-[9rem] truncate text-[10px] text-cpc-heading-soft">{user.title}</span></span><ChevronDown className={cn("hidden h-3.5 w-3.5 text-cpc-heading-soft transition-transform sm:block", userOpen && "rotate-180")}/>
        </button>
        {userOpen && <div role="menu" aria-label="Account menu" className="admin-fade-in absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-cpc-tile-border bg-white p-1.5 shadow-[0_18px_50px_rgba(15,36,104,0.22)]">
          <div className="border-b border-cpc-tile-border/70 px-2.5 pb-2 pt-1.5"><p className="truncate text-xs font-semibold text-cpc-navy-text">{user.name}</p><p className="truncate text-[10px] text-cpc-heading-soft">{user.title}</p></div>
          <button type="button" role="menuitem" onClick={() => { setUserOpen(false); navigate("/admin/settings/profile"); }} className="mt-1 flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-medium text-cpc-navy-text hover:bg-cpc-section-light"><User className="h-4 w-4 text-cpc-heading-soft"/>My profile</button>
          <button type="button" role="menuitem" onClick={() => { setUserOpen(false); setConfirmLogoutOpen(true); }} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-medium text-rose-700 hover:bg-rose-50"><LogOut className="h-4 w-4"/>Log out</button>
        </div>}
      </div></div>
    </div>
    <ConfirmDialog open={confirmLogoutOpen} onClose={() => setConfirmLogoutOpen(false)} onConfirm={() => { setConfirmLogoutOpen(false); logout(); }} title="Log out of the staff portal?" description="You will need to sign in again to access staff records." confirmLabel="Log out" danger />
  </header>;
}
