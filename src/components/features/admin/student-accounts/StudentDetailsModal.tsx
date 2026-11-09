import { useId } from "react";
import { Modal } from "@/components/ui/modal";
import { StudentStatusBadge } from "@/components/features/admin/student-accounts/statusBadges";
import { BTN, sectionText } from "@/components/features/admin/student-accounts/shared";
import { COURSE_LABELS } from "@/components/features/admin/student-accounts/mockStudentAccounts";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { StudentRecord } from "@/components/features/admin/student-accounts/types";

type StudentDetailsModalProps = {
  student: StudentRecord;
  onClose: () => void;
};

function Detail({
  label,
  value,
  wide = false,
}: {
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <div className={cn("min-w-0", wide && "sm:col-span-2")}>
      <dt className="font-poppins text-[10px] text-cpc-heading-soft">{label}</dt>
      <dd className="font-poppins text-xs font-semibold break-words text-cpc-navy-text">
        {value}
      </dd>
    </div>
  );
}

/** Read-only student record, reached from the directory's View action. */
export function StudentDetailsModal({ student, onClose }: StudentDetailsModalProps) {
  const headingId = useId();

  return (
    <Modal open onClose={onClose} labelledBy={headingId} className="sm:max-w-2xl">
      <header className="border-b border-cpc-tile-border/60 px-5 py-4 pr-12">
        <p className="font-poppins text-[10px] font-bold tracking-[0.14em] text-cpc-blue-accent uppercase">
          {student.studentId}
        </p>
        <h2
          id={headingId}
          className="mt-1 font-poppins text-lg leading-snug font-bold text-cpc-navy-text"
        >
          {student.fullName}
        </h2>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <StudentStatusBadge status={student.status} />
          <span className="font-poppins text-[11px] text-cpc-heading-soft">
            {student.course} · {sectionText(student.year, student.section)}
          </span>
        </div>
      </header>

      <div className="space-y-4 px-5 py-4">
        <section
          aria-labelledby={`${headingId}-academic`}
          className="rounded-xl border border-cpc-tile-border/70 bg-cpc-section-light/40 p-4"
        >
          <h3
            id={`${headingId}-academic`}
            className="font-poppins text-[10px] font-bold tracking-[0.12em] text-cpc-heading-soft uppercase"
          >
            Academic information
          </h3>
          <dl className="mt-2.5 grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
            <Detail label="Student ID" value={student.studentId} />
            <Detail label="Course" value={COURSE_LABELS[student.course]} />
            <Detail label="Year and section" value={sectionText(student.year, student.section)} />
            <Detail label="Enrolled on" value={formatDate(student.enrolledAt)} />
          </dl>
        </section>

        <section aria-labelledby={`${headingId}-contact`}>
          <h3
            id={`${headingId}-contact`}
            className="mb-2 font-poppins text-[10px] font-bold tracking-[0.12em] text-cpc-heading-soft uppercase"
          >
            Contact details
          </h3>
          <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
            <Detail label="Email address" value={student.email} />
            <Detail label="Contact number" value={student.contactNumber} />
            <Detail label="Home address" value={student.address} wide />
          </dl>
        </section>

        <section aria-labelledby={`${headingId}-personal`}>
          <h3
            id={`${headingId}-personal`}
            className="mb-2 font-poppins text-[10px] font-bold tracking-[0.12em] text-cpc-heading-soft uppercase"
          >
            Personal details
          </h3>
          <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
            <Detail label="Date of birth" value={formatDate(student.birthDate)} />
            <Detail label="Guardian" value={student.guardianName} />
          </dl>
        </section>
      </div>

      <footer className="sticky bottom-0 flex justify-end border-t border-cpc-tile-border/60 bg-white px-5 py-4">
        <button
          type="button"
          onClick={onClose}
          className={cn(BTN, "border border-cpc-tile-border text-cpc-navy-text hover:bg-cpc-section-light")}
        >
          Close
        </button>
      </footer>
    </Modal>
  );
}
