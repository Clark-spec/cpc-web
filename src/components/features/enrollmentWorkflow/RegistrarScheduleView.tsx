import { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  Edit2,
  Save,
  Users,
} from "lucide-react";
import {
  getDepartmentSchedules,
  updateDepartmentSchedule,
  subscribeToEnrollmentQueue,
} from "@/services/enrollmentWorkflow/service";
import type { DepartmentSchedule } from "@/types/enrollmentWorkflow";

export function RegistrarScheduleView() {
  const [schedules, setSchedules] = useState<DepartmentSchedule[]>(() => getDepartmentSchedules());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editSlots, setEditSlots] = useState<number>(100);
  const [editStartTime, setEditStartTime] = useState<string>("08:00 AM");
  const [editEndTime, setEditEndTime] = useState<string>("12:00 PM");

  const refresh = () => setSchedules(getDepartmentSchedules());

  useEffect(() => {
    const unsub = subscribeToEnrollmentQueue(refresh);
    return unsub;
  }, []);

  const handleStartEdit = (sched: DepartmentSchedule) => {
    setEditingId(sched.id);
    setEditSlots(sched.slots);
    setEditStartTime(sched.startTime);
    setEditEndTime(sched.endTime);
  };

  const handleSaveEdit = (id: string) => {
    updateDepartmentSchedule(id, {
      slots: editSlots,
      startTime: editStartTime,
      endTime: editEndTime,
    });
    setEditingId(null);
    refresh();
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 font-poppins">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-cpc-blue-accent/10 px-3.5 py-1.5 text-xs font-semibold text-cpc-blue-accent">
          <Calendar className="h-4 w-4" />
          Section 4 · Department & Year-Group Queue Schedule Configuration
        </div>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-cpc-navy-text sm:text-3xl">
          Enrollment Queue Schedules & Time Blocks
        </h1>
        <p className="mt-1.5 text-sm text-cpc-heading-soft">
          Configure department days (e.g. Day 1 BSIT, Day 2 BEED, Day 3 BSHM), morning/afternoon year-group time blocks (Years 1–2 vs. Years 3–4), and maximum capacity slots.
        </p>
      </div>

      {/* Grid of Department Schedules */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {schedules.map((sched) => {
          const isEditing = editingId === sched.id;
          return (
            <div
              key={sched.id}
              className="rounded-3xl border border-cpc-input-border/80 bg-white p-6 shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-center justify-between border-b border-cpc-input-border/50 pb-4">
                <div>
                  <span className="rounded-full bg-cpc-blue-accent/10 px-2.5 py-0.5 font-mono text-xs font-bold text-cpc-blue-accent">
                    {sched.department}
                  </span>
                  <h3 className="mt-2 text-base font-bold text-cpc-navy-text">{sched.departmentName}</h3>
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-cpc-navy-text border border-slate-200">
                  Years {sched.yearGroup}
                </span>
              </div>

              <div className="mt-4 space-y-3 text-xs">
                <div className="flex items-center gap-2 text-cpc-heading-soft">
                  <Calendar className="h-4 w-4 text-cpc-muted-blue shrink-0" />
                  <span className="font-semibold text-cpc-navy-text">{sched.dayLabel}</span>
                </div>

                <div className="flex items-center gap-2 text-cpc-heading-soft">
                  <Clock className="h-4 w-4 text-cpc-muted-blue shrink-0" />
                  {isEditing ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={editStartTime}
                        onChange={(e) => setEditStartTime(e.target.value)}
                        className="w-24 rounded-lg border border-cpc-input-border p-1 text-xs text-cpc-navy-text"
                      />
                      <span>-</span>
                      <input
                        type="text"
                        value={editEndTime}
                        onChange={(e) => setEditEndTime(e.target.value)}
                        className="w-24 rounded-lg border border-cpc-input-border p-1 text-xs text-cpc-navy-text"
                      />
                    </div>
                  ) : (
                    <span>
                      {sched.startTime} – {sched.endTime} ({sched.yearGroup === "1-2" ? "Morning" : "Afternoon"})
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-cpc-heading-soft">
                  <Users className="h-4 w-4 text-cpc-muted-blue shrink-0" />
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <span>Max Slots:</span>
                      <input
                        type="number"
                        min={10}
                        max={500}
                        value={editSlots}
                        onChange={(e) => setEditSlots(Number(e.target.value))}
                        className="w-20 rounded-lg border border-cpc-input-border p-1 text-xs text-cpc-navy-text font-bold"
                      />
                    </div>
                  ) : (
                    <span>
                      Slot Allocation: <strong className="text-cpc-navy-text">{sched.slots}</strong> slots ({sched.remainingSlots} remaining)
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-6 border-t border-cpc-input-border/50 pt-4 flex justify-end">
                {isEditing ? (
                  <button
                    type="button"
                    onClick={() => handleSaveEdit(sched.id)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition"
                  >
                    <Save className="h-3.5 w-3.5" /> Save Changes
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleStartEdit(sched)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-cpc-input-border/80 bg-white px-3.5 py-1.5 text-xs font-bold text-cpc-navy-text hover:border-cpc-blue-accent transition"
                  >
                    <Edit2 className="h-3.5 w-3.5" /> Adjust Time & Slots
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
