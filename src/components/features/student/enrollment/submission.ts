const SUBMISSION_KEY = "cpc_enrollment_submission";

export type EnrollmentSubmission = {
  referenceNumber: string;
  submittedAt: string;
};

/** Reads the locally stored submission receipt, if the student already submitted. */
export function readEnrollmentSubmission(): EnrollmentSubmission | null {
  try {
    const raw = window.localStorage.getItem(SUBMISSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<EnrollmentSubmission>;
    if (typeof parsed.referenceNumber !== "string" || !parsed.referenceNumber) return null;
    return {
      referenceNumber: parsed.referenceNumber,
      submittedAt:
        typeof parsed.submittedAt === "string" ? parsed.submittedAt : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

/** Creates the receipt once so a refresh shows the same reference number. */
export function saveEnrollmentSubmission(): EnrollmentSubmission {
  const existing = readEnrollmentSubmission();
  if (existing) return existing;

  const submission: EnrollmentSubmission = {
    referenceNumber: `ENR${new Date().getFullYear()}-${Math.floor(Math.random() * 90_000 + 10_000)}`,
    submittedAt: new Date().toISOString(),
  };
  try {
    window.localStorage.setItem(SUBMISSION_KEY, JSON.stringify(submission));
  } catch {
    // The receipt still renders; it just will not survive a refresh.
  }
  return submission;
}
