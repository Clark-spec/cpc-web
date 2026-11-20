import { useState, useEffect } from "react";
import {
  Search,
  UserCheck,
} from "lucide-react";
import { useAdminAuth } from "@/components/context/AdminAuthContext";
import {
  getCorrectionRequests,
  resolveCorrectionRequest,
  subscribeToEnrollmentQueue,
  type VerificationCorrection,
} from "@/services/enrollmentWorkflow/service";

export function RegistrarVerificationView() {
  const { user } = useAdminAuth();
  const [requests, setRequests] = useState<VerificationCorrection[]>(() => getCorrectionRequests());
  const [search, setSearch] = useState("");
  const [actionModal, setActionModal] = useState<{
    open: boolean;
    id: string;
    action: "approved" | "rejected";
    studentName: string;
    field: string;
  }>({
    open: false,
    id: "",
    action: "approved",
    studentName: "",
    field: "",
  });
  const [remarks, setRemarks] = useState("");

  const refresh = () => setRequests(getCorrectionRequests());

  useEffect(() => {
    const unsub = subscribeToEnrollmentQueue(refresh);
    return unsub;
  }, []);

  const handleResolveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    resolveCorrectionRequest(
      actionModal.id,
      actionModal.action,
      remarks.trim(),
      user?.name ?? "Registrar Staff",
    );
    setActionModal({ open: false, id: "", action: "approved", studentName: "", field: "" });
    setRemarks("");
    refresh();
  };

  const filtered = requests.filter(
    (r) =>
      r.studentName.toLowerCase().includes(search.toLowerCase()) ||
      r.studentId.includes(search) ||
      r.field.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 font-poppins">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-cpc-blue-accent/10 px-3.5 py-1.5 text-xs font-semibold text-cpc-blue-accent">
            <UserCheck className="h-4 w-4" />
            Step 0 · Registrar Verification Queue
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-cpc-navy-text sm:text-3xl">
            Student Detail Correction Requests
          </h1>
          <p className="mt-1 text-sm text-cpc-heading-soft">
            Resolve student claims regarding year-level mismatches, department transfers, or academic standing changes.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-cpc-muted-blue" />
          <input
            type="search"
            placeholder="Search student or field..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-cpc-input-border/80 bg-white py-2 pl-9 pr-4 text-xs text-cpc-navy-text shadow-2xs focus:border-cpc-blue-accent focus:outline-hidden"
          />
        </div>
      </div>

      {/* Table Card */}
      <div className="rounded-3xl border border-cpc-input-border/80 bg-white p-6 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-cpc-input-border/60 text-cpc-heading-soft uppercase tracking-wider text-[10px]">
                <th className="py-2.5 font-bold">Student</th>
                <th className="py-2.5 font-bold">Department</th>
                <th className="py-2.5 font-bold">Target Field</th>
                <th className="py-2.5 font-bold">Claimed Value</th>
                <th className="py-2.5 font-bold">Student Reason</th>
                <th className="py-2.5 font-bold">Status</th>
                <th className="py-2.5 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cpc-input-border/40">
              {filtered.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50/60 transition">
                  <td className="py-3 font-bold text-cpc-navy-text">
                    {req.studentName}
                    <div className="text-[10px] font-mono text-cpc-muted-blue font-normal">{req.studentId}</div>
                  </td>
                  <td className="py-3 text-cpc-heading-soft">{req.department}</td>
                  <td className="py-3 font-semibold text-cpc-blue-accent">{req.field}</td>
                  <td className="py-3 font-bold text-cpc-navy-text">{req.requestedValue}</td>
                  <td className="py-3 text-cpc-heading-soft max-w-[200px] truncate" title={req.reason}>
                    {req.reason}
                  </td>
                  <td className="py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        req.status === "approved"
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : req.status === "rejected"
                          ? "bg-rose-50 text-rose-800 border border-rose-200"
                          : "bg-amber-50 text-amber-800 border border-amber-200"
                      }`}
                    >
                      {req.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    {req.status === "pending" ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setActionModal({
                              open: true,
                              id: req.id,
                              action: "approved",
                              studentName: req.studentName,
                              field: req.field,
                            })
                          }
                          className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition border border-emerald-200"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setActionModal({
                              open: true,
                              id: req.id,
                              action: "rejected",
                              studentName: req.studentName,
                              field: req.field,
                            })
                          }
                          className="rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 hover:bg-rose-100 transition border border-rose-200"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-[11px] text-cpc-heading-soft">{req.remarks ?? "Resolved"}</span>
                    )}
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-cpc-heading-soft">
                    No student verification correction requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Dialog */}
      {actionModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl animate-in fade-in-50 zoom-in-95">
            <h3 className="text-base font-bold text-cpc-navy-text">
              {actionModal.action === "approved" ? "Approve Correction" : "Reject Correction"}
            </h3>
            <p className="mt-1 text-xs text-cpc-heading-soft">
              {actionModal.action === "approved"
                ? `Update masterlist record for ${actionModal.studentName} (${actionModal.field})?`
                : `Reject requested change for ${actionModal.studentName}? State remarks below.`}
            </p>

            <form onSubmit={handleResolveSubmit} className="mt-4 space-y-4">
              <textarea
                required
                rows={3}
                placeholder="Enter Registrar remarks or justification..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full rounded-xl border border-cpc-input-border/80 p-3 text-xs text-cpc-navy-text focus:border-cpc-blue-accent focus:outline-hidden"
              />

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setActionModal({ open: false, id: "", action: "approved", studentName: "", field: "" })}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-cpc-heading-soft hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`rounded-xl px-5 py-2 text-xs font-bold text-white shadow-xs ${
                    actionModal.action === "approved"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-rose-600 hover:bg-rose-700"
                  }`}
                >
                  Confirm {actionModal.action === "approved" ? "Approval" : "Rejection"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
