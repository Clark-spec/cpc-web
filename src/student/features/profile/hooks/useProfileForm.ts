import { useCallback, useEffect, useState } from "react";
import { useForm, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/components/ui/toast";
import { useNotifications } from "@/shared/context/NotificationContext";
import { useProfile } from "../context/ProfileContext";
import { mockProfile } from "../data/mockProfile";
import { profileFormSchema, type ProfileFormValues } from "../schema";
import type { EditableField, StudentProfile } from "../types";

const FIELD_LABELS: Record<EditableField, string> = {
  phone: "Phone number",
  alternateContact: "Alternate contact",
  address: "Address",
  civilStatus: "Civil status",
  religion: "Religion",
  nationality: "Nationality",
  motherName: "Mother's name",
  fatherName: "Father's name",
  guardianName: "Guardian's name",
  guardianContact: "Guardian's contact",
  avatarUrl: "Profile photo",
};

/** Order used when moving focus to the first invalid control. */
const FOCUS_ORDER: EditableField[] = [
  "phone",
  "alternateContact",
  "address",
  "civilStatus",
  "religion",
  "nationality",
  "motherName",
  "fatherName",
  "guardianName",
  "guardianContact",
];

function toFormValues(profile: StudentProfile): ProfileFormValues {
  return {
    phone: profile.phone,
    alternateContact: profile.alternateContact ?? "",
    address: { ...profile.address },
    civilStatus: profile.civilStatus,
    religion: profile.religion,
    nationality: profile.nationality,
    motherName: profile.motherName,
    fatherName: profile.fatherName,
    guardianName: profile.guardianName,
    guardianContact: profile.guardianContact ?? "",
    avatarUrl: profile.avatarUrl ?? "",
  };
}

/**
 * Edit-flow orchestration:
 *
 *   Edit Profile -> reset form from context -> user edits (zod validates on
 *   blur/change) -> Save -> profileService.updateProfile -> context swaps in
 *   the saved profile -> toast + notification -> highlight changed rows.
 *
 * Cancel only prompts when the form is dirty; ESC is wired to the same path.
 */
export function useProfileForm() {
  const { profile, isEditing, beginEdit, endEdit, save, highlight } = useProfile();
  const { toast } = useToast();
  const { notify } = useNotifications();
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: toFormValues(profile ?? mockProfile),
  });

  const { register, handleSubmit, reset, setFocus, setValue, trigger, watch, formState } = form;
  const { errors, isDirty, isValid } = formState;

  // Keep the form in sync when the context profile changes outside edit mode
  // (initial load, demo reset, successful save).
  useEffect(() => {
    if (profile && !isEditing) reset(toFormValues(profile));
  }, [profile, isEditing, reset]);

  const focusField = useCallback(
    (field: EditableField) => {
      window.requestAnimationFrame(() => {
        if (field === "address") {
          setFocus("address.street");
        } else if (field === "avatarUrl") {
          document.getElementById("profile-avatar-button")?.focus();
        } else {
          setFocus(field);
        }
      });
    },
    [setFocus],
  );

  const startEditing = useCallback(
    (field?: EditableField) => {
      if (!profile) return;
      reset(toFormValues(profile));
      beginEdit();
      // Validate the prefilled values once so `isValid` is known immediately;
      // Save can then enable as soon as the form is dirty and valid.
      void trigger();
      setAnnouncement("Editing mode. Update your details, then choose Save Changes.");
      focusField(field ?? "phone");
    },
    [profile, reset, beginEdit, trigger, focusField, setAnnouncement],
  );

  const focusEditButton = useCallback(() => {
    window.requestAnimationFrame(() => {
      document.getElementById("profile-edit-button")?.focus();
    });
  }, []);

  const finishCancel = useCallback(() => {
    reset(toFormValues(profile ?? mockProfile));
    setConfirmOpen(false);
    endEdit();
    setAnnouncement("Changes discarded.");
    focusEditButton();
  }, [profile, reset, endEdit, setAnnouncement, focusEditButton]);

  const requestCancel = useCallback(() => {
    if (isDirty) {
      setConfirmOpen(true);
      return;
    }
    finishCancel();
  }, [isDirty, finishCancel]);

  const focusFirstError = useCallback(
    (fieldErrors: FieldErrors<ProfileFormValues>) => {
      const first = FOCUS_ORDER.find((field) =>
        field === "address" ? Boolean(fieldErrors.address) : Boolean(fieldErrors[field]),
      );
      if (first) focusField(first);
    },
    [focusField],
  );

  const submit = handleSubmit(
    async (values) => {
      setSaving(true);
      try {
        const result = await save(values);
        reset(values);
        endEdit();
        highlight(result.changed);

        toast("Profile updated successfully", "success");
        notify({
          message:
            result.changed.length > 0
              ? `Your profile information was updated (${result.changed
                  .map((field) => FIELD_LABELS[field])
                  .join(", ")}).`
              : "Your profile information was updated.",
          type: "success",
          silent: true,
        });

        setAnnouncement("Profile updated successfully.");
        focusEditButton();
      } catch (saveError) {
        // Keep edit mode open and preserve every input value.
        toast(
          saveError instanceof Error ? saveError.message : "We couldn't save your changes.",
          "error",
        );
        setAnnouncement("Your changes could not be saved. Please try again.");
        focusField("phone");
      } finally {
        setSaving(false);
      }
    },
    (fieldErrors) => {
      setAnnouncement("Some fields need your attention. Please fix the highlighted fields.");
      focusFirstError(fieldErrors);
    },
  );

  // ESC = Cancel, unless a dialog is already open (the modal handles its own ESC).
  useEffect(() => {
    if (!isEditing) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || confirmOpen) return;
      if (document.querySelector('[aria-modal="true"]')) return;
      event.preventDefault();
      requestCancel();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isEditing, confirmOpen, requestCancel]);

  return {
    form,
    register,
    errors,
    isDirty,
    canSave: isDirty && isValid && !saving,
    saving,
    confirmOpen,
    setConfirmOpen,
    startEditing,
    requestCancel,
    confirmDiscard: finishCancel,
    submit,
    announcement,
    setAnnouncement,
    focusField,
    watch,
    setValue,
  };
}

/** The form state tree. `useProfileForm` owns one react-hook-form instance, so it is called once per page. */
export type ProfileFormState = ReturnType<typeof useProfileForm>;
