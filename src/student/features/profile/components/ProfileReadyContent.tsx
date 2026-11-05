import { PROFILE_FORM_ID } from "../profile-constants";
import type { ProfileFormState } from "../hooks/useProfileForm";
import type { useProfileCompleteness } from "../hooks/useProfileCompleteness";
import { InfoBanner } from "./InfoBanner";
import { ProfileCompletenessCard } from "./ProfileCompletenessCard";
import { ProfileFormSection } from "./ProfileFormSection";
import { ProfileHeroCard } from "./ProfileHeroCard";
import type { ProfileCardProps } from "../types";

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
