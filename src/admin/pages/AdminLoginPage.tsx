import { useState } from "react";
import { Link, Navigate } from "react-router";
import {
  ArrowRight,
  Building2,
  Check,
  Loader2,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import cpcLogo from "@/assets/cpc-logo.jpg";
import { cn } from "@/lib/cn";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { ADMIN_USERS, ALL_ROLES, ROLE_LABELS, ROLE_OFFICES } from "@/config/navigation";
import type { AdminRole } from "@/types/admin";

const OFFICE_NAMES: Record<string, string> = {
  registrar: "Registrar's Office",
  dean: "Office of the Dean",
  library: "Library",
  accounting: "Accounting Office",
  sao: "Student Affairs Office",
  instructor: "Faculty",
};

/** Route: /admin/login — mock role-selector sign in. */
export default function AdminLoginPage() {
  const { user, login } = useAdminAuth();
  const [role, setRole] = useState<AdminRole>("admin");
  const [busy, setBusy] = useState(false);

  if (user) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const selected = ADMIN_USERS[role];

  const handleLogin = () => {
    setBusy(true);
    // Give the button a beat so the mock sign-in feels like a request.
    window.setTimeout(() => login(role), 350);
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-cpc-section-light/40 font-poppins lg:flex-row">
      {/* Brand panel */}
      <section className="relative flex flex-col justify-between overflow-hidden bg-cpc-navy-deep px-6 py-8 text-white sm:px-10 lg:w-[44%] lg:py-12">
        <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-cpc-blue-accent/30 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-cpc-muted-blue/20 blur-3xl" />

        <div className="relative z-10 flex items-center gap-3">
          <img src={cpcLogo} alt="" className="h-12 w-12 rounded-full object-cover" />
          <div>
            <p className="font-poppins text-sm font-bold">Cordova Public College</p>
            <p className="font-poppins text-[11px] tracking-[0.1em] text-white/70">
              SERVIRE POPULUM
            </p>
          </div>
        </div>

        <div className="relative z-10 mt-10 max-w-md lg:mt-0">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 font-poppins text-[10px] font-semibold tracking-[0.12em] uppercase">
            <ShieldCheck className="h-3 w-3" aria-hidden />
            Admin & Staff Portal
          </span>
          <h1 className="mt-4 font-poppins text-3xl leading-tight font-bold sm:text-4xl">
            One workspace for enrollment, clearance and student services.
          </h1>
          <p className="mt-3 font-poppins text-sm leading-relaxed text-white/75">
            Review applications, sign clearances and keep students updated — with access scoped to
            your office.
          </p>

          <ul className="mt-6 space-y-2.5">
            {[
              "Role-aware navigation and queues",
              "Draw, type or upload your signature",
              "Live updates shared with the student portal",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 font-poppins text-xs text-white/85">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 mt-10 font-poppins text-[10px] text-white/50 lg:mt-0">
          Demo environment · No real student records are used.
        </p>
      </section>

      {/* Login card */}
      <section className="flex flex-1 items-center justify-center px-4 py-8 sm:px-8">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-cpc-tile-border/70 bg-white p-5 shadow-[0_18px_50px_rgba(15,36,104,0.10)] sm:p-6">
            <div className="flex items-start gap-2.5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cpc-section-light text-cpc-blue-accent">
                <LockKeyhole className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <h2 className="font-poppins text-lg font-semibold text-cpc-navy-text">
                  Sign in
                </h2>
                <p className="font-poppins text-[11px] leading-relaxed text-cpc-heading-soft">
                  Choose a demo role. Each role sees only its own offices and tools.
                </p>
              </div>
            </div>

            <fieldset className="mt-4">
              <legend className="font-poppins text-[10px] font-bold tracking-[0.12em] text-cpc-heading-soft uppercase">
                Demo role
              </legend>
              <div className="admin-scrollbar mt-1.5 max-h-72 space-y-1 overflow-y-auto pr-0.5">
                {ALL_ROLES.map((entry) => {
                  const active = role === entry;
                  const account = ADMIN_USERS[entry];
                  const office = ROLE_OFFICES[entry];

                  return (
                    <label
                      key={entry}
                      className={cn(
                        "flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2 transition-colors",
                        active
                          ? "border-cpc-blue-accent bg-cpc-section-light/60"
                          : "border-cpc-tile-border/70 bg-white hover:bg-cpc-section-light/30",
                      )}
                    >
                      <input
                        type="radio"
                        name="admin-role"
                        value={entry}
                        checked={active}
                        onChange={() => setRole(entry)}
                        className="sr-only"
                      />
                      <span
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-poppins text-[10px] font-semibold",
                          active ? "bg-cpc-navy text-white" : "bg-cpc-section-light text-cpc-blue-accent",
                        )}
                      >
                        {account.initials}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-poppins text-xs font-semibold text-cpc-navy-text">
                          {ROLE_LABELS[entry]}
                        </span>
                        <span className="block truncate font-poppins text-[10px] text-cpc-heading-soft">
                          {account.name} · {office ? OFFICE_NAMES[office] : "All offices"}
                        </span>
                      </span>
                      {active && <Check className="h-4 w-4 shrink-0 text-cpc-blue-accent" aria-hidden />}
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <div className="mt-3 rounded-lg bg-cpc-section-light/50 px-3 py-2">
              <p className="flex items-center gap-1.5 font-poppins text-[10px] text-cpc-heading-soft">
                <Building2 className="h-3 w-3 shrink-0 text-cpc-blue-accent" aria-hidden />
                Signing in as <strong className="font-semibold text-cpc-navy-text">{selected.name}</strong>
                {selected.office ? ` · ${OFFICE_NAMES[selected.office]}` : " · full access"}
              </p>
            </div>

            <button
              type="button"
              onClick={handleLogin}
              disabled={busy}
              className="mt-3 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-cpc-button px-4 py-2.5 font-poppins text-sm font-semibold text-white transition-colors hover:bg-cpc-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent disabled:cursor-not-allowed disabled:opacity-70"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Sparkles className="h-4 w-4" aria-hidden />
              )}
              {busy ? "Signing in..." : `Continue as ${ROLE_LABELS[role]}`}
              {!busy && <ArrowRight className="h-4 w-4" aria-hidden />}
            </button>

            <p className="mt-3 text-center font-poppins text-[10px] leading-relaxed text-cpc-heading-soft">
              This is a mock sign-in for the demo. In production this screen uses the school&apos;s
              single sign-on.
            </p>
          </div>

          <div className="mt-4 flex items-center justify-center gap-3">
            <Link
              to="/login/student"
              className="font-poppins text-[11px] font-semibold text-cpc-blue-accent underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
            >
              Student portal
            </Link>
            <span aria-hidden className="h-3 w-px bg-cpc-tile-border" />
            <Link
              to="/login/staff"
              className="font-poppins text-[11px] font-semibold text-cpc-blue-accent underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
            >
              Staff login
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
