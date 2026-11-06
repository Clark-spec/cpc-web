import { useCallback, useEffect, useRef, useState } from "react";
import {
  SCHEDULE_CHANNEL_NAME,
  SCHEDULE_DRAFT_KEY,
  SCHEDULE_HISTORY_KEY,
  SCHEDULE_MASTER_KEY,
  SCHEDULE_PUBLISHED_KEY,
} from "@/config/scheduleStorage";
import type { SyncStatus } from "../types";

/** Keys whose change means "what is on disk is no longer what we rendered". */
const SYNC_KEYS = new Set<string>([
  SCHEDULE_PUBLISHED_KEY,
  SCHEDULE_DRAFT_KEY,
  SCHEDULE_MASTER_KEY,
  SCHEDULE_HISTORY_KEY,
]);

type SyncMessage = { reason?: string };

/**
 * Cross-tab live sync for the shared schedule store, mirroring the clearance
 * portal's mechanism.
 *
 * (1) Storage contract: `storage` fires in the OTHER tab, which is what makes a
 * publish in the staff portal visible on a student page instantly.
 * `BroadcastChannel("cpc-schedules")` covers same-tab listeners and is what
 * wakes the admin panel after its own service writes.
 *
 * `onRemoteChange` receives the broadcast reason ("published", "draft",
 * "master", "reset") so the caller can decide whether a full re-read is needed
 * or just a "synced 3s ago" tick.
 */
export function useStorageSync(
  onRemoteChange: (reason: string) => void,
): SyncStatus & { markSynced: () => void } {
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(() => new Date().toISOString());
  const [online, setOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine,
  );
  const handler = useRef(onRemoteChange);

  const markSynced = useCallback(() => {
    setLastSyncedAt(new Date().toISOString());
  }, []);

  // Latest-callback ref: the listeners below subscribe once but always call the
  // current closure.
  useEffect(() => {
    handler.current = onRemoteChange;
  });

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key && SYNC_KEYS.has(event.key)) {
        markSynced();
        handler.current(event.key === SCHEDULE_PUBLISHED_KEY ? "published" : "storage");
      }
    };

    const channel =
      typeof BroadcastChannel === "undefined" ? null : new BroadcastChannel(SCHEDULE_CHANNEL_NAME);
    if (channel) {
      channel.onmessage = (event: MessageEvent<SyncMessage>) => {
        markSynced();
        handler.current(event.data?.reason ?? "broadcast");
      };
    }

    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);

    window.addEventListener("storage", onStorage);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
      channel?.close();
    };
  }, [markSynced]);

  return { live: online, lastSyncedAt, markSynced };
}
