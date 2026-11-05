import { useCallback, useEffect, useRef, useState } from "react";
import {
  CLEARANCE_CHANNEL_NAME,
  CLEARANCE_PERIOD_KEY,
  CLEARANCE_RECORDS_KEY,
  CLEARANCE_TIMELINE_KEY,
} from "../services/clearanceAdminService";
import type { SyncStatus } from "../types";

/** Keys whose change means "the queue on disk is no longer what we rendered". */
const SYNC_KEYS = new Set<string>([
  CLEARANCE_RECORDS_KEY,
  CLEARANCE_TIMELINE_KEY,
  CLEARANCE_PERIOD_KEY,
]);

type SyncMessage = { reason?: string };

/**
 * Cross-tab live sync for the shared clearance store.
 *
 * (1) Storage contract: both portals write the same `cpc:clearance:records`
 * array. The `storage` event covers other tabs, `BroadcastChannel` covers the
 * same tab (and is what makes a student-side change visible instantly).
 *
 * `onRemoteChange` is called with the broadcast reason so the queue can refresh
 * without the user pressing Refresh.
 */
export function useStorageSync(
  onRemoteChange: (reason: string) => void,
): SyncStatus & { markSynced: () => void } {
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(new Date().toISOString());
  const [online, setOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine,
  );
  const handler = useRef(onRemoteChange);

  const markSynced = useCallback(() => {
    setLastSyncedAt(new Date().toISOString());
  }, []);

  // Latest-callback ref: the listeners below stay subscribed once, but always
  // call the current closure.
  useEffect(() => {
    handler.current = onRemoteChange;
  });

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key && SYNC_KEYS.has(event.key)) {
        markSynced();
        handler.current("storage");
      }
    };

    const channel =
      typeof BroadcastChannel === "undefined" ? null : new BroadcastChannel(CLEARANCE_CHANNEL_NAME);
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
