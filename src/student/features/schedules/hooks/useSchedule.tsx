/* eslint-disable react-refresh/only-export-components -- provider + hook intentionally share a module */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useSearchParams } from "react-router";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useToast } from "@/components/ui/toast";
import {
  getSchedule,
  isSectionId,
  MY_SECTION,
  SECTION_IDS,
} from "../data/mockSchedules";
import type { RoomSet, ScheduleEntry, SectionId } from "../types";

const SECTION_KEY = "cpc.class-schedules.section.v1";
const ROOM_SET_KEY = "cpc.class-schedules.room-set.v1";

type ScheduleContextValue = {
  /** Selected section, kept in sync with `?section=`. */
  section: SectionId;
  setSection: (section: SectionId) => void;
  sections: SectionId[];
  mySection: SectionId;
  schedule: ReturnType<typeof getSchedule>;
  loading: boolean;
  roomSet: RoomSet;
  setRoomSet: (roomSet: RoomSet) => void;
  weekOffset: number;
  setWeekOffset: (offset: number) => void;
  goToThisWeek: () => void;
  selectedEntry: ScheduleEntry | null;
  openEntry: (entry: ScheduleEntry) => void;
  closeEntry: () => void;
  highlightedId: string | null;
  highlightEntry: (id: string) => void;
  activeColorKey: string | null;
  setActiveColorKey: (colorKey: string | null) => void;
  toggleColorKey: (colorKey: string) => void;
};

const ScheduleContext = createContext<ScheduleContextValue | null>(null);

export function ScheduleProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [storedSection, setStoredSection] = useLocalStorage<SectionId>(
    SECTION_KEY,
    MY_SECTION,
  );
  const [roomSet, setStoredRoomSet] = useLocalStorage<RoomSet>(ROOM_SET_KEY, "A");

  const paramSection = searchParams.get("section");
  // URL wins over storage, so a shared link always opens the right section.
  const section: SectionId = isSectionId(paramSection) ? paramSection : storedSection;

  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedEntry, setSelectedEntry] = useState<ScheduleEntry | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [activeColorKey, setActiveColorKey] = useState<string | null>(null);
  const highlightTimer = useRef<number | null>(null);
  const initialTimer = useRef<number | null>(null);
  const firstSection = useRef(true);

  const schedule = useMemo(() => getSchedule(section), [section]);

  // First paint: a short skeleton so the page settles like the rest of the portal.
  useEffect(() => {
    initialTimer.current = window.setTimeout(() => setLoading(false), 650);
    return () => {
      if (initialTimer.current !== null) window.clearTimeout(initialTimer.current);
    };
  }, []);

  // Normalize the URL once: every section is shareable via ?section=.
  useEffect(() => {
    if (isSectionId(paramSection)) return;
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.set("section", section);
        return next;
      },
      { replace: true },
    );
  }, [paramSection, section, setSearchParams]);

  // Section changes get a 300 ms fade/skeleton and a confirmation toast.
  useEffect(() => {
    if (firstSection.current) {
      firstSection.current = false;
      return;
    }

    if (initialTimer.current !== null) {
      window.clearTimeout(initialTimer.current);
      initialTimer.current = null;
    }

    setStoredSection(section);
    setLoading(true);
    toast(`Showing ${section} schedule`, "info");
    const timer = window.setTimeout(() => setLoading(false), 320);

    return () => window.clearTimeout(timer);
  }, [section, setStoredSection, toast]);

  useEffect(() => {
    return () => {
      if (highlightTimer.current !== null) window.clearTimeout(highlightTimer.current);
    };
  }, []);

  const setSection = useCallback(
    (next: SectionId) => {
      setSearchParams(
        (current) => {
          const params = new URLSearchParams(current);
          params.set("section", next);
          return params;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const setRoomSet = useCallback(
    (next: RoomSet) => setStoredRoomSet(next),
    [setStoredRoomSet],
  );

  const goToThisWeek = useCallback(() => setWeekOffset(0), []);

  const openEntry = useCallback((entry: ScheduleEntry) => setSelectedEntry(entry), []);
  const closeEntry = useCallback(() => setSelectedEntry(null), []);

  const highlightEntry = useCallback((id: string) => {
    setHighlightedId(id);
    if (highlightTimer.current !== null) window.clearTimeout(highlightTimer.current);
    highlightTimer.current = window.setTimeout(() => setHighlightedId(null), 2800);

    const target = document.getElementById("weekly-calendar");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  }, []);

  const toggleColorKey = useCallback((colorKey: string) => {
    setActiveColorKey((current) => (current === colorKey ? null : colorKey));
  }, []);

  const value = useMemo<ScheduleContextValue>(
    () => ({
      section,
      setSection,
      sections: SECTION_IDS,
      mySection: MY_SECTION,
      schedule,
      loading,
      roomSet,
      setRoomSet,
      weekOffset,
      setWeekOffset,
      goToThisWeek,
      selectedEntry,
      openEntry,
      closeEntry,
      highlightedId,
      highlightEntry,
      activeColorKey,
      setActiveColorKey,
      toggleColorKey,
    }),
    [
      section,
      setSection,
      schedule,
      loading,
      roomSet,
      setRoomSet,
      weekOffset,
      goToThisWeek,
      selectedEntry,
      openEntry,
      closeEntry,
      highlightedId,
      highlightEntry,
      activeColorKey,
      toggleColorKey,
    ],
  );

  return <ScheduleContext.Provider value={value}>{children}</ScheduleContext.Provider>;
}

export function useSchedule(): ScheduleContextValue {
  const context = useContext(ScheduleContext);
  if (!context) {
    throw new Error("useSchedule must be used inside a <ScheduleProvider>.");
  }
  return context;
}
