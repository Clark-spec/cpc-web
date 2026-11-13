import { PROFILE_FORM_ID } from "@/components/features/student/profile/profile-constants";
import type { ProfileFormState } from "@/components/features/student/profile/useProfileForm";
import type { useProfileCompleteness } from "@/components/features/student/profile/useProfileCompleteness";
import { InfoBanner } from "@/components/features/student/profile/InfoBanner";
import { ProfileCompletenessCard } from "@/components/features/student/profile/ProfileCompletenessCard";
import { ProfileFormSection } from "@/components/features/student/profile/ProfileFormSection";
import { ProfileHeroCard } from "@/components/features/student/profile/ProfileHeroCard";
import type { ProfileCardProps } from "@/components/features/student/profile/types";

type ProfileReadyContentProps = {
  cardProps: ProfileCardProps;
  form: ProfileFormState;
  completeness: ReturnType<typeof useProfileCompleteness>;
  onAvatarChange: (value: string) => void;
};

/** The loaded profile: hero, completeness, editable cards, and the info banner. */
export function ProfileReadyContent({
  cardProps,
  form,
  completeness,
  onAvatarChange,
}: ProfileReadyContentProps) {
  const { profile, editing } = cardProps;

  return (
    <div className="space-y-5">
      <ProfileHeroCard
        profile={profile}
        editing={editing}
        saving={form.saving}
        canSave={form.canSave}
        saveStatus={form.saveStatus}
        formId={PROFILE_FORM_ID}
        avatarValue={editing ? form.watch("avatarUrl") : profile.avatarUrl}
        onAvatarChange={onAvatarChange}
        onEdit={() => form.startEditing()}
        onCancel={form.requestCancel}
      />

      <ProfileCompletenessCard
        percentage={completeness.percentage}
        nextMissing={completeness.nextMissing}
        onFix={(field) => form.startEditing(field)}
      />

      <ProfileFormSection
        cardProps={cardProps}
        formId={PROFILE_FORM_ID}
        onSubmit={form.submit}
      />

      <InfoBanner />
    </div>
  );
}
