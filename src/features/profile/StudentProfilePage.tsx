import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronRight, CircleAlert, LoaderCircle, RefreshCw, Sparkles } from "lucide-react";
import { Link } from "react-router";
import { cn } from "@/lib/cn";
import { Layout } from "@/components/common/layout";
import { ToastProvider } from "@/components/ui/toast";
import {
  NotificationProvider,
  useNotifications,
} from "@/context/NotificationContext";
import { ProfileProvider, useProfile } from "./context/ProfileContext";
import { useProfileCompleteness } from "./hooks/useProfileCompleteness";
import { useProfileForm } from "./hooks/useProfileForm";
import { useUnsavedChangesGuard } from "./hooks/useUnsavedChangesGuard";
import { ProfileSkeleton } from "./components/Skeleton";
import { ProfileHeroCard } from "./components/ProfileHeroCard";
import { ProfileCompletenessCard } from "./components/ProfileCompletenessCard";
import { ContactInfoCard } from "./components/ContactInfoCard";
import { PersonalInfoCard } from "./components/PersonalInfoCard";
import { FamilyGuardianCard } from "./components/FamilyGuardianCard";
import { InfoBanner } from "./components/InfoBanner";
import { EditActionBar } from "./components/EditActionBar";
import { ConfirmDialog } from "./components/ConfirmDialog";
import { RequestCorrectionModal } from "./components/RequestCorrectionModal";
import { NotificationBell } from "./components/NotificationBell";
import type { EditableField } from "./types";

/** Each feature keeps its own persisted notification feed. */
const PROFILE_NOTIFICATIONS_KEY = "cpc.student-profile.notifications.v1";
const PROFILE_FORM_ID = "student-profile-form";

/** Route: /my-account/profile (student side only). */
export default function StudentProfilePage() {
  return (
    <ToastProvider>
      <NotificationProvider storageKey={PROFILE_NOTIFICATIONS_KEY}>
        <ProfileProvider>
          <StudentProfileContent />
        </ProfileProvider>
      </NotificationProvider>
    </ToastProvider>
  );
}

