import { useEffect } from "react";

const ENROLLMENT_DATA_KEY = "cpc_enrollment_data";

/** Logs the enrollment payload saved by the flow when the receipt opens. */
export function useLogEnrollmentSubmission(): void {
  useEffect(() => {
    const enrollmentData = localStorage.getItem(ENROLLMENT_DATA_KEY);
    if (enrollmentData) {
      console.log("Enrollment submitted:", JSON.parse(enrollmentData));
    }
  }, []);
}
