import {
  AlertTriangle,
  Award,
  BookOpen,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileText,
  GraduationCap,
  ShieldCheck,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import cpcLogo from "@/assets/cpc-logo.jpg";
import { EventsTable } from "@/components/common/display/EventsTable";
import { SubjectsTable } from "@/components/common/display/SubjectsTable";
import { Badge } from "@/components/ui/badge";
import { useClearance } from "@/components/features/student/clearance/ClearanceContext";
import { mockEvents, mockSubjects, officeSignerNames } from "@/services/clearanceStudent/mock";
import { formatDate, formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { OfficeId, OfficeSignature } from "@/types/clearance";

const HANDWRITING = '"Dancing Script", "Segoe Script", cursive';

const OFFICE_METADATA: Record<
  OfficeId,
  { number: number; roleTitle: string; icon: LucideIcon }
> = {
  instructor: { number: 1, roleTitle: "Department Faculty / Instructor", icon: GraduationCap },
  dean: { number: 2, roleTitle: "Dean of Academic Affairs", icon: Award },
  library: { number: 3, roleTitle: "College Head Librarian", icon: BookOpen },
  registrar: { number: 4, roleTitle: "College Registrar", icon: FileText },
  accounting: { number: 5, roleTitle: "Accounting & Finance Officer", icon: CreditCard },
  sao: { number: 6, roleTitle: "SAO / SSG Adviser", icon: Users },
};

function ReadOnlyCheck({ label, checked }: { label: string; checked: boolean }) {
  return (
    <label className="flex items-center gap-2 py-0.5 font-poppins text-xs text-cpc-label">
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

function getDesignatedSigner(office: OfficeSignature, program?: string): string {
  if (office.signerName) return office.signerName;
  if (office.office === "dean") {
    const prog = (program ?? "").toLowerCase();
    if (prog.includes("education") || prog.includes("beed")) return "Dr. Carmen Ramos";
    if (prog.includes("hospitality") || prog.includes("bshm")) return "Prof. Elena Valdez";
    return "Dr. Miguel Santos";
  }
  return officeSignerNames[office.office] ?? office.label;
}

function FormOfficeSignatureSlot({
  office,
  program,
}: {
  office: OfficeSignature;
  program?: string;
}) {
  const meta = OFFICE_METADATA[office.office] ?? {
    number: 0,
    roleTitle: `${office.label} Signatory`,
    icon: FileText,
  };
  const Icon = meta.icon;
  const isSigned = office.status === "signed";
  const isRequested = office.status === "requested";
  const isRejected = office.status === "rejected";
  const signerName = getDesignatedSigner(office, program);

  return (
    <div
      className={cn(
        "flex flex-col justify-between rounded-xl border p-3.5 transition-all duration-200",
        isSigned
          ? "border-emerald-200 bg-emerald-50/30"
          : isRequested
            ? "border-amber-200/80 bg-amber-50/20"
            : isRejected
              ? "border-rose-200/80 bg-rose-50/20"
              : "border-dashed border-cpc-tile-border/70 bg-white/60",
      )}
    >
      {/* Office Header */}
      <div className="flex items-center justify-between gap-2 border-b border-cpc-tile-border/40 pb-2">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={cn(
              "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold shadow-2xs gap-0.5",
              isSigned
                ? "bg-emerald-100 text-emerald-800"
                : isRequested
                  ? "bg-amber-100 text-amber-800"
                  : isRejected
                    ? "bg-rose-100 text-rose-800"
                    : "bg-cpc-section-light text-cpc-navy-text",
            )}
          >
            <Icon className="h-3 w-3" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="truncate font-poppins text-xs font-bold text-cpc-navy-text">
              {meta.number}. {office.label}
            </p>
            <p className="truncate font-poppins text-[10px] text-cpc-heading-soft">
              {meta.roleTitle}
            </p>
          </div>
        </div>

        <div className="shrink-0">
          {isSigned ? (
            <Badge tone="success" size="sm" className="shadow-2xs">
              CLEARED
            </Badge>
          ) : isRequested ? (
            <Badge tone="warning" size="sm" pulse className="shadow-2xs">
              AWAITING
            </Badge>
          ) : isRejected ? (
            <Badge tone="danger" size="sm" className="shadow-2xs">
              ACTION REQ.
            </Badge>
          ) : (
            <Badge tone="neutral" size="sm" className="shadow-2xs">
              NOT SENT
            </Badge>
          )}
        </div>
      </div>

      {/* Signature & Endorsement Display Area */}
      <div className="my-2.5 flex min-h-[72px] flex-col items-center justify-center rounded-lg border border-white/80 bg-white/70 p-2 text-center">
        {isSigned ? (
          <div className="flex w-full flex-col items-center justify-center">
            {office.signatureImage ? (
              <img
                src={office.signatureImage}
                alt={`${office.signerName ?? office.label} digital signature`}
                className="h-10 max-w-full object-contain drop-shadow-xs"
              />
            ) : (
              <span
                aria-hidden
                className="text-lg leading-tight text-cpc-navy-text"
                style={{ fontFamily: HANDWRITING }}
              >
                {signerName}
              </span>
            )}
            <p className="mt-1 font-mono text-[9px] font-semibold text-emerald-800">
              Digitally Signed · {formatDate(office.respondedAt ?? new Date().toISOString())}
            </p>
          </div>
        ) : isRequested ? (
          <div className="flex flex-col items-center justify-center gap-1">
            <Clock3 className="h-4 w-4 animate-spin text-amber-600" aria-hidden />
            <p className="font-poppins text-[10.5px] font-semibold text-amber-900">
              Pending Review
            </p>
            <p className="font-poppins text-[9.5px] text-amber-700/80">
              Submitted {formatRelativeTime(office.requestedAt ?? new Date().toISOString())}
            </p>
          </div>
        ) : isRejected ? (
          <div className="flex flex-col items-center justify-center gap-1">
            <AlertTriangle className="h-4 w-4 text-rose-600" aria-hidden />
            <p className="font-poppins text-[10.5px] font-semibold text-rose-900">
              Action Required
            </p>
            <p
              className="max-w-full truncate font-poppins text-[9.5px] text-rose-700 px-1"
              title={office.remarks}
            >
              “{office.remarks ?? "Requirements pending"}”
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-0.5">
            <p className="font-poppins text-[10.5px] font-medium text-cpc-heading-soft/70">
              Not Requested Yet
            </p>
            <p className="font-poppins text-[9.5px] text-cpc-label/60">
              Send request in Office Signatures below
            </p>
          </div>
        )}
      </div>

      {/* Official Signatory Name & Verification Line */}
      <div className="border-t border-cpc-tile-border/30 pt-1.5 text-center">
        <p className="truncate font-poppins text-[11px] font-bold text-cpc-navy-text uppercase tracking-wide">
          {signerName}
        </p>
        <p className="font-poppins text-[9.5px] text-cpc-heading-soft">
          Designated Signatory
        </p>
      </div>
    </div>
  );
}

/** Section 3: The printed Form 3 layout, filled dynamically from the clearance state. */
export function ClearanceForm() {
  const { student, offices, isCleared, referenceNumber, dateCleared } = useClearance();

  const signedCount = offices.filter((office) => office.status === "signed").length;

  return (
    <section
      aria-labelledby="form-heading"
      className="rounded-2xl border border-white/80 bg-white/90 p-6 shadow-[0_8px_30px_rgb(15,36,104,0.04)] backdrop-blur-md sm:p-7 lg:p-8"
    >
      <h2 id="form-heading" className="sr-only">
        Student's Clearance Form 3
      </h2>

      {/* Form Header */}
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

      {/* Student Certification Statement */}
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

      {/* Part I & II: Academic Subjects and SAO Events Tables */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <SubjectsTable subjects={mockSubjects} />
        <EventsTable events={mockEvents} />
      </div>

      {/* Part III: Department Clearance Endorsements & Digital Signatures */}
      <div className="mt-8 border-t border-cpc-tile-border/60 pt-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="flex items-center gap-2 font-poppins text-sm font-bold tracking-wide uppercase text-cpc-navy-text">
              <ShieldCheck className="h-4 w-4 text-cpc-blue-accent" aria-hidden />
              Part III · Official Department Endorsements &amp; Signatures
            </h3>
            <p className="mt-0.5 font-poppins text-xs text-cpc-heading-soft">
              Form 3 official certifications from designated college authorities. All 6 offices must clear and sign.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              tone={isCleared ? "success" : "neutral"}
              dot={false}
              className="shadow-2xs"
            >
              {signedCount} of {offices.length} Endorsed
            </Badge>
          </div>
        </div>

        {/* 6 Office Signatory Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {offices.map((office) => (
            <FormOfficeSignatureSlot
              key={office.office}
              office={office}
              program={student.program}
            />
          ))}
        </div>

        {/* Institutional Verification Footer Banner */}
        <div className="mt-6">
          {isCleared ? (
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-emerald-300/80 bg-emerald-50/70 p-4 shadow-xs">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
                  <CheckCircle2 className="h-6 w-6" aria-hidden />
                </span>
                <div>
                  <p className="font-poppins text-xs font-bold uppercase tracking-wider text-emerald-950">
                    Official Clearance Complete &amp; Verified
                  </p>
                  <p className="font-poppins text-[11px] text-emerald-800">
                    Form 3 is officially cleared for enrollment, transcript release, and graduation.
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="font-mono text-xs font-bold text-emerald-900">
                  REF: {referenceNumber}
                </span>
                {dateCleared && (
                  <p className="font-poppins text-[10px] text-emerald-700">
                    Cleared on {formatDate(dateCleared)}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-cpc-tile-border/60 bg-cpc-section-light/60 p-3.5 font-poppins text-xs text-cpc-heading-soft">
              <div className="flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-amber-600 shrink-0" aria-hidden />
                <span>
                  <strong>Form 3 Status:</strong> In Progress ({signedCount} of {offices.length} departments signed).
                  Use the Office Signatures section below to submit signature requests.
                </span>
              </div>
              <span className="text-[11px] text-cpc-label font-medium">
                Cordova Public College · Office of the Registrar
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
