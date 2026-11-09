import { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  GraduationCap,
  Monitor,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { PageBanner } from "@/components/common/display/PageBanner";
import { StudentDetailsModal } from "@/components/features/admin/student-accounts/StudentDetailsModal";
import { StudentsTable } from "@/components/features/admin/student-accounts/StudentsTable";
import { StudentsToolbar } from "@/components/features/admin/student-accounts/StudentsToolbar";
import { SummaryCard } from "@/components/features/admin/student-accounts/SummaryCard";
import {
  COURSE_CODES,
  STUDENTS,
} from "@/components/features/admin/student-accounts/mockStudentAccounts";
import type {
  CourseCode,
  StudentRecord,
  StudentsFilters,
} from "@/components/features/admin/student-accounts/types";

const DEFAULT_FILTERS: StudentsFilters = {
  query: "",
  course: "all",
  year: "all",
  section: "all",
  page: 1,
  pageSize: 10,
};

const COURSE_ICONS: Record<CourseCode, LucideIcon> = {
  BSIT: Monitor,
  BEED: BookOpen,
  BSED: GraduationCap,
  BSHM: UtensilsCrossed,
};

const COURSE_TONES: Record<CourseCode, string> = {
  BSIT: "bg-cpc-section-light text-cpc-blue-accent",
  BEED: "bg-emerald-50 text-emerald-600",
  BSED: "bg-amber-50 text-amber-600",
  BSHM: "bg-rose-50 text-rose-600",
};

/** Route: /admin/students — the searchable student directory. */
export function AllStudentsWorkspace() {
  const [filters, setFilters] = useState<StudentsFilters>(DEFAULT_FILTERS);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filteredRows = useMemo(() => {
    const query = filters.query.trim().toLowerCase();

    return STUDENTS.filter((student) => {
      const matchesQuery =
        !query ||
        [student.fullName, student.studentId, student.email].some((value) =>
          value.toLowerCase().includes(query),
        );
      const matchesCourse = filters.course === "all" || student.course === filters.course;
      const matchesYear = filters.year === "all" || student.year === filters.year;
      const matchesSection =
        filters.section === "all" || student.section === filters.section;

      return matchesQuery && matchesCourse && matchesYear && matchesSection;
    }).sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [filters]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / filters.pageSize));
  const page = Math.min(filters.page, totalPages);
  const pageRows = filteredRows.slice(
    (page - 1) * filters.pageSize,
    page * filters.pageSize,
  );

  const hasActiveFilters =
    filters.query.trim() !== "" ||
    filters.course !== "all" ||
    filters.year !== "all" ||
    filters.section !== "all";

  const selectedStudent = STUDENTS.find((student) => student.id === selectedId) ?? null;

  const courseCounts = useMemo(() => {
    const counts = new Map<CourseCode, number>();
    for (const student of STUDENTS) {
      counts.set(student.course, (counts.get(student.course) ?? 0) + 1);
    }
    return counts;
  }, []);

  function setFilter<K extends keyof StudentsFilters>(
    key: K,
    value: StudentsFilters[K],
  ) {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      ...(key === "page" ? {} : { page: 1 }),
      ...(key === "course" || key === "year" ? { section: "all" } : {}),
    }));
  }

  function resetFilters() {
    setFilters((prev) => ({ ...DEFAULT_FILTERS, pageSize: prev.pageSize }));
  }

  function applyCourseFilter(course: CourseCode | "all") {
    setFilters((prev) => ({ ...prev, course, section: "all", page: 1 }));
  }

  return (
    <div className="space-y-6">
      <PageBanner
        title="All Students"
        subtitle="Browse student records, sections and enrollment status across every program"
        right={
          <div className="flex items-center gap-2.5 rounded-xl border border-white/80 bg-white/80 px-3.5 py-2.5 shadow-[0_10px_30px_rgba(15,36,104,0.08)] backdrop-blur">
            <span
              aria-hidden
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cpc-section-light text-cpc-blue-accent"
            >
              <Users className="h-4 w-4" />
            </span>
            <div>
              <p className="font-poppins text-[10px] font-bold tracking-[0.12em] text-cpc-heading-soft uppercase">
                Total students
              </p>
              <p className="font-poppins text-sm leading-none font-bold text-cpc-navy-text tabular-nums">
                {STUDENTS.length}
              </p>
            </div>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <SummaryCard
          label="Total Students"
          count={STUDENTS.length}
          icon={Users}
          tone="bg-cpc-section-light text-cpc-blue-accent"
          chip="All programs"
          hint="Every student in the directory"
          active={filters.course === "all"}
          onClick={() => applyCourseFilter("all")}
        />
        {COURSE_CODES.map((course) => {
          const count = courseCounts.get(course) ?? 0;
          const share = STUDENTS.length === 0 ? 0 : Math.round((count / STUDENTS.length) * 100);
          return (
            <SummaryCard
              key={course}
              label={course}
              count={count}
              icon={COURSE_ICONS[course]}
              tone={COURSE_TONES[course]}
              chip={`${share}% of total`}
              hint={`Students enrolled in ${course}`}
              active={filters.course === course}
              onClick={() => applyCourseFilter(course)}
            />
          );
        })}
      </div>

      <StudentsToolbar
        filters={filters}
        setFilter={setFilter}
        resetFilters={resetFilters}
        hasActiveFilters={hasActiveFilters}
      />

      <StudentsTable
        rows={pageRows}
        totalRows={filteredRows.length}
        page={page}
        pageSize={filters.pageSize}
        hasActiveFilters={hasActiveFilters}
        onView={(student: StudentRecord) => setSelectedId(student.id)}
        onPageChange={(nextPage) => setFilter("page", nextPage)}
        onPageSizeChange={(size) => setFilter("pageSize", size)}
        onClearFilters={resetFilters}
      />

      {selectedStudent && (
        <StudentDetailsModal
          key={selectedStudent.id}
          student={selectedStudent}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}
