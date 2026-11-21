import { useState, useEffect } from "react";
import { Link } from "react-router";
import { ArrowRightIcon } from "@/components/common/display/icons";
import { CheckCircle2, Ticket, Clock } from "lucide-react";
import ctaBuilding from "@/assets/cta-building.png";
import { useAuth } from "@/components/context/useAuth";
import {
  getStudentSession,
  subscribeToEnrollmentQueue,
} from "@/services/enrollmentWorkflow/service";

export function CtaSection() {
  const { user } = useAuth();
  const studentId = user?.studentNumber || "2024-00012";

  const [session, setSession] = useState(() => getStudentSession(studentId));

  useEffect(() => {
    const unsub = subscribeToEnrollmentQueue(() => {
      setSession(getStudentSession(studentId));
    });
    return unsub;
  }, [studentId]);

  const isEnrolled = session.steps.registrar.status === "APPROVED";
  const hasTicket = Boolean(session.ticket);
  const isUnderReview = session.form.status === "SUBMITTED" && !hasTicket;
  const isVerified = session.steps.verification.status === "APPROVED" && !isUnderReview && !hasTicket && !isEnrolled;

  return (
    <section aria-label="Get started" className="w-full bg-white">
      <div className="relative mx-auto flex w-full max-w-[1440px] flex-col items-start gap-[28px] overflow-hidden px-5 py-12 sm:px-8 lg:h-[300px] lg:flex-row lg:items-center lg:justify-between lg:gap-[48px] lg:px-[86px] lg:py-0">
        <div className="font-poppins">
          <p className="text-[11px] leading-[14px] font-bold tracking-[0.12em] text-cpc-navy-text uppercase">
            {isEnrolled
              ? "Enrollment Confirmed"
              : hasTicket
                ? "Queue Ticket Active"
                : isUnderReview
                  ? "Enrollment Pending Review"
                  : "Get Started"}
          </p>

          <h2 className="mt-[10px] text-[26px] leading-[34px] font-bold text-cpc-navy-text sm:text-[30px] sm:leading-[38px] lg:text-[34px] lg:leading-[42px]">
            {isEnrolled ? (
              <>
                You are Enrolled for
                <br />
                Academic Year 2026-2027
              </>
            ) : hasTicket ? (
              <>
                Proceed to Your
                <br />
                Scheduled On-Campus Stations
              </>
            ) : (
              <>
                Continue Your Journey
                <br />
                at Cordova Public College
              </>
            )}
          </h2>

          <p className="mt-[12px] text-[14px] leading-[23px] font-normal text-[#1f2a6b] lg:text-[15px] lg:leading-[24px]">
            {isEnrolled ? (
              "Your Certificate of Registration (COR) has been issued. Check your timetable and classes."
            ) : hasTicket ? (
              `Ticket ${session.ticket?.number} is ready. Follow your schedule for Clinic, Accounting, and Registrar.`
            ) : isUnderReview ? (
              "Your enrollment form is currently being reviewed by the Screening Committee and Guidance."
            ) : (
              <>
                Join a community of learners, dreamers, and achievers.
                <br />
                Your future starts here.
              </>
            )}
          </p>

          <div className="mt-[22px] flex flex-wrap items-center gap-3">
            {isEnrolled ? (
              <>
                <Link
                  to="/student/queue"
                  className="cpc-btn cpc-btn-primary inline-flex items-center gap-2"
                >
                  <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                  View Completed Enrollment
                </Link>
                <Link
                  to="/academics/class-schedules"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-cpc-tile-border/80 bg-white px-4 py-2 font-poppins text-xs font-semibold text-cpc-navy hover:bg-slate-50 transition"
                >
                  Class Schedules
                  <ArrowRightIcon className="h-3.5 w-3.5" />
                </Link>
              </>
            ) : hasTicket ? (
              <Link
                to="/student/queue"
                className="cpc-btn cpc-btn-primary inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
              >
                <Ticket className="h-4 w-4" />
                Clearance Signatures · Ticket {session.ticket?.number}
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            ) : isUnderReview ? (
              <Link
                to="/student/enrollment-form"
                className="cpc-btn cpc-btn-primary inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700"
              >
                <Clock className="h-4 w-4" />
                Check Screening Status
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            ) : isVerified ? (
              <Link
                to="/student/enrollment-form"
                className="cpc-btn cpc-btn-primary inline-flex items-center gap-2"
              >
                Complete Enrollment Form
                <ArrowRightIcon className="h-[18px] w-[18px]" />
              </Link>
            ) : (
              <Link
                to="/student/verify"
                className="cpc-btn cpc-btn-primary inline-flex items-center gap-2"
              >
                Enroll Now
                <ArrowRightIcon className="h-[18px] w-[18px]" />
              </Link>
            )}
          </div>
        </div>

        <div className="relative h-[200px] w-full shrink-0 sm:h-[240px] lg:h-[236px] lg:w-[520px]">
          <div
            aria-hidden
            className="absolute -top-[16px] -right-[16px] hidden h-[120px] w-[120px] rounded-[18px] border border-cpc-tile-border/60 lg:block"
          />
          <img
            src={ctaBuilding}
            alt="Aerial view of the Cordova Public College campus"
            className="relative h-full w-full rounded-[18px] object-cover shadow-[0_18px_40px_rgba(27,47,158,0.18)]"
          />
        </div>
      </div>
    </section>
  );
}
