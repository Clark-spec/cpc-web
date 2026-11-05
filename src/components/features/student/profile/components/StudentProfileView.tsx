import { useCallback, useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { StudentLayout } from "@/layouts/StudentLayout";
import { useNotifications } from "@/context/NotificationContext";
import { useProfile } from "../context/ProfileContext";
import { useDemoModeToggle } from "../hooks/useDemoModeToggle";
import { useProfileCompleteness } from "../hooks/useProfileCompleteness";
import { useProfileForm } from "../hooks/useProfileForm";
import { useUnsavedChangesGuard } from "../hooks/useUnsavedChangesGuard";
import { PROFILE_FORM_ID } from "../profile-constants";
import type { EditableField } from "../types";
import { NotificationBell } from "./NotificationBell";
import { ProfileDialogs } from "./ProfileDialogs";
import { ProfileDemoPanel } from "./ProfileDemoPanel";
import { ProfileEditActionDock } from "./ProfileEditActionDock";
import { ProfileErrorState } from "./ProfileErrorState";
import { ProfilePageHeader } from "./ProfilePageHeader";
import { ProfileReadyContent } from "./ProfileReadyContent";
import { ProfileSkeleton } from "./Skeleton";

/**
 * Stateful container: the profile, form, completeness and blocker hooks each
 * own instance state, so they are called here once and threaded down as props.
 */
export function StudentProfileView() {
  const { profile, status, error, isEditing, reload, resetDemo, highlighted } =
    useProfile();
  const { resetNotifications } = useNotifications();

  const form = useProfileForm();
  const { setAnnouncement, setValue } = form;

  // Warn on refresh/close and block in-app navigation while edits are pending.
  const blocker = useUnsavedChangesGuard(isEditing && form.isDirty);
  const completeness = useProfileCompleteness(profile);

  const { demoMode, toggleDemoMode } = useDemoModeToggle();
  const [resetting, setResetting] = useState(false);
  const [correctionField, setCorrectionField] = useState<string | null>(null);

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

  const closeCorrection = useCallback(() => setCorrectionField(null), []);

  return (
    <StudentLayout bell={<NotificationBell />}>
      <div
        className={cn(
          "mx-auto w-full max-w-[1280px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7",
          isEditing && "pb-28 lg:pb-8",
        )}
      >
        {/* Screen-reader status for edit / save / validation announcements. */}
        <p role="status" aria-live="polite" className="sr-only">
          {form.announcement}
        </p>

        <ProfilePageHeader demoMode={demoMode} onToggleDemoMode={toggleDemoMode} />

        <ProfileDemoPanel
          demoMode={demoMode}
          resetting={resetting}
          onReset={() => void handleResetDemo()}
        />

        {status === "loading" && <ProfileSkeleton />}

        {status === "error" && (
          <ProfileErrorState error={error} onRetry={reload} />
        )}

        {status === "ready" && profile && (
          <ProfileReadyContent
            cardProps={{
              profile,
              editing: isEditing,
              register: form.register,
              errors: form.errors,
              highlighted: highlightedFields,
              onRequestCorrection: openCorrection,
            }}
            form={form}
            completeness={completeness}
            onAvatarChange={handleAvatarChange}
          />
        )}
      </div>

      <ProfileEditActionDock
        editing={isEditing}
        formId={PROFILE_FORM_ID}
        saving={form.saving}
        canSave={form.canSave}
        onCancel={form.requestCancel}
      />

      <ProfileDialogs
        form={form}
        blocker={blocker}
        correctionField={correctionField}
        onCloseCorrection={closeCorrection}
      />
    </StudentLayout>
  );
}
