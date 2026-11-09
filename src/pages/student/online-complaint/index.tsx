import { useMemo, useState } from "react";
import { PortalFooter } from "@/components/common/PortalFooter";
import { PortalHeader } from "@/components/common/PortalHeader";
import { ToastProvider } from "@/components/ui/toast";
import { ComplaintForm } from "@/components/features/student/complaints/ComplaintForm";
import { ComplaintHero } from "@/components/features/student/complaints/ComplaintHero";
import { ComplaintTable } from "@/components/features/student/complaints/ComplaintTable";
import {
  MOCK_COMPLAINTS,
  getSubmissionCooldownUntil,
  loadSubmittedComplaints,
  nextComplaintReference,
  saveSubmittedComplaints,
} from "@/components/features/student/complaints/mockComplaints";
import type {
  Complaint,
  ComplaintFormValues,
} from "@/components/features/student/complaints/types";

/** Route: /student-support/online-complaint */
export default function OnlineComplaintPage() {
  const [submittedComplaints, setSubmittedComplaints] =
    useState<Complaint[]>(loadSubmittedComplaints);

  const complaints = useMemo(
    () => [...submittedComplaints, ...MOCK_COMPLAINTS],
    [submittedComplaints],
  );

  const cooldownUntil = useMemo(
    () => getSubmissionCooldownUntil(submittedComplaints),
    [submittedComplaints],
  );

  function handleSubmit(values: ComplaintFormValues): string {
    const referenceNumber = nextComplaintReference(complaints);
    const filedAt = new Date().toISOString();

    const complaint: Complaint = {
      id: `${referenceNumber}-${filedAt}`,
      referenceNumber,
      subject: values.subject,
      category: values.category,
      filedAt,
      status: "pending",
      anonymous: values.anonymous,
    };

    const next = [complaint, ...submittedComplaints];
    setSubmittedComplaints(next);
    saveSubmittedComplaints(next);

    return referenceNumber;
  }

  return (
    <ToastProvider>
      <div className="min-h-screen w-full overflow-x-hidden bg-white font-poppins">
        <PortalHeader />
        <ComplaintHero />

        <main className="mx-auto w-full max-w-[1280px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <ComplaintForm onSubmit={handleSubmit} cooldownUntil={cooldownUntil} />
          <div className="mt-6">
            <ComplaintTable complaints={complaints} />
          </div>
        </main>

        <PortalFooter />
      </div>
    </ToastProvider>
  );
}
