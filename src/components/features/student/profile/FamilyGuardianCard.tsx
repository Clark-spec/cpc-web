import { PhoneCall, User, UserRound, Users } from "lucide-react";
import type { ProfileCardProps } from "@/components/features/student/profile/types";
import { InfoRow, profileInputClass } from "@/components/features/student/profile/InfoRow";
import { ProfileSection } from "@/components/features/student/profile/ProfileSection";

export function FamilyGuardianCard({
  profile,
  editing,
  register,
  errors,
  highlighted,
}: ProfileCardProps) {
  return (
    <ProfileSection icon={Users} title="Family & Guardian" editing={editing}>
      {editing ? (
        <div className="divide-y divide-cpc-input-border/60">
          <InfoRow
            icon={UserRound}
            label="Mother's Name"
            htmlFor="profile-mother-name"
            required
            error={errors.motherName?.message}
            highlight={highlighted.has("motherName")}
          >
            <input
              id="profile-mother-name"
              autoComplete="off"
              aria-invalid={Boolean(errors.motherName)}
              aria-describedby={errors.motherName ? "profile-mother-name-error" : undefined}
              className={profileInputClass}
              {...register("motherName")}
            />
          </InfoRow>

          <InfoRow
            icon={User}
            label="Father's Name"
            htmlFor="profile-father-name"
            required
            error={errors.fatherName?.message}
            highlight={highlighted.has("fatherName")}
          >
            <input
              id="profile-father-name"
              autoComplete="off"
              aria-invalid={Boolean(errors.fatherName)}
              aria-describedby={errors.fatherName ? "profile-father-name-error" : undefined}
              className={profileInputClass}
              {...register("fatherName")}
            />
          </InfoRow>

          <InfoRow
            icon={Users}
            label="Guardian's Name"
            htmlFor="profile-guardian-name"
            required
            error={errors.guardianName?.message}
            highlight={highlighted.has("guardianName")}
          >
            <input
              id="profile-guardian-name"
              autoComplete="off"
              aria-invalid={Boolean(errors.guardianName)}
              aria-describedby={errors.guardianName ? "profile-guardian-name-error" : undefined}
              className={profileInputClass}
              {...register("guardianName")}
            />
          </InfoRow>

          <InfoRow
            icon={PhoneCall}
            label="Guardian's Contact"
            htmlFor="profile-guardian-contact"
            error={errors.guardianContact?.message}
            highlight={highlighted.has("guardianContact")}
          >
            <input
              id="profile-guardian-contact"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="Optional"
              aria-invalid={Boolean(errors.guardianContact)}
              aria-describedby={
                errors.guardianContact ? "profile-guardian-contact-error" : undefined
              }
              className={profileInputClass}
              {...register("guardianContact")}
            />
          </InfoRow>
        </div>
      ) : (
        <dl className="divide-y divide-cpc-input-border/60">
          <InfoRow
            icon={UserRound}
            label="Mother's Name"
            value={profile.motherName}
            highlight={highlighted.has("motherName")}
          />
          <InfoRow
            icon={User}
            label="Father's Name"
            value={profile.fatherName}
            highlight={highlighted.has("fatherName")}
          />
          <InfoRow
            icon={Users}
            label="Guardian's Name"
            value={profile.guardianName}
            highlight={highlighted.has("guardianName")}
          />
          <InfoRow
            icon={PhoneCall}
            label="Guardian's Contact"
            value={profile.guardianContact}
            highlight={highlighted.has("guardianContact")}
          />
        </dl>
      )}
    </ProfileSection>
  );
}
