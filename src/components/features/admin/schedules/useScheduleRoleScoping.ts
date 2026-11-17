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

function matchesDeanProgram(section?: string | null, role?: AdminRole, homePrograms?: string[] | null): boolean {
  if (!section) return false;
  const s = String(section).toUpperCase();
  if (
    role === "dean_cs" ||
    homePrograms?.some((p) => p.toLowerCase().includes("information technology") || p.toLowerCase().includes("computer"))
  ) {
    return s.startsWith("BSIT") || s.includes("IT");
  }
  if (
    role === "dean_edu" ||
    homePrograms?.some((p) => p.toLowerCase().includes("education") || p.toLowerCase().includes("beed"))
  ) {
    return s.startsWith("BEED") || s.startsWith("BSED") || s.includes("EDUC");
  }
  if (
    role === "dean_hm" ||
    homePrograms?.some((p) => p.toLowerCase().includes("hospitality") || p.toLowerCase().includes("bshm"))
  ) {
    return s.startsWith("BSHM") || s.startsWith("BSHRM") || s.includes("HM");
  }
  return false;
}

function surnameOf(name: string): string {
  if (!name) return "";
  const clean = name.replace(/^(Prof\.|Dr\.|Mr\.|Mrs\.|Ms\.)\s+/i, "").trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  return (parts.length > 1 ? parts[parts.length - 1] : parts[0]).toLowerCase();
}

/** Links a staff login to its master record so "My teaching load" has data. */
function matchInstructor(master: ScheduleMasterData, name: string): Instructor | null {
  const clean = name.replace(/^(Prof\.|Dr\.|Mr\.|Mrs\.|Ms\.)\s+/i, "").trim().toLowerCase();
  const surname = surnameOf(name);
  return (
    master.instructors.find((item) => {
      const itemFull = item.fullName.toLowerCase();
      const itemDisplay = item.displayName.toLowerCase();
      return (
        itemFull === clean ||
        itemDisplay === clean ||
        itemFull.includes(clean) ||
        clean.includes(itemFull) ||
        itemDisplay.includes(clean) ||
        clean.includes(itemDisplay)
      );
    }) ??
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
    (section?: SectionId) => {
      if (!section) return false;
      if (EDITING_ROLES.includes(role)) return true;
      if (isDean) return matchesDeanProgram(section, role, user?.homePrograms);
      return false;
    },
    [isDean, role, user?.homePrograms],
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
        if (section !== undefined && !canEditSection(section)) {
          if (role === "dean_cs") return "Deans can only edit their own department's sections (Computer Studies).";
          if (role === "dean_edu") return "Deans can only edit their own department's sections (Teacher Education).";
          if (role === "dean_hm") return "Deans can only edit their own department's sections (Hospitality Management).";
          return "Deans edit only their own department's sections.";
        }
        return null;
      }
      if (role === "instructor") return "Instructors view their teaching load read-only.";
      return "Only the Registrar, Administrator, and Department Deans can edit class schedules.";
    },
    [canEditSection, isDean, role],
  );

  const canPublish = EDITING_ROLES.includes(role);

  const sectionsForRole = useMemo<SectionId[]>(() => {
    const stored = draft.schedules.map((schedule) => schedule.section);
    if (isDean) {
      const scoped = stored.filter((section) => canEditSection(section));
      if (scoped.length > 0) return scoped;
      if (role === "dean_cs") return ["BSIT-3A"];
      if (role === "dean_edu") return ["BEED-2A"];
      if (role === "dean_hm") return ["BSHM-1A"];
      return scoped;
    }
    return stored.length > 0 ? stored : ["BSIT-3A"];
  }, [canEditSection, draft.schedules, isDean, role]);

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
    canPublish,
    canEditSection,
    editDisabledReason,
    sectionsForRole,
    scopedSchedules,
    myInstructor,
  };
}

