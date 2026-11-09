import cpcLogo from "@/assets/cpc-logo.jpg";
import { EventsTable } from "@/components/common/display/EventsTable";
import { SubjectsTable } from "@/components/common/display/SubjectsTable";
import { useClearance } from "@/components/features/student/clearance/ClearanceContext";
import { mockEvents, mockSubjects } from "@/services/clearanceStudent/mock";
import { formatDate } from "@/lib/format";

function ReadOnlyCheck({ label, checked }: { label: string; checked: boolean }) {
  return (
    <label className="flex items-center gap-2 py-0.5 font-poppins text-xs text-cpc-label">
      {/* Read-only indicators: 24px so they also meet the touch-target size. */}
      <input
        type="checkbox"
        checked={checked}
        readOnly
        aria-readonly="true"
        tabIndex={-1}
        className="h-6 w-6 shrink-0 accent-cpc-navy"
      />
      {label}
    </label>
  );
}

/** Section 3: the printed Form 3 layout, filled from the clearance state. */
export function ClearanceForm() {
  const { student } = useClearance();

  return (
    <section
      aria-labelledby="form-heading"
      className="rounded-2xl border border-white/80 bg-white/90 p-6 shadow-[0_8px_30px_rgb(15,36,104,0.04)] backdrop-blur-md sm:p-7 lg:p-8"
    >
      <h2 id="form-heading" className="sr-only">
        Student's Clearance Form 3
      </h2>

      <div className="grid items-center gap-6 lg:grid-cols-[1fr_auto_1fr]">
        <div className="order-2 flex flex-col items-start gap-1 lg:order-1">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-cpc-tile-border/40 bg-cpc-section-light/80 px-3 py-1 font-poppins text-[11px] font-semibold text-cpc-navy-text shadow-2xs">
            Form 3 · Clearance
          </span>
          <p className="mt-1 font-poppins text-xs font-semibold text-cpc-navy-text">
            Cordova Public College
          </p>
          <p className="font-poppins text-[11px] text-cpc-heading-soft">
            Official Student Clearance
          </p>
        </div>

        <div className="order-1 flex flex-col items-center text-center lg:order-2">
          <img
            src={cpcLogo}
            alt="Cordova Public College seal"
            className="h-16 w-16 rounded-full object-cover shadow-sm ring-2 ring-white"
          />
          <p className="mt-2 font-poppins text-[11px] text-cpc-heading-soft">Republic of the Philippines</p>
          <p className="font-poppins text-base font-bold tracking-wide text-cpc-navy-text sm:text-lg">
            CORDOVA PUBLIC COLLEGE
          </p>
          <p className="font-poppins text-[11px] text-cpc-heading-soft">Gabi, Cordova, Cebu</p>
          <p className="mt-1 font-poppins text-sm font-bold tracking-wider text-cpc-navy-text">
            STUDENT'S CLEARANCE
          </p>
        </div>

        <dl className="order-3 grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1.5 rounded-xl border border-white/80 bg-cpc-section-light/50 p-3.5 font-poppins text-xs shadow-2xs backdrop-blur-xs lg:order-3 lg:justify-self-end">
          <dt className="font-semibold text-cpc-label">Date:</dt>
          <dd className="font-medium text-cpc-navy-text">{formatDate(student.date)}</dd>

          <dt className="font-semibold text-cpc-label">Status:</dt>
          <dd className="flex items-center gap-2">
            <ReadOnlyCheck label="Graduating" checked={student.graduating} />
            <ReadOnlyCheck label="Non-Grad" checked={!student.graduating} />
          </dd>

          <dt className="font-semibold text-cpc-label">Term:</dt>
          <dd className="flex items-center gap-2">
            <ReadOnlyCheck label="1st Sem" checked={student.term === "1st"} />
            <ReadOnlyCheck label="2nd Sem" checked={student.term === "2nd"} />
          </dd>

          <dt className="font-semibold text-cpc-label">A.Y.</dt>
          <dd className="font-medium text-cpc-navy-text">{student.academicYear}</dd>
        </dl>
      </div>

      <hr className="my-5 border-t border-cpc-tile-border/50" />

      <div className="rounded-xl border border-white/80 bg-cpc-section-light/50 p-4 shadow-2xs backdrop-blur-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cpc-tile-border/40 pb-2">
          <span className="font-poppins text-xs font-bold text-cpc-navy-text">
            Student ID: <span className="font-mono text-cpc-blue-accent">{student.studentId}</span>
          </span>
          <span className="rounded-full border border-white/80 bg-white/80 px-2.5 py-0.5 font-poppins text-[11px] font-semibold text-cpc-navy-text shadow-2xs">
            {student.course} · {student.yearLevel}
          </span>
        </div>
        <p className="mt-2.5 font-poppins text-xs leading-relaxed text-cpc-heading-soft">
          This is to certify that Mr./Ms.{" "}
          <strong className="font-semibold text-cpc-navy-text">{student.name}</strong> is a{" "}
          <span className="font-medium text-cpc-navy-text">{student.yearLevel}</span>{" "}
          <span className="font-medium text-cpc-navy-text">{student.course}</span> student and has
          accounted for all academic, financial, and property responsibilities of Cordova Public College.
        </p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <SubjectsTable subjects={mockSubjects} />
        <EventsTable events={mockEvents} />
      </div>
    </section>
  );
}

