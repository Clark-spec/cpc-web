import { useState } from "react";
import { Check, CheckCheck, Loader2, Save } from "lucide-react";
import { showError, showSuccess } from "@/lib/feedback";
import { saveSaoAttendance } from "@/services/clearanceAdmin/database";
import type { SaoEvent } from "@/types/clearance";

type SaoAttendanceEditorProps = {
  studentId: string;
  events: SaoEvent[];
  onSaved: (events: SaoEvent[]) => void;
};

const STATUS_LABELS: Record<SaoEvent["status"], string> = {
  pending: "Pending",
  attended: "Attended",
  not_attended: "Not attended",
};

export function SaoAttendanceEditor({ studentId, events, onSaved }: SaoAttendanceEditorProps) {
  const [draft, setDraft] = useState<SaoEvent[]>(() => events.map((event) => ({
    ...event,
    status: event.status ?? (event.attended ? "attended" : "pending"),
  })));
  const [saving, setSaving] = useState(false);
  const dirty = draft.some((event, index) => event.status !== events[index]?.status || event.note !== events[index]?.note);

  function update(index: number, patch: Partial<SaoEvent>) {
    setDraft((current) => current.map((event, eventIndex) => eventIndex === index ? { ...event, ...patch } : event));
  }

  function markAllAttended() {
    setDraft((current) => current.map((event) => ({
      ...event,
      status: "attended",
      note: `SAO confirms your attendance for ${event.title}. No further action is needed.`,
    })));
  }

  async function save() {
    setSaving(true);
    try {
      const record = await saveSaoAttendance(studentId, draft);
      const saved = record.saoEvents.map((event) => ({
        ...event,
        status: event.status ?? (event.attended ? "attended" : "pending"),
      }));
      setDraft(saved);
      onSaved(saved);
      showSuccess("SAO activities saved", "The student can now see the attendance statuses and notes on their clearance form.");
    } catch (error) {
      showError("Could not save SAO activities", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="border-t border-slate-200 p-5 sm:p-6" aria-labelledby="sao-activities-heading">
      <div>
        <div>
          <h3 id="sao-activities-heading" className="font-semibold text-slate-900">Significant events and SAO activities</h3>
          <p className="mt-1 text-xs text-slate-600">Set attendance and add a note that the student will see beneath the activity.</p>
        </div>
      </div>
      <div className="mt-4 divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200">
        {draft.map((event, index) => (
          <div key={event.title} className="grid gap-3 bg-white p-3 sm:grid-cols-[minmax(0,1fr)_170px] sm:items-start">
            <div className="min-w-0">
              <label htmlFor={`sao-event-note-${index}`} className="block text-sm font-medium text-slate-900">{event.title}</label>
              <textarea
                id={`sao-event-note-${index}`}
                value={event.note ?? ""}
                onChange={(input) => update(index, { note: input.target.value })}
                maxLength={500}
                rows={2}
                placeholder="Optional note or next step for the student"
                className="mt-2 w-full resize-y rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <label className="text-xs font-semibold text-slate-700">
              Attendance status
              <select
                value={event.status}
                onChange={(input) => update(index, { status: input.target.value as SaoEvent["status"] })}
                className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              >
                {(Object.keys(STATUS_LABELS) as SaoEvent["status"][]).map((status) => <option key={status} value={status}>{STATUS_LABELS[status]}</option>)}
              </select>
            </label>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[11px] text-slate-500">Marking all attended also drafts an automatic attendance confirmation for each activity. Save activities to send the updates to the student. Notes are limited to 500 characters per activity.</p>
      <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-4">
        <button type="button" onClick={markAllAttended} disabled={saving || draft.every((event) => event.status === "attended" && event.note === `SAO confirms your attendance for ${event.title}. No further action is needed.`)} className="inline-flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50">
          <CheckCheck className="h-4 w-4" /> Mark all attended
        </button>
        <button type="button" onClick={() => void save()} disabled={!dirty || saving} className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50">
          {saving ? <Loader2 className="h-4 w-4 animate-spin"/> : dirty ? <Save className="h-4 w-4"/> : <Check className="h-4 w-4"/>}
          {saving ? "Saving…" : dirty ? "Save activities" : "Saved"}
        </button>
      </div>
    </section>
  );
}
