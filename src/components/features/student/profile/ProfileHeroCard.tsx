import { Pencil } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatLongDate, formatRelativeTime } from "@/components/features/student/profile/format";
import type { StudentProfile } from "@/components/features/student/profile/types";
import { AvatarUploader } from "@/components/features/student/profile/AvatarUploader";
import { EnrollmentBadge } from "@/components/features/student/profile/Badge";
import { EditActionBar } from "@/components/features/student/profile/EditActionBar";

type ProfileHeroCardProps = {
  profile: StudentProfile;
  editing: boolean;
  saving: boolean;
  canSave: boolean;
  formId: string;
  avatarValue?: string;
  onAvatarChange: (value: string) => void;
  onEdit: () => void;
  onCancel: () => void;
};

const DETAILS: Array<{ label: string; value: (profile: StudentProfile) => string }> = [
  { label: "Student ID", value: (profile) => profile.studentId },
  { label: "Program", value: (profile) => profile.program },
  { label: "Year Level", value: (profile) => profile.yearLevel },
  { label: "Section", value: (profile) => profile.section },
];

/** Light-blue identity card with the avatar, read-only details and edit actions. */
export function ProfileHeroCard({
  profile,
  editing,
  saving,
  canSave,
  formId,
  avatarValue,
  onAvatarChange,
  onEdit,
  onCancel,
}: ProfileHeroCardProps) {
  return (
    <section
      aria-labelledby="profile-hero-name"
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-gradient-to-br from-cpc-section-light via-white to-cpc-bg p-5 transition-shadow sm:p-6",
        editing
          ? "border-cpc-blue-accent/60 ring-2 ring-cpc-blue-accent/25"
          : "border-cpc-tile-border/70",
      )}
    >
      {/* Wave accent from the portal hero treatment. */}
      <svg
        aria-hidden
        viewBox="0 0 600 200"
        preserveAspectRatio="none"
        className="pointer-events-none absolute right-0 bottom-0 h-28 w-[78%] text-cpc-tile-border/45 sm:h-36"
      >
        <path
          d="M0 140 C 120 60, 240 60, 360 120 S 520 190, 600 110 L600 200 L0 200 Z"
          fill="currentColor"
        />
        <path
          d="M0 170 C 130 100, 250 110, 370 150 S 520 200, 600 150 L600 200 L0 200 Z"
          fill="currentColor"
          opacity="0.6"
        />
      </svg>

      <div className="relative grid gap-5 sm:grid-cols-[auto_minmax(0,1fr)] lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-start">
        <AvatarUploader
          fullName={profile.fullName}
          value={avatarValue}
          editing={editing}
          onChange={onAvatarChange}
        />

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <h1
              id="profile-hero-name"
              className="font-poppins text-2xl leading-tight font-bold tracking-wide text-cpc-navy-deep uppercase sm:text-3xl"
            >
              {profile.fullName}
            </h1>

            {editing && (
              <span className="inline-flex items-center gap-1 rounded-full border border-cpc-blue-accent/40 bg-white/80 px-2.5 py-1 font-poppins text-[11px] font-semibold text-cpc-blue-accent">
                <Pencil className="h-3 w-3" aria-hidden />
                Editing mode
              </span>
            )}
          </div>

          <dl className="mt-3 grid gap-x-2 gap-y-1.5 font-poppins text-sm sm:grid-cols-[7.5rem_minmax(0,1fr)] sm:items-baseline">
            {DETAILS.map((detail) => (
              <div key={detail.label} className="contents">
                <dt className="font-semibold text-cpc-heading-soft">{detail.label}:</dt>
                <dd className="min-w-0 break-words font-medium text-cpc-navy-text">
                  {detail.value(profile)}
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
            <EnrollmentBadge status={profile.enrollmentStatus} />
            <p
              className="font-poppins text-xs text-cpc-heading-soft"
              title={formatRelativeTime(profile.updatedAt)}
            >
              Last updated {formatLongDate(profile.updatedAt.slice(0, 10))}
            </p>
          </div>
        </div>

        <div className="sm:col-span-2 lg:col-span-1 lg:justify-self-end">
          {editing ? (
            <EditActionBar
              formId={formId}
              saving={saving}
              canSave={canSave}
              onCancel={onCancel}
              className="hidden lg:flex"
            />
          ) : (
            <button
              id="profile-edit-button"
              type="button"
              onClick={onEdit}
              className="cpc-btn cpc-btn-primary w-full lg:w-auto"
            >
              <Pencil className="h-4 w-4" aria-hidden />
              Edit Profile
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
