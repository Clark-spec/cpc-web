import { Home, Mail, Phone, PhoneCall } from "lucide-react";
import { formatAddress } from "../utils/format";
import type { ProfileCardProps } from "../types";
import { InfoRow, profileInputClass } from "./InfoRow";
import { ProfileSection } from "./ProfileSection";

export function ContactInfoCard({
  profile,
  editing,
  register,
  errors,
  highlighted,
  onRequestCorrection,
}: ProfileCardProps) {
  const addressError =
    errors.address?.street?.message ??
    errors.address?.barangay?.message ??
    errors.address?.city?.message ??
    errors.address?.province?.message;

  return (
    <ProfileSection icon={Phone} title="Contact Information" editing={editing}>
      {editing ? (
        <div className="divide-y divide-cpc-input-border/60">
          <InfoRow
            icon={Mail}
            label="Email Address"
            value={profile.email}
            editing={editing}
            readOnly
            onRequestCorrection={() => onRequestCorrection("Email Address")}
          />

          <InfoRow
            icon={Phone}
            label="Phone Number"
            htmlFor="profile-phone"
            required
            error={errors.phone?.message}
            highlight={highlighted.has("phone")}
          >
            <input
              id="profile-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="+63 912 345 6789"
              aria-invalid={Boolean(errors.phone)}
              aria-describedby={errors.phone ? "profile-phone-error" : undefined}
              className={profileInputClass}
              {...register("phone")}
            />
          </InfoRow>

          <InfoRow
            icon={PhoneCall}
            label="Alternate Contact"
            htmlFor="profile-alternate-contact"
            error={errors.alternateContact?.message}
            highlight={highlighted.has("alternateContact")}
          >
            <input
              id="profile-alternate-contact"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="Optional"
              aria-invalid={Boolean(errors.alternateContact)}
              aria-describedby={
                errors.alternateContact ? "profile-alternate-contact-error" : undefined
              }
              className={profileInputClass}
              {...register("alternateContact")}
            />
          </InfoRow>

          <InfoRow
            icon={Home}
            label="Address"
            htmlFor="profile-address-street"
            required
            error={addressError}
            highlight={highlighted.has("address")}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label
                  htmlFor="profile-address-street"
                  className="block font-poppins text-[11px] font-medium text-cpc-heading-soft"
                >
                  Street / Purok
                </label>
                <input
                  id="profile-address-street"
                  autoComplete="address-line1"
                  aria-invalid={Boolean(errors.address?.street)}
                  aria-describedby={addressError ? "profile-address-street-error" : undefined}
                  className={profileInputClass}
                  {...register("address.street")}
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="profile-address-barangay"
                  className="block font-poppins text-[11px] font-medium text-cpc-heading-soft"
                >
                  Barangay
                </label>
                <input
                  id="profile-address-barangay"
                  autoComplete="address-level3"
                  aria-invalid={Boolean(errors.address?.barangay)}
                  aria-describedby={addressError ? "profile-address-street-error" : undefined}
                  className={profileInputClass}
                  {...register("address.barangay")}
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="profile-address-city"
                  className="block font-poppins text-[11px] font-medium text-cpc-heading-soft"
                >
                  City / Municipality
                </label>
                <input
                  id="profile-address-city"
                  autoComplete="address-level2"
                  aria-invalid={Boolean(errors.address?.city)}
                  aria-describedby={addressError ? "profile-address-street-error" : undefined}
                  className={profileInputClass}
                  {...register("address.city")}
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="profile-address-province"
                  className="block font-poppins text-[11px] font-medium text-cpc-heading-soft"
                >
                  Province
                </label>
                <input
                  id="profile-address-province"
                  autoComplete="address-level1"
                  aria-invalid={Boolean(errors.address?.province)}
                  aria-describedby={addressError ? "profile-address-street-error" : undefined}
                  className={profileInputClass}
                  {...register("address.province")}
                />
              </div>
            </div>
          </InfoRow>
        </div>
      ) : (
        <dl className="divide-y divide-cpc-input-border/60">
          <InfoRow icon={Mail} label="Email Address" value={profile.email} />
          <InfoRow
            icon={Phone}
            label="Phone Number"
            value={profile.phone}
            highlight={highlighted.has("phone")}
          />
          <InfoRow
            icon={PhoneCall}
            label="Alternate Contact"
            value={profile.alternateContact}
            highlight={highlighted.has("alternateContact")}
          />
          <InfoRow
            icon={Home}
            label="Address"
            value={formatAddress(profile.address)}
            highlight={highlighted.has("address")}
          />
        </dl>
      )}
    </ProfileSection>
  );
}
