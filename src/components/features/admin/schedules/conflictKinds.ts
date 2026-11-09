/**
 * The three rules the conflict engine can break, in the order the panel lists
 * them, with the sentence a staff member reads before the fix.
 *
 * It lives here rather than in `ConflictPanel` because the form's inline
 * warning quotes the same labels: one place owns the vocabulary, so the panel
 * and the modal can never describe the same clash with two different names.
 */
import type { ConflictKind } from "@/types/scheduleAdmin";

export const KIND_GROUPS: { kind: ConflictKind; label: string; hint: string }[] = [
  {
    kind: "section",
    label: "Same section twice",
    hint: "One class would be in two rooms at once.",
  },
  {
    kind: "instructor",
    label: "Teacher double-booked",
    hint: "The same instructor is timetabled in two classes at the same hour.",
  },
  {
    kind: "room",
    label: "Room double-booked",
    hint: "Two classes claim the same room in the same room set.",
  },
];

/** "Room double-booked · LAB 2 and LAB 3…" — the short name the inline list uses. */
export function kindLabel(kind: ConflictKind): string {
  return KIND_GROUPS.find((group) => group.kind === kind)?.label ?? "Conflict";
}
