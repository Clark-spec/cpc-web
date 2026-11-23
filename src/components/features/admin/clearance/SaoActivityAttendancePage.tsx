import { useMemo, useState } from "react";
import { SectionCascadeSelect } from "@/components/common/selection/SectionCascadeSelect";
import { useClearanceAdmin } from "@/components/features/admin/clearance/ClearanceAdminContext";
import { getGradeSections } from "@/services/grades/records";
import type { SaoEvent } from "@/types/clearance";

const STATUS_LABELS: Record<SaoEvent["status"], string> = {
  pending: "Pending",
  attended: "Attended",
  not_attended: "Not attended",
};

const STATUS_STYLES: Record<SaoEvent["status"], string> = {
  pending: "bg-amber-100 text-amber-900",
  attended: "bg-emerald-100 text-emerald-900",
  not_attended: "bg-rose-100 text-rose-900",
};

export function SaoActivityAttendancePage() {
  const { records, loading, error, refresh, refreshing } = useClearanceAdmin();
  const [section, setSection] = useState("all");
  const [search, setSearch] = useState("");

  const sectionOptions = useMemo(
    () => Array.from(new Set([...getGradeSections(), ...records.map((record) => record.section).filter(Boolean)])),
    [records],
  );
  const students = useMemo(() => {
    const query = search.trim().toLowerCase();
    return records
      .filter((record) => section === "all" || record.section === section)
      .filter((record) => !query || record.studentName.toLowerCase().includes(query) || record.studentId.toLowerCase().includes(query))
      .sort((left, right) => left.studentName.localeCompare(right.studentName));
  }, [records, section, search]);

  return (
    <main className="space-y-5 p-4 sm:p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-blue-700">SAO / SSG Adviser</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Student Event Attendance</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">View every student’s recorded status for significant events and SAO activities.</p>
        </div>
        <button type="button" onClick={() => void refresh()} disabled={refreshing} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </header>

      <section aria-label="Filter students" className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2">
        <label className="text-xs font-semibold text-slate-700">
          Search students
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name or student ID" className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm font-normal outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" />
        </label>
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Section Scope</p>
          <SectionCascadeSelect
            value={section as never}
            onChange={(value) => setSection(value)}
            sections={sectionOptions as never[]}
            showAll
            allLabel="All sections"
            ariaLabel="SAO event attendance section scope"
            className="w-full sm:max-w-[320px]"
            menuClassName="sm:w-[320px]"
          />
        </div>
      </section>

      {error && <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</div>}
      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">Loading student attendance…</div>
      ) : students.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">No student attendance records match these filters.</div>
      ) : (
        <div className="space-y-4">
          <p className="text-xs font-medium text-slate-600">{students.length} student{students.length === 1 ? "" : "s"}</p>
          {students.map((student) => {
            const events = student.saoEvents ?? [];
            const attendedCount = events.filter((event) => (event.status ?? (event.attended ? "attended" : "pending")) === "attended").length;
            return (
              <article key={student.studentId} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3">
                  <div>
                    <h2 className="font-semibold text-slate-900">{student.studentName || "Student"}</h2>
                    <p className="mt-0.5 text-xs text-slate-600">ID {student.studentId} · {student.program || "Program not listed"} · {student.section || "Section not listed"}</p>
                  </div>
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-900">{attendedCount} / {events.length} attended</span>
                </header>
                {events.length ? (
                  <div className="divide-y divide-slate-100">
                    {events.map((event, index) => {
                      const status = event.status ?? (event.attended ? "attended" : "pending");
                      return (
                        <div key={event.title} className="flex flex-wrap items-start justify-between gap-3 px-4 py-3">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-900">{index + 1}. {event.title}</p>
                            {event.note && <p className="mt-1 rounded-md border border-blue-100 bg-blue-50 px-2.5 py-1.5 text-xs leading-relaxed text-blue-950"><span className="font-bold">SAO note:</span> {event.note}</p>}
                          </div>
                          <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[status]}`}>{STATUS_LABELS[status]}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : <p className="px-4 py-4 text-sm text-slate-500">No event statuses have been recorded yet.</p>}
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
