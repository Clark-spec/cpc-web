import { useId } from "react";
import { Ban, KeyRound, LockOpen, Power } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { BTN } from "@/components/features/admin/student-accounts/shared";
import { cn } from "@/lib/cn";
import type {
  AccountActionKind,
  StudentAccount,
} from "@/components/features/admin/student-accounts/types";

type AccountActionModalProps = {
  account: StudentAccount;
  action: AccountActionKind;
  onClose: () => void;
  onConfirm: () => void;
};

type Confirmation = {
  title: string;
  body: string;
  confirmLabel: string;
  icon: LucideIcon;
  destructive: boolean;
};

function confirmationFor(account: StudentAccount, action: AccountActionKind): Confirmation {
  if (action === "reset") {
    return {
      title: `Reset password for ${account.name}?`,
      body: `A temporary password will be generated and sent to ${account.email}. The student will be required to choose a new password at the next sign-in.`,
      confirmLabel: "Reset password",
      icon: KeyRound,
      destructive: false,
    };
  }

  if (action === "unlock") {
    return {
      title: `Unlock ${account.name}'s account?`,
      body: "The sign-in lock will be cleared immediately and the failed-attempt counter reset. The student can sign in again with their current password.",
      confirmLabel: "Unlock account",
      icon: LockOpen,
      destructive: false,
    };
  }

  if (account.status === "disabled") {
    return {
      title: `Enable ${account.name}'s account?`,
      body: "The student will be able to sign in again with their existing credentials. No password reset is needed.",
      confirmLabel: "Enable account",
      icon: Power,
      destructive: false,
    };
  }

  return {
    title: `Disable ${account.name}'s account?`,
    body: "The student will be signed out and blocked from signing in until the account is enabled again. Existing records are not deleted.",
    confirmLabel: "Disable account",
    icon: Ban,
    destructive: true,
  };
}

/** Confirmation step for every account row action. */
export function AccountActionModal({
  account,
  action,
  onClose,
  onConfirm,
}: AccountActionModalProps) {
  const headingId = useId();
  const confirmation = confirmationFor(account, action);
  const Icon = confirmation.icon;

  return (
    <Modal open onClose={onClose} labelledBy={headingId} className="sm:max-w-md">
      <div className="px-5 py-5 pr-12">
        <span
          aria-hidden
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-full",
            confirmation.destructive
              ? "bg-rose-50 text-rose-600"
              : "bg-cpc-section-light text-cpc-blue-accent",
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
        <h2
          id={headingId}
          className="mt-3 font-poppins text-lg leading-snug font-bold text-cpc-navy-text"
        >
          {confirmation.title}
        </h2>
        <p className="mt-1.5 font-poppins text-xs leading-relaxed text-cpc-heading-soft">
          {confirmation.body}
        </p>
        <p className="mt-3 inline-flex items-center rounded-lg bg-cpc-section-light/60 px-2.5 py-1.5 font-poppins text-[11px] font-semibold text-cpc-navy-text">
          {account.studentId}
        </p>
      </div>

      <footer className="flex flex-col-reverse gap-2 border-t border-cpc-tile-border/60 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-end">
        <button
          type="button"
          onClick={onClose}
          className="cpc-btn cpc-btn-secondary cpc-btn-sm"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className={cn(
            BTN,
            confirmation.destructive
              ? "bg-rose-600 text-white hover:bg-rose-700"
              : "cpc-btn-primary",
          )}
        >
          {confirmation.confirmLabel}
        </button>
      </footer>
    </Modal>
  );
}
