import { useRef, useState } from "react";
import { useNavigate } from "react-router";
import { ChevronDown, LogOut, User } from "lucide-react";
import { cn } from "@/lib/cn";
import { useClickOutside } from "../hooks/useClickOutside";
import { useAdminAuth } from "../context/AdminAuthContext";
import { ConfirmDialog } from "../components/ConfirmDialog";

type SidebarUserCardProps = {
  collapsed: boolean;
  onNavigate?: () => void;
};

export function SidebarUserCard({ collapsed, onNavigate }: SidebarUserCardProps) {
  const { user, logout } = useAdminAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useClickOutside(wrapperRef, () => setOpen(false), open);

  if (!user) return null;

  const goToProfile = () => {
    setOpen(false);
    onNavigate?.();
    navigate("/admin/settings/profile");
  };

  const handleLogout = () => {
    setConfirmOpen(false);
    setOpen(false);
    logout();
  };

  return (
    <div ref={wrapperRef} className="relative mt-2">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${user.name}, ${user.title}. Open account menu`}
        className={cn(
          "flex w-full cursor-pointer items-center rounded-xl border border-cpc-tile-border/70 bg-cpc-section-light/40 transition-colors hover:bg-cpc-section-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent",
          collapsed ? "justify-center p-2" : "gap-2.5 p-2.5 text-left",
        )}
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cpc-navy font-poppins text-xs font-semibold text-white">
          {user.initials}
        </span>

        {!collapsed && (
          <>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-poppins text-xs font-semibold text-cpc-navy-text">
                {user.name}
              </span>
              <span className="block truncate font-poppins text-[10px] text-cpc-heading-soft">
                {user.title}
              </span>
            </span>
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 shrink-0 text-cpc-heading-soft transition-transform",
                open && "rotate-180",
              )}
              aria-hidden
            />
          </>
        )}
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Account menu"
          className={cn(
            "absolute z-[70] overflow-hidden rounded-xl border border-cpc-tile-border bg-white p-1.5 shadow-[0_18px_50px_rgba(15,36,104,0.22)] admin-fade-in",
            collapsed
              ? "bottom-0 left-full ml-2 w-56"
              : "right-0 bottom-full mb-2 left-0",
          )}
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
            onClick={goToProfile}
            className="mt-1 flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-left font-poppins text-xs font-medium text-cpc-navy-text transition-colors hover:bg-cpc-section-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
          >
            <User className="h-4 w-4 text-cpc-heading-soft" aria-hidden />
            My profile
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              setConfirmOpen(true);
            }}
            className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-left font-poppins text-xs font-medium text-rose-700 transition-colors hover:bg-rose-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            Log out
          </button>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleLogout}
        title="Log out of the admin portal?"
        description="You'll be returned to the mock login screen. Your demo data stays saved."
        confirmLabel="Log out"
        danger
      />
    </div>
  );
}