function StudentProfileContent() {
  const {
    profile,
    status,
    error,
    isEditing,
    reload,
    resetDemo,
    highlighted,
  } = useProfile();
  const { resetNotifications } = useNotifications();

  const {
    register,
    errors,
    isDirty,
    canSave,
    saving,
    confirmOpen,
    setConfirmOpen,
    startEditing,
    requestCancel,
    confirmDiscard,
    submit,
    announcement,
    setAnnouncement,
    watch,
    setValue,
  } = useProfileForm();

  // Warn on refresh/close and block in-app navigation while edits are pending.
  const blocker = useUnsavedChangesGuard(isEditing && isDirty);
  const completeness = useProfileCompleteness(profile);

  const [demoMode, setDemoMode] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [correctionField, setCorrectionField] = useState<string | null>(null);

  // Ctrl/Cmd + Shift + D toggles the demo panel.
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (
        (event.ctrlKey || event.metaKey) &&
        event.shiftKey &&
        event.key.toLowerCase() === "d"
      ) {
        event.preventDefault();
        setDemoMode((previous) => !previous);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const highlightedFields = useMemo(
    () => new Set<EditableField>(highlighted),
    [highlighted],
  );

  const handleAvatarChange = useCallback(
    (value: string) => {
      setValue("avatarUrl", value, { shouldDirty: true, shouldValidate: true });
    },
    [setValue],
  );

  const handleResetDemo = useCallback(async () => {
    setResetting(true);
    try {
      await resetDemo();
      resetNotifications();
      setAnnouncement("Demo data reset. The original profile has been restored.");
    } finally {
      setResetting(false);
    }
  }, [resetDemo, resetNotifications, setAnnouncement]);

  const openCorrection = useCallback((fieldLabel: string) => {
    setCorrectionField(fieldLabel);
  }, []);

  return (
    <Layout bell={<NotificationBell />}>
      <div
        className={cn(
          "mx-auto w-full max-w-[1280px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7",
          isEditing && "pb-28 lg:pb-8",
        )}
      >
        {/* Screen-reader status for edit / save / validation announcements. */}
        <p role="status" aria-live="polite" className="sr-only">
          {announcement}
        </p>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-1.5 font-poppins text-xs text-cpc-heading-soft">
              <li className="flex items-center gap-1.5">
                <Link
                  to="/student/home"
                  className="rounded transition-colors hover:text-cpc-navy-text hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
                >
                  Home
                </Link>
                <ChevronRight className="h-3 w-3 text-cpc-muted-blue" aria-hidden />
              </li>
              <li className="flex items-center gap-1.5">
                <span>My Account</span>
                <ChevronRight className="h-3 w-3 text-cpc-muted-blue" aria-hidden />
              </li>
              <li>
                <span aria-current="page" className="font-semibold text-cpc-navy-text">
                  Student Profile
                </span>
              </li>
            </ol>
          </nav>

          <button
            type="button"
            onClick={() => setDemoMode((previous) => !previous)}
            aria-pressed={demoMode}
            title="Toggle with Ctrl+Shift+D"
            className={cn(
              "inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 font-poppins text-[11px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent",
              demoMode
                ? "border-cpc-blue-accent bg-cpc-blue-accent text-white"
                : "border-cpc-tile-border bg-white text-cpc-heading-soft hover:bg-cpc-section-light",
            )}
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            Demo mode
          </button>
        </div>

        {demoMode && (
          <div
            role="status"
            className="mb-4 flex flex-col gap-3 rounded-xl border border-cpc-tile-border bg-cpc-section-light px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
          >
            <p className="font-poppins text-xs leading-relaxed text-cpc-label">
              <span className="font-semibold">Demo mode is on.</span> Reset the profile to the
              original mock data at any time. Try <code>?fail=1</code> to simulate a failed save.
            </p>
            <button
              type="button"
              onClick={() => void handleResetDemo()}
              disabled={resetting}
              className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-cpc-tile-border bg-white px-3 py-1.5 font-poppins text-xs font-semibold text-cpc-blue-accent transition-colors hover:bg-cpc-bg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent disabled:cursor-wait disabled:opacity-60"
            >
              {resetting ? (
                <LoaderCircle
                  className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none"
                  aria-hidden
                />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" aria-hidden />
              )}
              {resetting ? "Resetting…" : "Reset demo data"}
            </button>
          </div>
        )}

        {status === "loading" && <ProfileSkeleton />}

        {status === "error" && (
          <section
            role="alert"
            className="rounded-2xl border border-rose-200 bg-white p-6 text-center shadow-[0_10px_30px_rgba(27,47,158,0.06)] sm:p-10"
          >
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
              <CircleAlert className="h-6 w-6" aria-hidden />
            </span>
            <h1 className="mt-4 font-poppins text-xl font-bold text-cpc-navy-text">
              We couldn't load your profile
            </h1>
            <p className="mx-auto mt-2 max-w-md font-poppins text-sm leading-relaxed text-cpc-heading-soft">
              {error ?? "Please check your connection and try again."}
            </p>
            <button
              type="button"
              onClick={reload}
              className="mt-5 inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-cpc-navy px-5 py-2.5 font-poppins text-sm font-semibold text-white transition-colors hover:bg-cpc-navy-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
            >
              <RefreshCw className="h-4 w-4" aria-hidden />
              Retry
            </button>
          </section>
        )}

        {status === "ready" && profile && (
          <div className="space-y-5">
            <ProfileHeroCard
              profile={profile}
              editing={isEditing}
              saving={saving}
              canSave={canSave}
              formId={PROFILE_FORM_ID}
              avatarValue={isEditing ? watch("avatarUrl") : profile.avatarUrl}
              onAvatarChange={handleAvatarChange}
              onEdit={() => startEditing()}
              onCancel={requestCancel}
            />

            <ProfileCompletenessCard
              percentage={completeness.percentage}
              nextMissing={completeness.nextMissing}
              onFix={(field) => startEditing(field)}
            />

            {/* Edit flow step 2: one <form> wraps the editable cards. */}
            <form id={PROFILE_FORM_ID} onSubmit={submit} noValidate className="space-y-5">
              <div className="grid gap-5 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.28fr)]">
                <ContactInfoCard
                  profile={profile}
                  editing={isEditing}
                  register={register}
                  errors={errors}
                  highlighted={highlightedFields}
                  onRequestCorrection={openCorrection}
                />

                <div className="space-y-5">
                  <PersonalInfoCard
                    profile={profile}
                    editing={isEditing}
                    register={register}
                    errors={errors}
                    highlighted={highlightedFields}
                    onRequestCorrection={openCorrection}
                  />
                  <FamilyGuardianCard
                    profile={profile}
                    editing={isEditing}
                    register={register}
                    errors={errors}
                    highlighted={highlightedFields}
                    onRequestCorrection={openCorrection}
                  />
                </div>
              </div>
            </form>

            <InfoBanner />
          </div>
        )}
      </div>

      {/* Mobile / tablet sticky action bar. Desktop actions live in the hero. */}
      {isEditing && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-cpc-input-border bg-white/95 px-4 py-3 shadow-[0_-8px_24px_rgba(15,36,104,0.12)] backdrop-blur-sm lg:hidden">
          <EditActionBar
            formId={PROFILE_FORM_ID}
            saving={saving}
            canSave={canSave}
            onCancel={requestCancel}
          />
        </div>
      )}

      {/* Cancel with unsaved edits. */}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmDiscard}
        title="Discard your changes?"
        description="Your edits haven't been saved yet. Discard them and return to view mode?"
      />

      {/* In-app navigation guard (React Router blocker). */}
      <ConfirmDialog
        open={blocker.state === "blocked"}
        onClose={() => blocker.reset?.()}
        onConfirm={() => blocker.proceed?.()}
        title="Leave without saving?"
        description="You have unsaved profile changes. If you leave this page now, your edits will be lost."
        confirmLabel="Leave page"
        cancelLabel="Stay on page"
      />

      <RequestCorrectionModal
        open={correctionField !== null}
        onClose={() => setCorrectionField(null)}
        fieldLabel={correctionField ?? ""}
      />
    </Layout>
  );
}
