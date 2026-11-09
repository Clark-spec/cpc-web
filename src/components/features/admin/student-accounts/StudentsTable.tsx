import { Eye, Inbox, SearchX } from "lucide-react";
import { EmptyState } from "@/components/common/display/EmptyState";
import { TablePagination } from "@/components/features/admin/student-accounts/TablePagination";
import { StudentStatusBadge } from "@/components/features/admin/student-accounts/statusBadges";
import {
  CELL,
  CARD_SHELL,
  HEADER_CELL,
  ROW_ACTION,
  initialsOf,
  sectionText,
} from "@/components/features/admin/student-accounts/shared";
import { COURSE_LABELS } from "@/components/features/admin/student-accounts/mockStudentAccounts";
import type { StudentRecord } from "@/components/features/admin/student-accounts/types";

type StudentsTableProps = {
  rows: StudentRecord[];
  totalRows: number;
  page: number;
  pageSize: number;
  hasActiveFilters: boolean;
  onView: (student: StudentRecord) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onClearFilters: () => void;
};

/** Student directory table: sticky header, internal scroll, paginated footer. */
export function StudentsTable({
  rows,
  totalRows,
  page,
  pageSize,
  hasActiveFilters,
  onView,
  onPageChange,
  onPageSizeChange,
  onClearFilters,
}: StudentsTableProps) {
  return (
    <section aria-label="Student directory" className={CARD_SHELL}>
      {totalRows === 0 ? (
        <EmptyState
          icon={hasActiveFilters ? SearchX : Inbox}
          title={hasActiveFilters ? "No students match these filters" : "No students yet"}
          description={
            hasActiveFilters
              ? "Try a different name, student ID, course, year level or section."
              : "Students appear here once their enrollment is approved."
          }
          action={
            hasActiveFilters ? (
              <button
                type="button"
                onClick={onClearFilters}
                className="cursor-pointer rounded-lg border border-cpc-tile-border bg-white px-3 py-2 font-poppins text-xs font-semibold text-cpc-navy-text transition-colors hover:bg-cpc-section-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
              >
                Clear filters
              </button>
            ) : undefined
          }
          className="py-14"
        />
      ) : (
        <>
          <div className="admin-scrollbar max-h-[65vh] overflow-auto">
            <table className="w-full min-w-[1040px] border-collapse">
              <caption className="sr-only">
                Student directory. {totalRows} matching students, {rows.length} shown on
                this page.
              </caption>
              <thead>
                <tr className="border-b border-cpc-tile-border/60">
                  <th scope="col" className={HEADER_CELL}>
                    Student ID
                  </th>
                  <th scope="col" className={HEADER_CELL}>
                    Full Name
                  </th>
                  <th scope="col" className={HEADER_CELL}>
                    Course
                  </th>
                  <th scope="col" className={HEADER_CELL}>
                    Year and Section
                  </th>
                  <th scope="col" className={HEADER_CELL}>
                    Email
                  </th>
                  <th scope="col" className={HEADER_CELL}>
                    Status
                  </th>
                  <th scope="col" className={`${HEADER_CELL} text-right`}>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cpc-tile-border/50">
                {rows.map((student) => (
                  <tr
                    key={student.id}
                    onClick={() => onView(student)}
                    className="cursor-pointer transition-colors hover:bg-cpc-section-light/30"
                  >
                    <td className={CELL}>
                      <span className="font-poppins text-[11px] font-bold text-cpc-navy-text whitespace-nowrap">
                        {student.studentId}
                      </span>
                    </td>

                    <td className={CELL}>
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span
                          aria-hidden
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cpc-navy font-poppins text-[10px] font-semibold text-white"
                        >
                          {initialsOf(student.fullName)}
                        </span>
                        <p
                          className="max-w-[15rem] truncate font-poppins text-xs font-semibold text-cpc-navy-text"
                          title={student.fullName}
                        >
                          {student.fullName}
                        </p>
                      </div>
                    </td>

                    <td className={CELL}>
                      <p className="font-poppins text-[11px] font-bold text-cpc-navy-text">
                        {student.course}
                      </p>
                      <p
                        className="max-w-[13rem] truncate font-poppins text-[10px] text-cpc-heading-soft"
                        title={COURSE_LABELS[student.course]}
                      >
                        {COURSE_LABELS[student.course]}
                      </p>
                    </td>

                    <td className={CELL}>
                      <span className="font-poppins text-[11px] text-cpc-navy-text whitespace-nowrap">
                        {sectionText(student.year, student.section)}
                      </span>
                    </td>

                    <td className={CELL}>
                      <span
                        className="block max-w-[16rem] truncate font-poppins text-[11px] text-cpc-navy-text"
                        title={student.email}
                      >
                        {student.email}
                      </span>
                    </td>

                    <td className={CELL}>
                      <StudentStatusBadge status={student.status} />
                    </td>

                    <td className={`${CELL} text-right`}>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onView(student);
                        }}
                        aria-label={`View ${student.fullName}`}
                        className={ROW_ACTION}
                      >
                        <Eye className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <TablePagination
            idPrefix="student"
            totalRows={totalRows}
            page={page}
            pageSize={pageSize}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
          />
        </>
      )}
    </section>
  );
}
