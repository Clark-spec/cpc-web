import { Link } from "react-router";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { useAdminAuth } from "@/components/context/AdminAuthContext";
import { ComplaintsWorkspace } from "@/components/features/admin/complaints/ComplaintsWorkspace";
import { COMPLAINT_ADMIN_ROLES } from "@/lib/navigation";

export default function ComplaintsAdminPage() {
  const { user } = useAdminAuth();

  if (!user) return null;

  /*
   * Sidebar visibility is not a permission check: a role without Student
   * Support access can still type this URL. The backend rejects those accounts
   * with 403, and this guard keeps the page from rendering a broken queue.
   */
  if (!COMPLAINT_ADMIN_ROLES.includes(user.role)) {
    return (
      <div className="mx-auto flex w-full max-w-xl flex-col items-center rounded-2xl border border-cpc-tile-border/70 bg-white px-6 py-14 text-center shadow-[0_18px_50px_rgba(15,36,104,0.12)]">
        <span
          aria-hidden
          className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-600"
        >
          <ShieldAlert className="h-6 w-6" />
        </span>
        <h1 className="mt-4 font-poppins text-lg font-bold text-cpc-navy-text">
          You don&apos;t have access to Complaints
        </h1>
        <p className="mt-2 max-w-sm font-poppins text-xs leading-relaxed text-cpc-heading-soft">
          Complaints are handled by the Administrator, Registrar, SAO and the
          program Deans. Your account is not part of that group, so this page is
          unavailable.
        </p>
        <Link to="/admin/dashboard" className="cpc-btn cpc-btn-primary cpc-btn-sm mt-6">
          <ArrowLeft className="h-3.5 w-3.5 shrink-0" aria-hidden />
          Back to dashboard
        </Link>
      </div>
    );
  }

  return <ComplaintsWorkspace />;
}
