import { useState } from "react";
import { KeyRound } from "lucide-react";
import { apiClient } from "@/lib/apiClient";
import { getCsrfToken } from "@/services/auth";
import { useToast } from "@/components/ui/toast";

export function ChangePasswordPanel() {
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (newPassword !== confirmation) {
      toast("The new passwords do not match.", "warning");
      return;
    }
    setSaving(true);
    try {
      const csrf = await getCsrfToken();
      await apiClient.patch("/students/v1/password", { currentPassword, newPassword }, {
        headers: { "x-csrf-token": csrf },
      });
      const raw = sessionStorage.getItem("cpc_user");
      if (raw) {
        const user = JSON.parse(raw) as Record<string, unknown>;
        sessionStorage.setItem("cpc_user", JSON.stringify({ ...user, mustChangePassword: false }));
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmation("");
      toast("Your password has been changed.", "success");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Password could not be changed.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-cpc-tile-border/60 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cpc-section-light text-cpc-blue-accent"><KeyRound className="h-5 w-5" aria-hidden /></span>
        <div><h2 className="font-poppins text-base font-bold text-cpc-navy-text">Change password</h2><p className="mt-1 font-poppins text-xs text-cpc-heading-soft">Use at least 8 characters for your new password.</p></div>
      </div>
      <form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="font-poppins text-xs font-semibold text-cpc-label">Current password<input required type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-cpc-input-border px-3 font-normal" /></label>
        <span className="hidden sm:block" />
        <label className="font-poppins text-xs font-semibold text-cpc-label">New password<input required minLength={8} maxLength={128} type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-cpc-input-border px-3 font-normal" /></label>
        <label className="font-poppins text-xs font-semibold text-cpc-label">Confirm new password<input required minLength={8} maxLength={128} type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-cpc-input-border px-3 font-normal" /></label>
        <button disabled={saving} className="cpc-btn cpc-btn-primary h-10 sm:col-span-2 sm:justify-self-start disabled:opacity-60">{saving ? "Saving…" : "Save new password"}</button>
      </form>
    </section>
  );
}
