import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw, Search, Trash2, Users } from "lucide-react";
import { PageBanner } from "@/components/common/display/PageBanner";
import { ConfirmDialog } from "@/components/common/feedback/ConfirmDialog";
import { RegistrarStudentCreator } from "@/components/features/admin/student-accounts/RegistrarStudentCreator";
import { useAdminAuth } from "@/components/context/AdminAuthContext";
import { useToast } from "@/components/ui/toast";
import {
  deleteRegistrarStudentAccount,
  listRegistrarStudentAccounts,
  type RegistrarStudentAccount,
} from "@/services/studentAccounts/admin";

export function AllStudentsWorkspace() {
  const { user } = useAdminAuth();
  const { toast } = useToast();
  const [students, setStudents] = useState<RegistrarStudentAccount[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RegistrarStudentAccount | null>(null);

  const role = user?.role;
  const canManageAccounts = role === "admin" || role === "registrar";

  const loadStudents = useCallback(async () => {
    if (!canManageAccounts || !role) return;
    setLoading(true);
    setError(null);
    try {
      setStudents(await listRegistrarStudentAccounts(role));
    } catch {
      // Do not leave old, demo, or stale rows visible when the database is unavailable.
      setStudents([]);
      setError("Student accounts could not be loaded from the database.");
    } finally {
      setLoading(false);
    }
  }, [canManageAccounts, role]);

  useEffect(() => {
    void loadStudents();
  }, [loadStudents]);

  const filteredStudents = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return students;
    return students.filter((student) =>
      [student.studentNumber, student.name, student.section ?? "", student.course ?? ""]
        .some((value) => value.toLowerCase().includes(needle)),
    );
  }, [query, students]);

  async function removeStudent() {
    const student = deleteTarget;
    if (!student) return;
    if (!role || deletingId) return;

    setDeletingId(student.id);
    try {
      await deleteRegistrarStudentAccount(role, student.id);
      setStudents((current) => current.filter((row) => row.id !== student.id));
      setDeleteTarget(null);
      toast(`Student account ${student.studentNumber} was deleted.`, "success");
    } catch (deleteError) {
      toast(deleteError instanceof Error ? deleteError.message : "Student account could not be deleted.", "error");
    } finally {
      setDeletingId(null);
    }
  }

  if (!canManageAccounts) return null;

  return (
    <div className="space-y-6">
      <RegistrarStudentCreator onCreated={() => void loadStudents()} />

      <PageBanner
        title="All Students"
        subtitle="Only Registrar-created student accounts saved in the database appear here."
        right={
          <div className="flex items-center gap-2.5 rounded-xl border border-white/80 bg-white/80 px-3.5 py-2.5 shadow-[0_10px_30px_rgba(15,36,104,0.08)] backdrop-blur">
            <span aria-hidden className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cpc-section-light text-cpc-blue-accent">
              <Users className="h-4 w-4" />
            </span>
            <div>
              <p className="font-poppins text-[10px] font-bold tracking-[0.12em] text-cpc-heading-soft uppercase">Saved accounts</p>
              <p className="font-poppins text-sm leading-none font-bold text-cpc-navy-text tabular-nums">{students.length}</p>
            </div>
          </div>
        }
      />

      <section aria-label="Saved student accounts" className="overflow-hidden rounded-2xl border border-cpc-tile-border/70 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-cpc-tile-border/50 p-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-poppins text-sm font-bold text-cpc-navy-text">Database student accounts</h2>
            <p className="mt-1 font-poppins text-xs text-cpc-heading-soft">Deleting an account removes its student access and continuing-student record.</p>
          </div>
          <label className="relative block w-full sm:max-w-xs">
            <span className="sr-only">Search saved students</span>
            <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cpc-muted-blue" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name, ID or section"
              className="h-10 w-full rounded-lg border border-cpc-input-border bg-white pl-9 pr-3 font-poppins text-xs text-cpc-navy-text outline-none focus:border-cpc-blue-accent"
            />
          </label>
        </div>

        {error ? (
          <div role="alert" className="flex flex-col items-start gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-poppins text-sm text-rose-700">{error}</p>
            <button type="button" onClick={() => void loadStudents()} className="cpc-btn cpc-btn-secondary cpc-btn-sm">
              <RefreshCw className="h-3.5 w-3.5" aria-hidden /> Try again
            </button>
          </div>
        ) : loading ? (
          <p role="status" className="p-6 font-poppins text-sm text-cpc-heading-soft">Loading saved student accounts…</p>
        ) : filteredStudents.length === 0 ? (
          <p className="p-6 font-poppins text-sm text-cpc-heading-soft">
            {query ? "No saved student accounts match that search." : "No Registrar-created student accounts are saved yet."}
          </p>
        ) : (
          <div className="admin-scrollbar max-h-[65vh] overflow-auto">
            <table className="w-full min-w-[680px] border-collapse">
              <caption className="sr-only">{filteredStudents.length} saved student accounts</caption>
              <thead>
                <tr className="border-b border-cpc-tile-border/60 text-left">
                  <th scope="col" className="px-4 py-3 font-poppins text-[10px] font-bold uppercase tracking-wide text-cpc-heading-soft">Student ID</th>
                  <th scope="col" className="px-4 py-3 font-poppins text-[10px] font-bold uppercase tracking-wide text-cpc-heading-soft">Name</th>
                  <th scope="col" className="px-4 py-3 font-poppins text-[10px] font-bold uppercase tracking-wide text-cpc-heading-soft">Section</th>
                  <th scope="col" className="px-4 py-3 font-poppins text-[10px] font-bold uppercase tracking-wide text-cpc-heading-soft">Course / Year</th>
                  <th scope="col" className="px-4 py-3 text-right font-poppins text-[10px] font-bold uppercase tracking-wide text-cpc-heading-soft">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cpc-tile-border/50">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-cpc-section-light/30">
                    <td className="px-4 py-3 font-mono text-xs font-bold text-cpc-blue-accent">{student.studentNumber}</td>
                    <td className="px-4 py-3 font-poppins text-xs font-semibold text-cpc-navy-text">{student.name}</td>
                    <td className="px-4 py-3 font-poppins text-xs text-cpc-navy-text">{student.section || "—"}</td>
                    <td className="px-4 py-3 font-poppins text-xs text-cpc-navy-text">
                      {student.course || "—"}{student.yearLevel ? ` · Year ${student.yearLevel}` : ""}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        disabled={deletingId !== null}
                        onClick={() => setDeleteTarget(student)}
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 font-poppins text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                        aria-label={`Delete student ${student.studentNumber}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden />
                        {deletingId === student.id ? "Deleting…" : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void removeStudent()}
        title="Delete this student account?"
        description={deleteTarget ? <>{deleteTarget.studentNumber} — {deleteTarget.name}, the continuing-student record, all enrollment and office-signature requests, queue numbers (including any currently processing), service requests, and student notifications will be permanently deleted.</> : "This account and its student activity will be permanently deleted."}
        confirmLabel="Delete account"
        loadingLabel="Deleting…"
        danger
        busy={deletingId !== null}
      />
    </div>
  );
}
