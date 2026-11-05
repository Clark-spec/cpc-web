import { useState } from "react";
import { Outlet, useLocation } from "react-router";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import "@/styles/admin.css";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { useSidebar } from "@/context/SidebarContext";
import { useHotkeys } from "@/admin/hooks/useHotkeys";
import { CommandPalette } from "@/components/ui/admin/CommandPalette";
import { MobileDrawer } from "@/components/ui/admin/MobileDrawer";
import { Sidebar } from "@/components/ui/admin/Sidebar";
import { AdminNavbar } from "@/components/common/navbar/AdminNavbar";

/**
 * Shell for every protected admin page: fixed sidebar, sticky top bar, and the
 * routed page in <main>. Global shortcuts live here so they work on any page.
 */
export function AdminLayout() {
  const { collapsed } = useSidebar();
  const { toggleDemoMode, demoMode } = useAdminAuth();
  const { toast } = useToast();
  const { pathname } = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);

  useHotkeys({
    "ctrl+k": (event) => {
      event.preventDefault();
      setSearchOpen(true);
    },
    "ctrl+shift+d": (event) => {
      event.preventDefault();
      toggleDemoMode();
      toast(
        demoMode ? "Demo mode turned off." : "Demo mode turned on. Use the Demo menu to switch roles.",
        "info",
      );
    },
  });

  return (
    <div className="min-h-screen w-full bg-cpc-section-light/40 font-poppins">
      <a
        href="#admin-main"
        className="sr-only z-[100] rounded-md bg-cpc-navy px-4 py-2 font-poppins text-sm font-semibold text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
      >
        Skip to main content
      </a>

      <Sidebar />
      <MobileDrawer />

      <div
        className={cn(
          "flex min-h-screen min-w-0 flex-col transition-[padding] duration-200",
          collapsed ? "lg:pl-20" : "lg:pl-[280px]",
        )}
      >
        <AdminNavbar onOpenSearch={() => setSearchOpen(true)} />

        <main
          id="admin-main"
          tabIndex={-1}
          key={pathname}
          className="admin-fade-in mx-auto w-full max-w-[1440px] flex-1 px-4 py-5 outline-none sm:px-6 sm:py-6 lg:px-8"
        >
          <Outlet />
        </main>
      </div>

      {searchOpen && <CommandPalette onClose={() => setSearchOpen(false)} />}
    </div>
  );
}
