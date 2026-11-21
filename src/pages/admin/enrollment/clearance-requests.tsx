import { useAdminAuth } from "@/components/context/AdminAuthContext";
import { EnrollmentSignatureInbox } from "@/components/features/enrollmentWorkflow/EnrollmentSignatureInbox";
import type { EnrollmentSignatureOffice } from "@/services/enrollmentWorkflow/service";
import type { AdminRole } from "@/types/admin";

const ALL_OFFICES: EnrollmentSignatureOffice[] = ["screening", "guidance", "clinic", "registrar", "accounting"];
const OFFICE_BY_ROLE: Partial<Record<AdminRole, EnrollmentSignatureOffice>> = {
  dean_cs: "screening",
  dean_edu: "screening",
  dean_hm: "screening",
  guidance: "guidance",
  clinic: "clinic",
  registrar: "registrar",
  accounting: "accounting",
};

export default function EnrollmentClearanceRequestsPage() {
  const { user } = useAdminAuth();
  if (!user) return null;

  const offices = user.role === "admin"
    ? ALL_OFFICES
    : OFFICE_BY_ROLE[user.role]
      ? [OFFICE_BY_ROLE[user.role] as EnrollmentSignatureOffice]
      : [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-7 rounded-2xl border border-cpc-input-border/70 bg-white p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-cpc-blue-accent">Enrollment · Study Load</p>
        <h1 className="mt-2 text-2xl font-bold text-cpc-navy-text">Request Signatures</h1>
        <p className="mt-2 max-w-3xl text-sm text-cpc-heading-soft">
          Review and sign student Study Load requests. Staff see requests for their assigned office; the Administrator can review all five offices.
        </p>
      </header>
      <div className="space-y-6">
        {offices.map((office) => <EnrollmentSignatureInbox key={office} office={office} />)}
        {offices.length === 0 && (
          <p className="rounded-xl border border-dashed p-6 text-center text-sm text-cpc-heading-soft">Your account is not assigned to an enrollment signature office.</p>
        )}
      </div>
    </div>
  );
}
