import type { Subject } from "@/types/clearance";

type SubjectsTableProps = {
  subjects: Subject[];
};

/** Subjects taken this term, with an auto-summed unit total. */
export function SubjectsTable({ subjects }: SubjectsTableProps) {
  const totalUnits = subjects.reduce((sum, subject) => sum + subject.units, 0);

  return (
    <section aria-labelledby="subjects-heading" className="min-w-0">
      <div className="overflow-hidden rounded-lg border border-cpc-input-border">
        <table className="w-full border-collapse font-poppins text-xs sm:text-sm">
          <caption id="subjects-heading" className="sr-only">
            Subjects taken this semester
          </caption>
          <thead>
            <tr className="bg-cpc-section-light text-left text-[11px] font-semibold text-cpc-label sm:text-xs">
              <th scope="col" className="px-2 py-2.5 sm:px-4 sm:py-3">
                Subject/s Taken
              </th>
              <th scope="col" className="px-2 py-2.5 sm:px-4 sm:py-3">
                Instructor
              </th>
              <th scope="col" className="w-14 px-2 py-2.5 text-right sm:w-20 sm:px-4 sm:py-3">
                Units
              </th>
            </tr>
          </thead>
          <tbody>
            {subjects.map((subject, index) => (
              <tr
                key={subject.name}
                className="border-t border-cpc-input-border/70 text-cpc-navy-text transition-colors hover:bg-cpc-section-light/40"
              >
                <td className="px-2 py-2.5 sm:px-4">
                  <span className="text-cpc-heading-soft">{index + 1}.</span> {subject.name}
                </td>
                <td className="px-2 py-2.5 text-cpc-heading-soft sm:px-4">
                  {subject.instructor}
                </td>
                <td className="px-2 py-2.5 text-right tabular-nums sm:px-4">{subject.units}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-cpc-input-border bg-white font-semibold text-cpc-navy-text">
              <td colSpan={2} className="px-2 py-2.5 sm:px-4 sm:py-3">
                Total units
              </td>
              <td className="px-2 py-2.5 text-right tabular-nums sm:px-4 sm:py-3">{totalUnits}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}
