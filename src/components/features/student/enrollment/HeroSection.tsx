import { useNavigate } from "react-router";
import { ArrowRight, CheckCircle2, Clock, Ticket } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/context/useAuth";
import { getStudentSession } from "@/services/enrollmentWorkflow/service";

export function HeroSection() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const studentId =
    user?.studentNumber || (user?.role === "student" ? "STU-2026-0042" : undefined);
  const session = studentId ? getStudentSession(studentId) : null;
  const isSubmitted =
    session && (session.form.status === "SUBMITTED" || session.form.status === "APPROVED");
  const ticket = session?.ticket;

  return (
    <section className="enroll-hero font-poppins">
      <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] xl:gap-16">
        <div>
          <p className="enroll-hero-label">
            CORDOVA PUBLIC COLLEGE {isSubmitted && "· CONTINUING ENROLLMENT"}
          </p>
          {isSubmitted ? (
            <>
              <h2 className="enroll-hero-headline">
                Enrollment
                <span className="enroll-hero-headline-accent"> In Progress</span>
              </h2>
              <p className="enroll-hero-description">
                Welcome back, <strong className="text-cpc-navy-deep">{session.student.name}</strong> ({session.student.course} · Year {session.student.yearLevel}). Your enrollment application ({session.form.totalUnits} units) has been submitted for 1st Semester 2026–2027.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate("/student/queue")}
                  className="cpc-btn cpc-btn-primary cpc-btn-lg inline-flex items-center gap-2"
                >
                  <Ticket className="h-4 w-4" />
                  Track Queue & Status
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/student/enrollment-form")}
                  className="rounded-xl border border-cpc-blue-accent/30 bg-white px-5 py-3 text-xs font-bold text-cpc-blue-accent shadow-xs hover:bg-blue-50/50 transition"
                >
                  View Submitted Subjects
                </button>
              </div>
              <div className="enroll-status-line mt-4">
                <Clock className="h-4 w-4 text-amber-500 animate-pulse shrink-0" />
                <span className="text-xs">
                  {session.steps.screening.status === "PENDING"
                    ? "Step 3: Under review by Screening Committee (Dr. Miguel Santos, Dean – College of Computer Studies)"
                    : session.steps.guidance.status === "PENDING"
                    ? "Step 4: Under review by Guidance Office for physical queue clearance"
                    : ticket
                    ? `Queue Ticket #${ticket.number} Issued · Face-to-Face Office Station Progress`
                    : "Enrollment in progress"}
                </span>
                <Badge tone="info" size="sm">Active</Badge>
              </div>
            </>
          ) : (
            <>
              <h2 className="enroll-hero-headline">
                Start Your
                <span className="enroll-hero-headline-accent"> Enrollment</span>
              </h2>
              <p className="enroll-hero-description">
                Fill out required information, select your subjects, and submit your enrollment.
              </p>
              <button
                type="button"
                onClick={() => navigate("/student/verify")}
                className="cpc-btn cpc-btn-primary cpc-btn-lg"
              >
                Start Enrollment
              </button>
              <div className="enroll-status-line">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <span>Enrollment for 1st Semester, A.Y. 2026-2027 is now open</span>
                <Badge tone="success" size="sm">Open</Badge>
              </div>
            </>
          )}
        </div>

        <div className="relative flex min-h-[380px] items-center justify-center py-4 lg:min-h-[420px]">
          <div className="relative z-10 flex w-full max-w-md flex-col gap-5">
            <div className="enroll-floating-card enroll-card w-fit self-end rounded-full px-4 py-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-enroll-text">Slots filling fast:</span>
                <span className="text-xs font-bold text-cpc-navy">82% enrolled</span>
              </div>
              <div className="mt-1 h-1 w-20 rounded-full bg-gray-200">
                <div className="h-1 rounded-full bg-enroll-warning" style={{ width: "82%" }} />
              </div>
            </div>

            <div className="enroll-floating-card enroll-card p-4 sm:ml-6 sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-2">
                <h4 className="enroll-card-title mb-0 text-sm">Enrollment Progress</h4>
                <span className="text-xs font-bold text-cpc-blue-accent">
                  {ticket
                    ? "60% · Face-to-Face"
                    : isSubmitted && session?.steps.screening.status === "APPROVED"
                    ? "50% · Guidance"
                    : isSubmitted
                    ? "37% · Dean Review"
                    : "25%"}
                </span>
              </div>
              <div className="mb-3 flex items-center gap-1 sm:gap-2">
                {[
                  { label: "Verification", done: true },
                  { label: "Subjects", done: Boolean(isSubmitted) },
                  { label: "Screening", done: session?.steps.screening.status === "APPROVED", current: session?.steps.screening.status === "PENDING" },
                  { label: "Ticket", done: Boolean(ticket), current: session?.steps.guidance.status === "PENDING" },
                ].map((step, i) => (
                  <div key={step.label} className="flex min-w-0 flex-1 flex-col items-center">
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                        step.done
                          ? "bg-enroll-success text-white"
                          : step.current
                          ? "bg-cpc-blue-accent text-white ring-2 ring-cpc-blue-accent/30 animate-pulse"
                          : "bg-gray-200 text-enroll-text"
                      }`}
                    >
                      {step.done ? "✓" : i + 1}
                    </div>
                    <span
                      className={`mt-1 text-center text-[9px] leading-tight sm:text-[10px] ${
                        step.current
                          ? "font-bold text-cpc-blue-accent"
                          : step.done
                          ? "font-semibold text-cpc-navy"
                          : "text-enroll-text"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
              <div className="h-1.5 w-full rounded-full bg-gray-200">
                <div
                  className="h-1.5 rounded-full bg-cpc-blue-accent transition-all duration-500"
                  style={{
                    width: ticket
                      ? "65%"
                      : session?.steps.screening.status === "APPROVED"
                      ? "50%"
                      : isSubmitted
                      ? "37%"
                      : "25%",
                  }}
                />
              </div>
            </div>

            <div className="enroll-floating-card enroll-card -ml-2 w-[88%] bg-enroll-hero-bg p-4 sm:-ml-4">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-enroll-success">
                  <CheckCircle2 className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-cpc-navy">
                    {isSubmitted ? "Form Submitted to Dean" : "Application Received"}
                  </p>
                  <p className="text-[10px] text-enroll-text">
                    {isSubmitted ? "Queued for Screening Review" : "Just now"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="enroll-illustration" aria-hidden>
            <svg width="280" height="280" viewBox="0 0 280 280" fill="none">
              <circle cx="140" cy="140" r="120" stroke="currentColor" strokeWidth="1" opacity="0.1" />
              <circle cx="140" cy="140" r="80" stroke="currentColor" strokeWidth="1" opacity="0.05" />
              <circle cx="80" cy="100" r="15" fill="currentColor" opacity="0.1" />
              <circle cx="200" cy="80" r="10" fill="currentColor" opacity="0.08" />
              <circle cx="220" cy="180" r="12" fill="currentColor" opacity="0.06" />
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}