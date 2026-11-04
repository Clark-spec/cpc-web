import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";
import cpcBg from "@/assets/cpc-bg.png";
import { PortalFooter } from "@/components/common/portal-footer";
import { PortalHeader } from "@/components/common/portal-header";
import { PageHeroBanner } from "@/components/features/online-enrollment/components/PageHeroBanner";
import { ToastProvider } from "./components/Toast";
import { ClearanceSkeleton } from "./components/Skeleton";
import { ClearanceStatusCard } from "./components/ClearanceStatusCard";
import { ClearanceConfirmationCard } from "./components/ClearanceConfirmationCard";
import { ClearanceForm } from "./components/ClearanceForm";
import { OfficeSignatureGrid } from "./components/OfficeSignatureGrid";
import { ClearanceHistory } from "./components/ClearanceHistory";
import { NotificationBell } from "./components/NotificationBell";
import { DemoStaffPanel } from "./components/DemoStaffPanel";
import { ClearanceProvider, useClearance } from "./context/ClearanceContext";
import { NotificationProvider } from "./context/NotificationContext";

/** Route: /student-services/online-clearance */
export default function ClearancePage() {
  return (
    <ToastProvider>
      <NotificationProvider>
        <ClearanceProvider>
          <ClearancePageContent />
        </ClearanceProvider>
      </NotificationProvider>
    </ToastProvider>
  );
}

function ClearancePageContent() {
  const { demoMode, toggleDemoMode } = useClearance();
  const [initializing, setInitializing] = useState(true);

  // Skeleton on first paint (~800 ms), matching the rest of the portal.
  useEffect(() => {
    const timer = window.setTimeout(() => setInitializing(false), 800);
    return () => window.clearTimeout(timer);
  }, []);

  // Ctrl/Cmd + Shift + D toggles demo mode.
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === "d") {
        event.preventDefault();
        toggleDemoMode();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [toggleDemoMode]);

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-white font-poppins">
      <PortalHeader bell={<NotificationBell />} />

      <main>
        {/* Shared system hero banner, re-used with clearance content. */}
        <PageHeroBanner
          breadcrumbItems={[
            { label: "Home", href: "/" },
            { label: "Student Services", href: "/student/home" },
            { label: "Online Clearance", href: null },
          ]}
          eyebrow="STUDENT SERVICE"
          title="ONLINE CLEARANCE"
          subtitle="Complete your clearance requirements digitally and track each office's approval."
          backgroundImage={cpcBg}
        />

        <div className="mx-auto w-full max-w-[1280px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {/* Demo controls (the staff panel itself floats bottom-right). */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <p className="font-poppins text-xs text-cpc-heading-soft">
              {demoMode
                ? "Demo mode is on — use the staff panel to approve or reject requests."
                : "Staff responses are simulated for this demo."}
            </p>

            <button
              type="button"
              role="switch"
              aria-checked={demoMode}
              onClick={toggleDemoMode}
              title="Toggle with Ctrl+Shift+D"
              className={cn(
                "inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-2 font-poppins text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent",
                demoMode
                  ? "border-cpc-blue-accent bg-cpc-blue-accent text-white"
                  : "border-cpc-tile-border bg-white text-cpc-label hover:bg-cpc-section-light",
              )}
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              Demo mode
              <span
                aria-hidden
                className={cn(
                  "relative h-4 w-7 rounded-full transition-colors",
                  demoMode ? "bg-white/35" : "bg-cpc-tile-border",
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 h-3 w-3 rounded-full bg-white shadow-sm transition-all",
                    demoMode ? "left-3.5" : "left-0.5",
                  )}
                />
              </span>
            </button>
          </div>

          {demoMode && (
            <div
              role="status"
              className="mb-4 flex items-start gap-2 rounded-lg border border-cpc-tile-border bg-cpc-section-light px-3 py-2.5"
            >
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-cpc-blue-accent" aria-hidden />
              <p className="font-poppins text-xs leading-relaxed text-cpc-label">
                <span className="font-semibold">Demo mode is on.</span> Request a signature as the
                student, then approve or reject it in the floating staff panel. All six approvals
                unlock the confirmation slip.
              </p>
            </div>
          )}

          {initializing ? (
            <ClearanceSkeleton />
          ) : (
            <div className="space-y-6">
              <div className="grid gap-4 lg:grid-cols-[1.55fr_1fr]">
                <ClearanceStatusCard />
                <ClearanceConfirmationCard />
              </div>

              <ClearanceForm />
              <OfficeSignatureGrid />
              <ClearanceHistory />
            </div>
          )}
        </div>
      </main>

      <PortalFooter />
      <DemoStaffPanel />
    </div>
  );
}
