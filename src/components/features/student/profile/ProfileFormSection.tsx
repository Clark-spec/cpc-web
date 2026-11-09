import type { ProfileCardProps } from "@/components/features/student/profile/types";
import type { ProfileFormState } from "@/components/features/student/profile/useProfileForm";
import { ContactInfoCard } from "@/components/features/student/profile/ContactInfoCard";
import { FamilyGuardianCard } from "@/components/features/student/profile/FamilyGuardianCard";
import { PersonalInfoCard } from "@/components/features/student/profile/PersonalInfoCard";

type ProfileFormSectionProps = {
  cardProps: ProfileCardProps;
  formId: string;
  onSubmit: ProfileFormState["submit"];
};

/** Edit flow step 2: one <form> wraps the editable cards. */
export function ProfileFormSection({ cardProps, formId, onSubmit }: ProfileFormSectionProps) {
  return (
    <form id={formId} onSubmit={onSubmit} noValidate className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.28fr)]">
        <ContactInfoCard {...cardProps} />

        <div className="space-y-5">
          <PersonalInfoCard {...cardProps} />
          <FamilyGuardianCard {...cardProps} />
        </div>
      </div>
    </form>
  );
}
