import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import {
  Check,
  ChevronDown,
  Loader2,
  LogOut,
  Menu,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  User,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useToast } from "@/components/ui/toast";
import { useAdminAuth } from "@/components/context/AdminAuthContext";
import { useAdminData } from "@/components/context/AdminDataContext";
import { useSidebar } from "@/components/context/SidebarContext";
import { useClickOutside } from "@/hooks/useClickOutside";
import { ALL_ROLES, ROLE_LABELS } from "@/lib/navigation";
import type { AdminRole } from "@/types/admin";
import { AdminNotificationBell } from "@/components/common/feedback/AdminNotificationBell";
import { Breadcrumbs } from "@/components/common/navigation/Breadcrumbs";
import { ConfirmDialog } from "@/components/common/feedback/ConfirmDialog";

type AdminNavbarProps = {
  onOpenSearch: () => void;
};

export function AdminNavbar({ onOpenSearch }: AdminNavbarProps) {
  const { user, demoMode, switchRole, logout } = useAdminAuth();
  const { generateSamples, resetDemo } = useAdminData();
  const { openMobile } = useSidebar();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [demoOpen, setDemoOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);
  const [demoBusy, setDemoBusy] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const demoRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  useClickOutside(demoRef, () => setDemoOpen(false), demoOpen);
  useClickOutside(userRef, () => setUserOpen(false), userOpen);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!user) return null;

  const handleRole = (role: AdminRole) => {
    setDemoOpen(false);
    switchRole(role);
    navigate("/admin/dashboard");
    toast(`Now viewing as ${ROLE_LABELS[role]}.`, "info");
  };

  const handleGenerate = async () => {
    setDemoBusy(true);
    try {
      await generateSamples();
      setDemoOpen(false);
      toast("Sample clearance requests generated.", "success");
    } catch {
      toast("Couldn't generate sample requests. Please try again.", "error");
    } finally {
      setDemoBusy(false);
    }
  };

  const handleReset = async () => {
    setDemoBusy(true);
    try {
      await resetDemo();
      setConfirmResetOpen(false);
      toast("Demo data reset to its initial state.", "info");
    } catch {
      toast("Couldn't reset the demo data. Please try again.", "error");
    } finally {
      setDemoBusy(false);
    }
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-30 border-b bg-white transition-shadow",
        scrolled
          ? "border-cpc-tile-border/80 shadow-[0_6px_20px_rgba(15,36,104,0.08)]"
          : "border-transparent",
      )}
    >
      <div className="flex h-[72px] items-center gap-2 px-4 sm:gap-3 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={openMobile}
          aria-label="Open navigation menu"
          aria-controls="admin-mobile-nav"
          className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-cpc-tile-border/70 bg-white text-cpc-heading-soft transition-colors hover:bg-cpc-section-light hover:text-cpc-navy-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent lg:hidden"
        >
          <Menu className="h-5 w-5" aria-hidden />
        </button>

        <div className="min-w-0 flex-1 lg:flex-none">
          <Breadcrumbs />
        </div>

        <div className="hidden min-w-0 flex-1 justify-center px-2 md:flex">
          <button
            type="button"
            onClick={onOpenSearch}
            className="group flex h-10 w-full min-w-0 max-w-md cursor-pointer items-center gap-2 rounded-xl border border-cpc-tile-border/80 bg-cpc-section-light/40 px-3 text-left transition-colors hover:bg-cpc-section-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
          >
            <Search className="h-4 w-4 shrink-0 text-cpc-heading-soft" aria-hidden />
            <span className="min-w-0 flex-1 truncate font-poppins text-xs text-cpc-heading-soft">
              Search students, requests...
            </span>
            <kbd className="ml-auto hidden shrink-0 items-center gap-0.5 rounded border border-cpc-tile-border bg-white px-1.5 py-0.5 font-poppins text-[10px] font-semibold text-cpc-heading-soft lg:inline-flex">
              Ctrl K
            </kbd>
          </button>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={onOpenSearch}
            aria-label="Search students and requests"
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-cpc-tile-border/70 bg-white text-cpc-heading-soft transition-colors hover:bg-cpc-section-light hover:text-cpc-navy-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent md:hidden"
          >
            <Search className="h-[18px] w-[18px]" aria-hidden />
          </button>

          {demoMode && (
            <div ref={demoRef} className="relative">
              <button
                type="button"
                onClick={() => setDemoOpen((current) => !current)}
                aria-expanded={demoOpen}
                aria-haspopup="menu"
                aria-label="Demo mode menu"
                className="flex h-10 cursor-pointer items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-2.5 font-poppins text-xs font-semibold text-amber-800 transition-colors hover:bg-amber-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600"
              >
                <Sparkles className="h-4 w-4" aria-hidden />
                <span className="hidden lg:inline">Demo</span>
                <ChevronDown
                  className={cn("h-3.5 w-3.5 transition-transform", demoOpen && "rotate-180")}
                  aria-hidden
                />
              </button>

              {demoOpen && (
                <div
                  role="menu"
                  aria-label="Demo mode"
                  className="admin-fade-in absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-cpc-tile-border bg-white shadow-[0_18px_50px_rgba(15,36,104,0.22)]"
                >
                  <div className="border-b border-cpc-tile-border/70 px-3 py-2.5">
                    <p className="font-poppins text-[10px] font-bold tracking-[0.14em] text-amber-700 uppercase">
                      Demo mode
                    </p>
                    <p className="mt-0.5 font-poppins text-[11px] leading-relaxed text-cpc-heading-soft">
                      Switch roles to preview permissions. Ctrl+Shift+D toggles demo mode.
                    </p>
                  </div>

                  <p className="px-3 pt-2 pb-1 font-poppins text-[10px] font-bold tracking-[0.14em] text-cpc-heading-soft uppercase">
                    Switch role
                  </p>
                  <ul className="px-1.5 pb-1">
                    {ALL_ROLES.map((role) => (
                      <li key={role}>
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => handleRole(role)}
                          className={cn(
                            "flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-left font-poppins text-xs transition-colors hover:bg-cpc-section-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent",
                            user.role === role
                              ? "font-semibold text-cpc-blue-accent"
                              : "text-cpc-navy-text",
                          )}
                        >
                          <span className="min-w-0 flex-1 truncate">{ROLE_LABELS[role]}</span>
                          {user.role === role && <Check className="h-3.5 w-3.5" aria-hidden />}
                        </button>
                      </li>
                    ))}
                  </ul>

                  <div className="border-t border-cpc-tile-border/70 p-1.5">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => void handleGenerate()}
                      disabled={demoBusy}
                      className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-left font-poppins text-xs font-medium text-cpc-navy-text transition-colors hover:bg-cpc-section-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {demoBusy ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                      ) : (
                        <Plus className="h-3.5 w-3.5" aria-hidden />
                      )}
                      Generate sample requests
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setDemoOpen(false);
                        setConfirmResetOpen(true);
                      }}
                      className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-left font-poppins text-xs font-medium text-rose-700 transition-colors hover:bg-rose-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600"
                    >
                      <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                      Reset demo data
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <AdminNotificationBell />

          <div ref={userRef} className="relative">
            <button
              type="button"
              onClick={() => setUserOpen((current) => !current)}
              aria-expanded={userOpen}
              aria-haspopup="menu"
              aria-label={`${user.name}. Open account menu`}
              className="flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-cpc-tile-border/70 bg-white px-1.5 transition-colors hover:bg-cpc-section-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent sm:pr-2.5"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-cpc-navy font-poppins text-[10px] font-semibold text-white">
                {user.initials}
              </span>
              <span className="hidden min-w-0 text-left lg:block">
                <span className="block max-w-[8rem] truncate font-poppins text-xs font-semibold text-cpc-navy-text">
                  {user.name}
                </span>
                <span className="block max-w-[8rem] truncate font-poppins text-[10px] text-cpc-heading-soft">
                  {user.title}
                </span>
              </span>
              <ChevronDown
                className={cn(
                  "hidden h-3.5 w-3.5 text-cpc-heading-soft transition-transform sm:block",
                  userOpen && "rotate-180",
                )}
                aria-hidden
              />
            </button>

            {userOpen && (
              <div
                role="menu"
                aria-label="Account menu"
                className="admin-fade-in absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-cpc-tile-border bg-white p-1.5 shadow-[0_18px_50px_rgba(15,36,104,0.22)]"
              >
                <div className="border-b border-cpc-tile-border/70 px-2.5 pt-1.5 pb-2">
                  <p className="truncate font-poppins text-xs font-semibold text-cpc-navy-text">
                    {user.name}
                  </p>
                  <p className="truncate font-poppins text-[10px] text-cpc-heading-soft">
                    {user.title}
                  </p>
                </div>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setUserOpen(false);
                    navigate("/admin/settings/profile");
                  }}
                  className="mt-1 flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-left font-poppins text-xs font-medium text-cpc-navy-text transition-colors hover:bg-cpc-section-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
                >
                  <User className="h-4 w-4 text-cpc-heading-soft" aria-hidden />
                  My profile
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setUserOpen(false);
                    setConfirmLogoutOpen(true);
                  }}
                  className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-left font-poppins text-xs font-medium text-rose-700 transition-colors hover:bg-rose-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600"
                >
                  <LogOut className="h-4 w-4" aria-hidden />
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmResetOpen}
        onClose={() => setConfirmResetOpen(false)}
        onConfirm={() => void handleReset()}
        title="Reset demo data?"
        description="This clears generated clearance requests, activity, notifications and the student's current clearance, then reseeds the demo. Saved signatures are kept."
        confirmLabel="Reset demo data"
        danger
        busy={demoBusy}
      />

      <ConfirmDialog
        open={confirmLogoutOpen}
        onClose={() => setConfirmLogoutOpen(false)}
        onConfirm={() => {
          setConfirmLogoutOpen(false);
          logout();
        }}
        title="Log out of the admin portal?"
        description="You'll be returned to the mock login screen. Your demo data stays saved."
        confirmLabel="Log out"
        danger
      />
    </header>
  );
}
