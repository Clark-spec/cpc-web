import { useNavigate } from "react-router";

export function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="enroll-hero mb-12">
      <div className="grid lg:grid-cols-2 gap-10 items-center">
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
            className="enroll-btn-primary"
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
            <span className="enroll-status-badge">Open</span>
          </div>
        </div>

        <div className="relative min-h-[400px]">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-full max-w-sm">
              <div className="enroll-floating-card enroll-card p-5 mb-4 ml-8">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="enroll-card-title text-sm mb-0">Enrollment Progress</h4>
                  <span className="text-xs text-enroll-text">50%</span>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  {["Personal Info", "Subjects", "Requirements", "Confirmation"].map((label, i) => (
                    <div key={label} className="flex-1 flex flex-col items-center">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                        i === 0 ? "bg-enroll-success text-white" :
                        i === 1 ? "bg-enroll-primary text-white" :
                        "bg-gray-200 text-enroll-text"
                      }`}>
                        {i === 0 ? "✓" : i + 1}
                      </div>
                      <span className={`text-[10px] mt-1 text-center ${
                        i === 1 ? "text-enroll-primary font-semibold" : "text-enroll-text"
                      }`}>{label}</span>
                    </div>
                  ))}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div className="bg-enroll-primary h-1.5 rounded-full" style={{ width: "50%" }} />
                </div>
              </div>

              <div className="enroll-floating-card enroll-card p-4 -ml-10 bg-enroll-hero-bg">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-enroll-success flex items-center justify-center">
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

              <div className="enroll-floating-card absolute top-20 right-0 bg-enroll-card border border-enroll-border rounded-full px-4 py-2 shadow-lg">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-enroll-text">Slots filling fast:</span>
                  <span className="text-xs font-bold text-cpc-navy">82% enrolled</span>
                </div>
                <div className="w-20 bg-gray-200 rounded-full h-1 mt-1">
                  <div className="bg-enroll-warning h-1 rounded-full" style={{ width: "82%" }} />
                </div>
              </div>
            </div>
          </div>

          <div className="enroll-illustration">
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