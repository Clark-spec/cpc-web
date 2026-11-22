import { useState } from "react";
import { UserPlus } from "lucide-react";
import { apiClient } from "@/lib/apiClient";
import { useToast } from "@/components/ui/toast";
import { getCsrfToken } from "@/services/auth";
import { ensureAdminSession } from "@/services/complaints/admin-session";
import { useAdminAuth } from "@/components/context/AdminAuthContext";
import { cacheContinuingStudentRecord } from "@/services/enrollmentWorkflow/service";
import type { MasterlistRecord } from "@/types/enrollmentWorkflow";
import { ConfirmDialog } from "@/components/common/feedback/ConfirmDialog";

type StudentAccountRow = { id: string; name: string; studentNumber: string; section: string | null };
type Envelope<T> = { data?: T; message?: string };

export function RegistrarStudentCreator({ onCreated }: { onCreated?: () => void }) {
  const { user } = useAdminAuth();
  const { toast } = useToast();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [middleInitial, setMiddleInitial] = useState("");
  const [section, setSection] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmCreate, setConfirmCreate] = useState(false);
  const canManageAccounts = user?.role === "admin" || user?.role === "registrar";
  const name = [firstName.trim(), middleInitial.trim() ? `${middleInitial.trim().replace(/\.$/, "")}.` : "", lastName.trim()]
    .filter(Boolean)
    .join(" ");

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      toast("Enter both a first name and a last name.", "error");
      return;
    }
    setConfirmCreate(true);
  }

  async function createStudent() {
    setSaving(true);
    try {
      const [token, csrf] = await Promise.all([ensureAdminSession(user?.role), getCsrfToken()]);
      const response = await apiClient.post<Envelope<{
        student: StudentAccountRow;
        defaultPassword: string;
        continuingRecord?: MasterlistRecord;
      }>>(
        "/students/v1/accounts",
        { name, section },
        { headers: { Authorization: `Bearer ${token}`, "x-csrf-token": csrf } },
      );
      const created = response.data?.data?.student;
      if (!created) throw new Error(response.data?.message ?? "Student account was not created.");
      const continuingRecord = response.data?.data?.continuingRecord;
      if (continuingRecord) cacheContinuingStudentRecord(continuingRecord);
      onCreated?.();
      setFirstName("");
      setLastName("");
      setMiddleInitial("");
      setSection("");
      setConfirmCreate(false);
      toast(`Created account ${created.studentNumber}. Default password: 123456`, "success");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Student account could not be created.", "error");
    } finally {
      setSaving(false);
    }
  }

  if (!canManageAccounts) return null;

  return (
    <section className="rounded-2xl border border-cpc-tile-border/60 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cpc-section-light text-cpc-blue-accent">
          <UserPlus className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <h2 className="font-poppins text-base font-bold text-cpc-navy-text">Add a student account</h2>
          <p className="mt-1 font-poppins text-xs text-cpc-heading-soft">The student signs in with their generated ID and changes the default password after signing in.</p>
        </div>
      </div>
      <form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-2 sm:items-end lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_5rem_minmax(0,1fr)_auto]">
        <label className="font-poppins text-xs font-semibold text-cpc-label">
          First name
          <input required minLength={1} maxLength={60} value={firstName} onChange={(event) => setFirstName(event.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-cpc-input-border px-3 font-normal" placeholder="First name" />
        </label>
        <label className="font-poppins text-xs font-semibold text-cpc-label">
          Last name
          <input required minLength={1} maxLength={60} value={lastName} onChange={(event) => setLastName(event.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-cpc-input-border px-3 font-normal" placeholder="Last name" />
        </label>
        <label className="font-poppins text-xs font-semibold text-cpc-label">
          Middle initial (optional)
          <input maxLength={2} value={middleInitial} onChange={(event) => setMiddleInitial(event.target.value.replace(/[^a-zA-Z.]/g, "").slice(0, 2))} className="mt-1.5 h-10 w-full rounded-lg border border-cpc-input-border px-3 font-normal uppercase" placeholder="M.I." />
        </label>
        <label className="font-poppins text-xs font-semibold text-cpc-label">
          Section
          <input required maxLength={40} value={section} onChange={(event) => setSection(event.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-cpc-input-border px-3 font-normal" placeholder="e.g. BSIT 1-A" />
        </label>
        <button type="submit" disabled={saving} className="cpc-btn cpc-btn-primary h-10 disabled:opacity-60">{saving ? "Creating…" : "Create student"}</button>
      </form>
      <p className="mt-2 font-poppins text-[11px] text-cpc-heading-soft">IDs start at 20240770 and increase from the highest existing ID. Default password: 123456.</p>
      <ConfirmDialog
        open={confirmCreate}
        onClose={() => setConfirmCreate(false)}
        onConfirm={() => void createStudent()}
        title="Create this student account?"
        description={<>Create an account for <strong>{name}</strong> in <strong>{section}</strong>? The student ID will be generated and the default password will be <strong>123456</strong>.</>}
        confirmLabel="Create account"
        loadingLabel="Creating…"
        busy={saving}
      />
    </section>
  );
}
