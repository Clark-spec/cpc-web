import type { AppNotification } from "@/components/context/NotificationContext";
import { recordAdminNotification } from "@/services/admin/notifications";
import type { StudentEnrollmentSession } from "@/types/enrollmentWorkflow";

export const STUDENT_NOTIFICATION_STORAGE_KEY = "cpc:notifications:student";
const KEY_SESSIONS = "cpc:enrollment:sessions:v1";

/**
 * Returns stored notifications for student (from student-specific key or default key).
 */
export function getStoredStudentNotifications(storageKey = STUDENT_NOTIFICATION_STORAGE_KEY): AppNotification[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Records a student notification to both the student-specific and shared feed keys,
 * ensuring the notification bell badge increments in real time across tabs and views.
 */
export function recordStudentNotification(
  studentId: string | undefined,
  notification: Omit<AppNotification, "id" | "createdAt" | "read"> & {
    id?: string;
    createdAt?: string;
    read?: boolean;
  },
): void {
  if (typeof window === "undefined") return;

  const entry: AppNotification = {
    id: notification.id || `notif-stu-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    title: notification.title,
    message: notification.message,
    type: notification.type ?? "info",
    createdAt: notification.createdAt || new Date().toISOString(),
    read: notification.read ?? false,
    officeId: notification.officeId,
    href: notification.href,
    local: true,
  };

  const keys = [STUDENT_NOTIFICATION_STORAGE_KEY];
  if (studentId) {
    keys.push(`cpc:notifications:${studentId}`);
  }

  for (const key of keys) {
    try {
      const raw = window.localStorage.getItem(key);
      const existing: AppNotification[] = raw ? JSON.parse(raw) : [];
      // Deduplicate by ID or identical title + message
      const alreadyExists = existing.some(
        (n) => n.id === entry.id || (n.title === entry.title && n.message === entry.message),
      );
      if (!alreadyExists) {
        const next = [entry, ...existing].slice(0, 50);
        window.localStorage.setItem(key, JSON.stringify(next));
      }
    } catch {
      // Ignore storage errors
    }
  }

  // Broadcast to other tabs and current window
  window.dispatchEvent(new Event("storage"));
  window.dispatchEvent(new Event("cpc:student:notification"));
}

/**
 * Reconciles sessions to guarantee that if a student already submitted a form or
 * advanced in the enrollment workflow (e.g. Harry Styles), both student and admin
 * notification bells immediately show the appropriate notification!
 */
export function reconcileAllEnrollmentNotifications(): void {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(KEY_SESSIONS);
    if (!raw) return;
    const sessions: Record<string, StudentEnrollmentSession> = JSON.parse(raw);

    for (const session of Object.values(sessions)) {
      if (!session || !session.student) continue;

      const studentId = session.student.studentIdNo;
      const studentName = session.student.name;
      const dept = session.student.department;

      // 1. Submitted Enrollment Form
      if (session.form?.status === "SUBMITTED" || session.form?.status === "APPROVED") {
        recordStudentNotification(studentId, {
          id: `enrollment-submitted-${session.form?.id || studentId}`,
          title: "Enrollment Form Submitted",
          message: `Your subjects for 1st Sem 2026-2027 (${session.form?.totalUnits ?? 0} units) have been submitted and are queued for Screening Committee review.`,
          type: "info",
          href: "/student/queue",
        });

        recordAdminNotification({
          title: "New Enrollment Form Submitted",
          message: `${studentName} (${dept}) submitted their enrollment form (${session.form?.totalUnits ?? 0} units). Queued for Screening Committee review.`,
          type: "info",
          href: "/committee/screening",
          department: dept,
          targetRole: dept === "BSIT" ? "dean_cs" : dept === "BEED" ? "dean_edu" : "dean_hm",
        });
      }

      // 2. Screening Approved
      if (session.steps?.screening?.status === "APPROVED") {
        recordStudentNotification(studentId, {
          id: `screening-approved-${session.form?.id || studentId}`,
          title: "Screening Review Approved",
          message: `Your enrollment subjects have been verified and approved by the Screening Committee. Forwarded for queue ticket issuance.`,
          type: "success",
          href: "/student/queue",
        });
      }

      // 3. Queue Ticket Issued
      if (session.ticket) {
        recordStudentNotification(studentId, {
          id: `ticket-issued-${session.ticket.number}`,
          title: "Queue Ticket Issued",
          message: `Your physical enrollment ticket #${session.ticket.number} has been issued! Current station: Clinic (Station 1).`,
          type: "info",
          href: "/student/queue",
        });
      }

      // 4. Official Enrollment Confirmed
      if (session.steps?.registrar?.status === "APPROVED") {
        recordStudentNotification(studentId, {
          id: `official-enrolled-${studentId}`,
          title: "Official Enrollment Confirmed!",
          message: `Congratulations ${studentName}! You are officially enrolled for 1st Semester 2026-2027. Your Certificate of Registration (COR) is ready.`,
          type: "success",
          href: "/student/queue",
        });
      }
    }
  } catch {
    // Ignore reconciliation failures
  }
}
