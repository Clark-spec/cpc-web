import {
  CalendarDays,
  Church,
  Flag,
  Heart,
  MapPin,
  Mars,
  User,
  UserRound,
  Venus,
} from "lucide-react";
import { CIVIL_STATUS_OPTIONS } from "@/components/features/student/profile/schema";
import { formatLongDate } from "@/components/features/student/profile/format";
import type { ProfileCardProps } from "@/components/features/student/profile/types";
import { InfoRow, profileInputClass } from "@/components/features/student/profile/InfoRow";
import { ProfileSection } from "@/components/features/student/profile/ProfileSection";

export function PersonalInfoCard({
  profile,
  editing,
  register,
  errors,
  highlighted,
  onRequestCorrection,
}: ProfileCardProps) {
  const GenderIcon =
    profile.gender === "Female" ? Venus : profile.gender === "Male" ? Mars : UserRound;

  const readOnlyRows = (
    <>
      <InfoRow
        icon={User}
        label="Full Name"
        value={profile.fullName}
        editing={editing}
        readOnly
        onRequestCorrection={editing ? () => onRequestCorrection("Full Name") : undefined}
      />
      <InfoRow
        icon={GenderIcon}
        label="Gender"
        value={profile.gender}
        editing={editing}
        readOnly
        onRequestCorrection={editing ? () => onRequestCorrection("Gender") : undefined}
      />
      <InfoRow
        icon={CalendarDays}
        label="Date of Birth"
        value={formatLongDate(profile.dateOfBirth)}
        editing={editing}
        readOnly
        onRequestCorrection={editing ? () => onRequestCorrection("Date of Birth") : undefined}
      />
      <InfoRow
        icon={MapPin}
        label="Place of Birth"
        value={profile.placeOfBirth}
        editing={editing}
        readOnly
        onRequestCorrection={editing ? () => onRequestCorrection("Place of Birth") : undefined}
      />
    </>
  );

  return (
    <ProfileSection icon={User} title="Personal Information" editing={editing}>
      <div className="grid gap-x-8 gap-y-1 sm:grid-cols-2">
        {editing ? (
          <div className="divide-y divide-cpc-input-border/60">{readOnlyRows}</div>
        ) : (
          <dl className="divide-y divide-cpc-input-border/60">{readOnlyRows}</dl>
        )}

        <div className="divide-y divide-cpc-input-border/60">
          {editing ? (
            <>
              <InfoRow
                icon={Heart}
                label="Civil Status"
                htmlFor="profile-civil-status"
                required
                error={errors.civilStatus?.message}
                highlight={highlighted.has("civilStatus")}
              >
                <select
                  id="profile-civil-status"
                  aria-invalid={Boolean(errors.civilStatus)}
                  aria-describedby={errors.civilStatus ? "profile-civil-status-error" : undefined}
                  className={profileInputClass}
                  {...register("civilStatus")}
                >
                  {CIVIL_STATUS_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </InfoRow>

              <InfoRow
                icon={Church}
                label="Religion"
                htmlFor="profile-religion"
                required
                error={errors.religion?.message}
                highlight={highlighted.has("religion")}
              >
                <input
                  id="profile-religion"
                  autoComplete="off"
                  aria-invalid={Boolean(errors.religion)}
                  aria-describedby={errors.religion ? "profile-religion-error" : undefined}
                  className={profileInputClass}
                  {...register("religion")}
                />
              </InfoRow>

              <InfoRow
                icon={Flag}
                label="Nationality"
                htmlFor="profile-nationality"
                required
                error={errors.nationality?.message}
                highlight={highlighted.has("nationality")}
              >
                <input
                  id="profile-nationality"
                  autoComplete="country-name"
                  aria-invalid={Boolean(errors.nationality)}
                  aria-describedby={
                    errors.nationality ? "profile-nationality-error" : undefined
                  }
                  className={profileInputClass}
                  {...register("nationality")}
                />
              </InfoRow>
            </>
          ) : (
            <dl className="divide-y divide-cpc-input-border/60">
              <InfoRow
                icon={Heart}
                label="Civil Status"
                value={profile.civilStatus}
                highlight={highlighted.has("civilStatus")}
              />
              <InfoRow
                icon={Church}
                label="Religion"
                value={profile.religion}
                highlight={highlighted.has("religion")}
              />
              <InfoRow
                icon={Flag}
                label="Nationality"
                value={profile.nationality}
                highlight={highlighted.has("nationality")}
              />
            </dl>
          )}
        </div>
      </div>
    </ProfileSection>
  );
}
