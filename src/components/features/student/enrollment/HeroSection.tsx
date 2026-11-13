import { useNavigate } from "react-router";
import { Badge } from "@/components/ui/badge";

export function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="enroll-hero">
      <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] xl:gap-16">
        <div>
          <p className="enroll-hero-label">CORDOVA PUBLIC COLLEGE</p>
          <h2 className="enroll-hero-headline">
            Start Your
            <span className="enroll-hero-headline-accent"> Enrollment</span>
          </h2>
          <p className="enroll-hero-description">
            Fill out required information, select your subjects, and submit your enrollment.
          </p>
          <button
            onClick={() => navigate("/online-enrollment/step/1")}
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
                <span className="text-xs text-enroll-text">50%</span>
              </div>
              <div className="mb-3 flex items-center gap-1 sm:gap-2">
                {["Personal Info", "Subjects", "Requirements", "Confirmation"].map((label, i) => (
                  <div key={label} className="flex min-w-0 flex-1 flex-col items-center">
                    <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                      i === 0 ? "bg-enroll-success text-white" :
                      i === 1 ? "bg-enroll-primary text-white" :
                      "bg-gray-200 text-enroll-text"
                    }`}>
                      {i === 0 ? "✓" : i + 1}
                    </div>
                    <span className={`mt-1 text-center text-[9px] leading-tight sm:text-[10px] ${
                      i === 1 ? "font-semibold text-enroll-primary" : "text-enroll-text"
                    }`}>{label}</span>
                  </div>
                ))}
              </div>
              <div className="h-1.5 w-full rounded-full bg-gray-200">
                <div className="h-1.5 rounded-full bg-enroll-primary" style={{ width: "50%" }} />
              </div>
            </div>

            <div className="enroll-floating-card enroll-card -ml-2 w-[88%] bg-enroll-hero-bg p-4 sm:-ml-4">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-enroll-success">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20,6 9,17 4,12" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-semibold text-cpc-navy">Application Received</p>
                  <p className="text-[10px] text-enroll-text">Just now</p>
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