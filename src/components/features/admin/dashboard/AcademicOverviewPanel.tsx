import { ArrowRight, BookOpen, CheckCircle2, Clock3, GraduationCap, MapPin, Users } from "lucide-react";
import { Link } from "react-router";
import { Badge } from "@/components/ui/badge";
import type { AdminUser } from "@/types/admin";

type AcademicOverviewPanelProps = {
  user: AdminUser;
};

export function AcademicOverviewPanel({ user }: AcademicOverviewPanelProps) {
  const isInstructor = user.role === "instructor";
  const programPrefix =
    user.role === "dean_cs"
      ? "BSIT"
      : user.role === "dean_edu"
        ? "BEED"
        : user.role === "dean_hm"
          ? "BSHM"
          : "BSIT";

  if (isInstructor) {
    const teachingClasses = [
      {
        code: "IT 311",
        title: "Advanced Database Systems",
        section: "BSIT-3A",
        schedule: "MWF 08:00 AM - 09:30 AM",
        room: "Computer Lab 3",
        units: "3.0 Units",
      },
      {
        code: "CC 106",
        title: "Application Dev & Emerging Tech",
        section: "BSIT-3A",
        schedule: "TTH 10:00 AM - 11:30 AM",
        room: "Computer Lab 2",
        units: "3.0 Units",
      },
      {
        code: "IT 312",
        title: "Web Systems and Technologies",
        section: "BSIT-3B",
        schedule: "MWF 01:00 PM - 02:30 PM",
        room: "Computer Lab 1",
        units: "3.0 Units",
      },
    ];

    return (
      <section
        aria-labelledby="academic-overview-heading"
        className="flex flex-col justify-between overflow-hidden rounded-2xl border border-white/80 bg-white/75 shadow-[0_8px_30px_rgb(15,36,104,0.04)] backdrop-blur-md transition-all duration-200 hover:shadow-[0_16px_40px_rgba(15,36,104,0.08)] xl:col-span-8"
      >
        <div className="flex flex-wrap items-start justify-between gap-2 border-b border-cpc-tile-border/50 bg-white/40 px-5 py-4 backdrop-blur-xs">
          <div>
            <h2
              id="academic-overview-heading"
              className="font-poppins text-sm font-semibold text-cpc-navy-text"
            >
              My Teaching Load & Timetable
            </h2>
            <p className="font-poppins text-[11px] text-cpc-heading-soft">
              Active class assignments, lecture rooms, and schedule slots for AY 2026-2027.
            </p>
          </div>
          <Link
            to="/admin/academics/class-schedules"
            className="inline-flex items-center gap-1 font-poppins text-[11px] font-semibold text-cpc-blue-accent underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
          >
            View full schedule
            <ArrowRight className="h-3 w-3" aria-hidden />
          </Link>
        </div>

        <div className="flex flex-1 flex-col justify-between gap-4 p-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-white/80 bg-white/80 p-3 shadow-xs">
              <span className="font-poppins text-[10px] font-medium text-cpc-heading-soft uppercase">
                Total Teaching Load
              </span>
              <p className="mt-1 font-poppins text-lg font-bold text-cpc-navy-text">
                18.0 <span className="text-xs font-normal text-cpc-heading-soft">Units</span>
              </p>
            </div>
            <div className="rounded-xl border border-white/80 bg-white/80 p-3 shadow-xs">
              <span className="font-poppins text-[10px] font-medium text-cpc-heading-soft uppercase">
                Assigned Classes
              </span>
              <p className="mt-1 font-poppins text-lg font-bold text-cpc-navy-text">
                3 <span className="text-xs font-normal text-cpc-heading-soft">Sections</span>
              </p>
            </div>
            <div className="rounded-xl border border-white/80 bg-white/80 p-3 shadow-xs">
              <span className="font-poppins text-[10px] font-medium text-cpc-heading-soft uppercase">
                Weekly Hours
              </span>
              <p className="mt-1 font-poppins text-lg font-bold text-cpc-navy-text">
                18 <span className="text-xs font-normal text-cpc-heading-soft">Hours</span>
              </p>
            </div>
            <div className="rounded-xl border border-emerald-200/60 bg-emerald-50/80 p-3 shadow-xs">
              <span className="font-poppins text-[10px] font-medium text-emerald-700 uppercase">
                Schedule Status
              </span>
              <div className="mt-1 flex items-center gap-1.5 font-poppins text-sm font-bold text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                Active & Published
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-poppins text-xs font-semibold text-cpc-navy-text">
              Assigned Classes Today
            </h3>
            <div className="grid gap-2">
              {teachingClasses.map((cls) => (
                <div
                  key={cls.code}
                  className="flex flex-col justify-between gap-2 rounded-xl border border-cpc-tile-border/50 bg-white/90 p-3 transition-all hover:border-cpc-blue-accent/40 sm:flex-row sm:items-center"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cpc-section-light text-cpc-blue-accent">
                      <BookOpen className="h-4 w-4" />
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-poppins text-xs font-bold text-cpc-navy-text">
                          {cls.code}
                        </span>
                        <Badge tone="info" size="sm">
                          {cls.section}
                        </Badge>
                      </div>
                      <p className="font-poppins text-[11px] text-cpc-heading-soft">
                        {cls.title}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-cpc-heading-soft">
                    <span className="inline-flex items-center gap-1">
                      <Clock3 className="h-3.5 w-3.5 text-cpc-blue-accent" />
                      {cls.schedule}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-rose-500" />
                      {cls.room}
                    </span>
                    <Badge tone="neutral" size="sm">
                      {cls.units}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Academic Dean view
  const departmentSections = [
    { name: `${programPrefix}-1A`, year: "1st Year", count: 45, shift: "Morning", status: "Published" },
    { name: `${programPrefix}-2A`, year: "2nd Year", count: 42, shift: "Morning", status: "Published" },
    { name: `${programPrefix}-3A`, year: "3rd Year", count: 38, shift: "Afternoon", status: "Published" },
    { name: `${programPrefix}-4A`, year: "4th Year", count: 35, shift: "Afternoon", status: "Published" },
  ];

  return (
    <section
      aria-labelledby="academic-overview-heading"
      className="flex flex-col justify-between overflow-hidden rounded-2xl border border-white/80 bg-white/75 shadow-[0_8px_30px_rgb(15,36,104,0.04)] backdrop-blur-md transition-all duration-200 hover:shadow-[0_16px_40px_rgba(15,36,104,0.08)] xl:col-span-8"
    >
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-cpc-tile-border/50 bg-white/40 px-5 py-4 backdrop-blur-xs">
        <div>
          <h2
            id="academic-overview-heading"
            className="font-poppins text-sm font-semibold text-cpc-navy-text"
          >
            Academic Timetable & Department Status
          </h2>
          <p className="font-poppins text-[11px] text-cpc-heading-soft">
            Section timetables, faculty assignments, and schedule readiness for {user.title}.
          </p>
        </div>
        <Link
          to="/admin/academics/class-schedules"
          className="inline-flex items-center gap-1 font-poppins text-[11px] font-semibold text-cpc-blue-accent underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
        >
          Manage schedules
          <ArrowRight className="h-3 w-3" aria-hidden />
        </Link>
      </div>

      <div className="flex flex-1 flex-col justify-between gap-4 p-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-white/80 bg-white/80 p-3 shadow-xs">
            <span className="font-poppins text-[10px] font-medium text-cpc-heading-soft uppercase">
              Active Sections
            </span>
            <p className="mt-1 font-poppins text-lg font-bold text-cpc-navy-text">
              {departmentSections.length}{" "}
              <span className="text-xs font-normal text-cpc-heading-soft">Sections</span>
            </p>
          </div>
          <div className="rounded-xl border border-white/80 bg-white/80 p-3 shadow-xs">
            <span className="font-poppins text-[10px] font-medium text-cpc-heading-soft uppercase">
              Total Enrolled
            </span>
            <p className="mt-1 font-poppins text-lg font-bold text-cpc-navy-text">
              160 <span className="text-xs font-normal text-cpc-heading-soft">Students</span>
            </p>
          </div>
          <div className="rounded-xl border border-white/80 bg-white/80 p-3 shadow-xs">
            <span className="font-poppins text-[10px] font-medium text-cpc-heading-soft uppercase">
              Assigned Faculty
            </span>
            <p className="mt-1 font-poppins text-lg font-bold text-cpc-navy-text">
              12 <span className="text-xs font-normal text-cpc-heading-soft">Instructors</span>
            </p>
          </div>
          <div className="rounded-xl border border-emerald-200/60 bg-emerald-50/80 p-3 shadow-xs">
            <span className="font-poppins text-[10px] font-medium text-emerald-700 uppercase">
              Schedule Version
            </span>
            <div className="mt-1 flex items-center gap-1.5 font-poppins text-sm font-bold text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              Published (Official)
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="font-poppins text-xs font-semibold text-cpc-navy-text">
            Department Section Status
          </h3>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {departmentSections.map((sec) => (
              <div
                key={sec.name}
                className="flex items-center justify-between rounded-xl border border-cpc-tile-border/50 bg-white/80 p-3 transition-all hover:border-cpc-blue-accent/30"
              >
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                    <GraduationCap className="h-4 w-4" />
                  </span>
                  <div>
                    <span className="font-poppins text-xs font-bold text-cpc-navy-text">
                      {sec.name}
                    </span>
                    <p className="font-poppins text-[10px] text-cpc-heading-soft">
                      {sec.year} • {sec.shift} Shift
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 font-poppins text-[11px] font-medium text-cpc-heading-soft">
                    <Users className="h-3 w-3" />
                    {sec.count}
                  </span>
                  <Badge tone="success" size="sm">
                    {sec.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
