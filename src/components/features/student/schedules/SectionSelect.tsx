import { useSchedule } from "@/components/features/student/schedules/useSchedule";
import { SectionCascadeSelect } from "@/components/common/selection/SectionCascadeSelect";
import { SECTION_IDS } from "@/services/scheduleStudent/mockSchedules";
import type { SectionId } from "@/types/schedule";

type SectionSelectProps = {
  value: SectionId;
  onChange: (section: SectionId) => void;
};

/** Student wrapper around the shared department → year → section picker. */
export function SectionSelect({ value, onChange }: SectionSelectProps) {
  const { mySection, sections } = useSchedule();
  const available = Array.from(new Set([...sections, ...SECTION_IDS]));

  return (
    <SectionCascadeSelect
      value={value}
      onChange={(next) => {
        if (next !== "all") onChange(next);
      }}
      sections={available}
      mySection={mySection}
      ariaLabel="Class schedule section"
    />
  );
}
