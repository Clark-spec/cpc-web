import { useCallback, useMemo } from "react";
import { DEAN_ROLES } from "@/lib/navigation";
import type { AdminRole, AdminUser } from "@/types/admin";
import type { SectionId, SectionSchedule } from "@/types/schedule";
import type { DraftSchedule, Instructor, ScheduleMasterData } from "@/types/scheduleAdmin";

/**
 * Who may edit what. Admin and Registrar own every section; a Dean is scoped to
 * their department's sections; an Instructor gets their own teaching load,
 * read-only; every other staff role is read-only.
 */
const EDITING_ROLES: AdminRole[] = ["admin", "registrar"];

/**
 * Mock scoping for the dean demo account: the sections of the College of
 * Computer Studies.
 */
const DEAN_SECTIONS: SectionId[] = ["BSIT-3A", "BSIT-3B"];

function surnameOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  return (parts.length > 1 ? parts[parts.length - 1] : parts[0]).toLowerCase();
}

/** Links a staff login to its master record so "My teaching load" has data. */
function matchInstructor(master: ScheduleMasterData, name: string): Instructor | null {
  const surname = surnameOf(name);
  return (
    master.instructors.find((item) => surnameOf(item.displayName) === surname) ??
    master.instructors.find((item) => surnameOf(item.fullName) === surname) ??
    null
  );
}

export function useScheduleRoleScoping(
  user: AdminUser | null,
  role: AdminRole,
  master: ScheduleMasterData,
  draft: DraftSchedule,
) {
  const isDean = DEAN_ROLES.includes(role);

  const canEditSection = useCallback(
    (section: SectionId) => {
      if (EDITING_ROLES.includes(role)) return true;
      if (isDean) return DEAN_SECTIONS.includes(section);
      return false;
    },
    [isDean, role],
  );

  const canEdit = EDITING_ROLES.includes(role) || isDean;

  const myInstructor = useMemo(
    () => (user === null ? null : matchInstructor(master, user.name)),
    [master, user],
  );

  const editDisabledReason = useCallback(
    (section?: SectionId) => {
      if (EDITING_ROLES.includes(role)) return null;
      if (isDean) {
        return section !== undefined && !canEditSection(section)
          ? "Deans edit only their own department's sections."
          : null;
      }
      if (role === "instructor") return "Instructors view their teaching load read-only.";
      return "Only the Registrar and the Administrator can edit class schedules.";
    },
    [canEditSection, isDean, role],
  );

  const sectionsForRole = useMemo<SectionId[]>(() => {
    const stored = draft.schedules.map((schedule) => schedule.section);
    if (isDean) {
      const scoped = stored.filter((section) => canEditSection(section));
      return scoped.length > 0 ? scoped : DEAN_SECTIONS;
    }
    return stored.length > 0 ? stored : DEAN_SECTIONS;
  }, [canEditSection, draft.schedules, isDean]);

  /**
   * The classes this staff member is answerable for, before any filter or
   * section tab is applied.
   */
  const scopedSchedules = useMemo<SectionSchedule[]>(() => {
    const allowed = new Set(sectionsForRole);
    const schedules = draft.schedules
      .filter((schedule) => allowed.has(schedule.section))
      .map((schedule) =>
        role === "instructor"
          ? {
              ...schedule,
              entries: schedule.entries.filter(
                (entry) => entry.instructorId !== undefined && entry.instructorId === myInstructor?.id,
              ),
            }
          : schedule,
      );
    return role === "instructor" ? schedules.filter((schedule) => schedule.entries.length > 0) : schedules;
  }, [draft.schedules, myInstructor, role, sectionsForRole]);

  return {
    canEdit,
    canEditSection,
    editDisabledReason,
    sectionsForRole,
    scopedSchedules,
    myInstructor,
  };
}

