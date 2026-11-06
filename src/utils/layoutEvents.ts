import type { ConflictPair, DayCode, ScheduleEntry } from "@/types/schedule";
import { DAY_CODES, DAY_END_MIN, DAY_START_MIN, HOUR_HEIGHT } from "@/utils/scheduleTime";

/**
 * A single event after the time → pixel and overlap-lane math has run.
 *
 * `leftPct` / `widthPct` are percentages of the day column, so the same layout
 * works at any column width. `topPx` / `heightPx` are absolute pixels.
 */
export type PositionedEvent = {
  entry: ScheduleEntry;
  day: DayCode;
  /** 0-based lane inside the overlap cluster. */
  lane: number;
  /** Number of lanes in the cluster (equal widths). */
  laneCount: number;
  topPx: number;
  heightPx: number;
  leftPct: number;
  widthPct: number;
};

/**
 * TIME → PIXEL MATH
 *
 * The grid starts at 7:00 AM (420 minutes after midnight) and one hour is
 * HOUR_HEIGHT (64px). For an entry:
 *
 *   top    = (startMin - 420) / 60 * 64
 *   height = (endMin - startMin) / 60 * 64
 *
 * So 10:00–11:00 becomes top = 192px and height = 64px, and 13:30–15:00
 * becomes top = 416px and height = 96px.
 */
export function getEventGeometry(entry: ScheduleEntry): { topPx: number; heightPx: number } {
  // Clamp to the visible 7 AM – 8 PM window so an out-of-range entry can never
  // spill above the first grid line or past the bottom border.
  const start = Math.max(entry.startMin, DAY_START_MIN);
  const end = Math.min(entry.endMin, DAY_END_MIN);
  const topPx = ((start - DAY_START_MIN) / 60) * HOUR_HEIGHT;
  const heightPx = Math.max(((end - start) / 60) * HOUR_HEIGHT, 0);
  return { topPx, heightPx };
}

/** Entries that meet on a given weekday, ordered by start time. */
export function entriesForDay(entries: ScheduleEntry[], day: DayCode): ScheduleEntry[] {
  return entries
    .filter((entry) => entry.days.includes(day))
    .sort(
      (a, b) =>
        a.startMin - b.startMin ||
        a.endMin - b.endMin ||
        a.subjectCode.localeCompare(b.subjectCode),
    );
}

/**
 * OVERLAP-LANE ALGORITHM
 *
 * 1. Sort the day's events by start time.
 * 2. Walk them once and split them into "clusters": a cluster keeps growing
 *    while the next event starts before the latest end in the cluster. An
 *    event that starts exactly when the previous one ends (end === start)
 *    starts a NEW cluster, so back-to-back classes keep the full column width.
 * 3. Inside a cluster, give each event the first lane whose previous event
 *    has already ended (`laneEnd <= event.startMin`). If no lane is free,
 *    open a new one. This is the classic interval-partitioning greedy pass.
 * 4. Every event in the cluster gets `100 / laneCount` percent width and a
 *    horizontal offset of `lane / laneCount`, so true overlaps sit side by
 *    side instead of being stacked on top of each other.
 */
export function layoutEvents(entries: ScheduleEntry[], day: DayCode): PositionedEvent[] {
  const dayEntries = entriesForDay(entries, day);
  const positioned: PositionedEvent[] = [];

  let cluster: ScheduleEntry[] = [];
  let clusterEnd = -1;

  const flushCluster = () => {
    if (cluster.length === 0) return;

    // `laneEnds[lane]` is the end minute of the last event placed in that lane.
    const laneEnds: number[] = [];
    const laneByEntry = new Map<ScheduleEntry, number>();

    for (const entry of cluster) {
      let lane = laneEnds.findIndex((end) => end <= entry.startMin);
      if (lane === -1) {
        lane = laneEnds.length;
        laneEnds.push(entry.endMin);
      } else {
        laneEnds[lane] = entry.endMin;
      }
      laneByEntry.set(entry, lane);
    }

    const laneCount = laneEnds.length;
    for (const entry of cluster) {
      const lane = laneByEntry.get(entry) ?? 0;
      const { topPx, heightPx } = getEventGeometry(entry);
      positioned.push({
        entry,
        day,
        lane,
        laneCount,
        topPx,
        heightPx,
        leftPct: (lane / laneCount) * 100,
        widthPct: 100 / laneCount,
      });
    }

    cluster = [];
    clusterEnd = -1;
  };

  for (const entry of dayEntries) {
    // A real overlap requires start < latest end. Equality is back-to-back.
    if (cluster.length > 0 && entry.startMin >= clusterEnd) {
      flushCluster();
    }
    cluster.push(entry);
    clusterEnd = Math.max(clusterEnd, entry.endMin);
  }
  flushCluster();

  return positioned;
}

/**
 * Finds genuine overlaps for the conflict banner. Back-to-back pairs
 * (first.endMin === second.startMin) are deliberately ignored.
 */
export function findConflicts(entries: ScheduleEntry[]): ConflictPair[] {
  const conflicts: ConflictPair[] = [];

  for (const day of DAY_CODES) {
    const dayEntries = entriesForDay(entries, day);
    for (let i = 0; i < dayEntries.length; i += 1) {
      const first = dayEntries[i];
      for (let j = i + 1; j < dayEntries.length; j += 1) {
        const second = dayEntries[j];
        // Sorted by start: once the next start reaches this end, no later
        // event can overlap `first` either.
        if (second.startMin >= first.endMin) break;
        if (first.startMin < second.endMin && second.startMin < first.endMin) {
          conflicts.push({ day, first, second });
        }
      }
    }
  }

  return conflicts;
}
