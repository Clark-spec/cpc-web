import { useMemo } from "react";
import type { EditableField, StudentProfile } from "@/components/features/student/profile/types";

type CompletenessEntry = {
  field: EditableField;
  /** Lower-case phrase used in the hint sentence. */
  label: string;
  value: (profile: StudentProfile) => string | undefined;
};

/**
 * Each editable value counts once. Address is split into its four parts so a
 * half-filled address still shows progress instead of counting as complete.
 */
const ENTRIES: CompletenessEntry[] = [
  { field: "phone", label: "phone number", value: (profile) => profile.phone },
  {
    field: "alternateContact",
    label: "alternate contact",
    value: (profile) => profile.alternateContact,
  },
  {
    field: "address",
    label: "street / purok",
    value: (profile) => profile.address.street,
  },
  {
    field: "address",
    label: "barangay",
    value: (profile) => profile.address.barangay,
  },
  {
    field: "address",
    label: "city / municipality",
    value: (profile) => profile.address.city,
  },
  {
    field: "address",
    label: "province",
    value: (profile) => profile.address.province,
  },
  { field: "civilStatus", label: "civil status", value: (profile) => profile.civilStatus },
  { field: "religion", label: "religion", value: (profile) => profile.religion },
  { field: "nationality", label: "nationality", value: (profile) => profile.nationality },
  { field: "motherName", label: "mother's name", value: (profile) => profile.motherName },
  { field: "fatherName", label: "father's name", value: (profile) => profile.fatherName },
  { field: "guardianName", label: "guardian's name", value: (profile) => profile.guardianName },
  {
    field: "guardianContact",
    label: "guardian's contact",
    value: (profile) => profile.guardianContact,
  },
  { field: "avatarUrl", label: "profile photo", value: (profile) => profile.avatarUrl },
];

export type ProfileCompleteness = {
  percentage: number;
  /** First missing entry, used by the "Add ... to reach 100%" hint. */
  nextMissing: { field: EditableField; label: string } | null;
  missingCount: number;
};

export function useProfileCompleteness(profile: StudentProfile | null): ProfileCompleteness {
  return useMemo(() => {
    if (!profile) return { percentage: 0, nextMissing: null, missingCount: ENTRIES.length };

    const missing = ENTRIES.filter((entry) => {
      const value = entry.value(profile);
      return typeof value !== "string" || value.trim() === "";
    });

    const filled = ENTRIES.length - missing.length;
    const first = missing[0];

    return {
      percentage: Math.round((filled / ENTRIES.length) * 100),
      nextMissing: first ? { field: first.field, label: first.label } : null,
      missingCount: missing.length,
    };
  }, [profile]);
}
