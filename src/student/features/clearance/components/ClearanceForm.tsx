import cpcLogo from "@/assets/cpc-logo.jpg";
import { EventsTable } from "./EventsTable";
import { SubjectsTable } from "./SubjectsTable";
import { useClearance } from "../context/ClearanceContext";
import { mockEvents, mockSubjects } from "../data/mockClearance";
import { formatDate } from "../utils/format";

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
      className="rounded-xl border border-cpc-input-border bg-white p-5 shadow-sm sm:p-7 lg:p-8"
    >
      <h2 id="form-heading" className="sr-only">
        Student's Clearance Form 3
      </h2>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_auto_1fr]">
        <div className="order-2 hidden lg:order-1 lg:block">
          <p className="font-poppins text-sm font-semibold text-cpc-navy-text">Student's Clearance</p>
          <p className="font-poppins text-xs text-cpc-heading-soft">Form 3</p>
        </div>

        <div className="order-1 flex flex-col items-center text-center lg:order-2">
          <img
            src={cpcLogo}
            alt="Cordova Public College seal"
            className="h-16 w-16 rounded-full object-cover shadow-sm"
          />
          <p className="mt-2 font-poppins text-[11px] text-cpc-heading-soft">Republic of the Philippines</p>
          <p className="font-poppins text-base font-bold tracking-wide text-cpc-navy-text sm:text-lg">
            CORDOVA PUBLIC COLLEGE
          </p>
          <p className="font-poppins text-[11px] text-cpc-heading-soft">Gabi, Cordova, Cebu</p>
          <p className="mt-1 font-poppins text-sm font-bold tracking-wide text-cpc-navy-text">
            STUDENT'S CLEARANCE
          </p>
        </div>

        <dl className="order-3 grid grid-cols-[auto_1fr] items-start gap-x-3 gap-y-1.5 font-poppins text-xs lg:justify-self-end">
          <dt className="font-semibold text-cpc-label">Date:</dt>
          <dd className="text-cpc-navy-text">{formatDate(student.date)}</dd>

          <dt className="font-semibold text-cpc-label">Status:</dt>
          <dd className="space-y-1">
            <ReadOnlyCheck label="Graduating" checked={student.graduating} />
            <ReadOnlyCheck label="Non-Graduating" checked={!student.graduating} />
          </dd>

          <dt className="font-semibold text-cpc-label">Term:</dt>
          <dd className="space-y-1">
            <ReadOnlyCheck label="1st sem" checked={student.term === "1st"} />
            <ReadOnlyCheck label="2nd sem" checked={student.term === "2nd"} />
          </dd>

          <dt className="font-semibold text-cpc-label">A.Y.</dt>
          <dd className="text-cpc-navy-text">{student.academicYear}</dd>
        </dl>
      </div>

      <hr className="my-6 border-t-2 border-cpc-navy-text/80" />

      <p className="font-poppins text-sm text-cpc-navy-text">
        <span className="font-bold">Student I.D. Number: {student.studentId}</span>
      </p>

      <p className="mt-3 max-w-3xl font-poppins text-sm leading-relaxed text-cpc-heading-soft">
        This is to certify that Mr./Ms.{" "}
        <span className="font-semibold text-cpc-navy-text">{student.name}</span> is a{" "}
        <span className="font-semibold text-cpc-navy-text">{student.yearLevel}</span>{" "}
        <span className="font-semibold text-cpc-navy-text">{student.course}</span> student and has
        accounted for all financial and property responsibilities of Cordova Public College.
      </p>

      <div className="mt-6 grid gap-5 lg:grid-cols-2 lg:gap-6">
        <SubjectsTable subjects={mockSubjects} />
        <EventsTable events={mockEvents} />
      </div>
    </section>
  );
}

