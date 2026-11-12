import { useEffect, useRef } from "react";
import { API_BASE_URL } from "@/lib/apiClient";

type SseEventHandler = (type: string, data: unknown) => void;

/**
 * Subscribes to the backend Server-Sent Events stream for the authenticated
 * student. The browser's `EventSource` API handles reconnection automatically.
 *
 * The backend sends:
 *   - `ping`                   every 25 s (heartbeat, no action needed)
 *   - `profile_updated`        when profile data changes
 *   - `service_request_updated` when a request's status changes
 *
 * @param onEvent  Stable callback — wrap in useCallback to prevent reconnects.
 * @param enabled  Pass `false` to skip connecting (e.g. user is not logged in).
 */
export function useSSE(onEvent: SseEventHandler, enabled = true) {
  const handlerRef = useRef(onEvent);

  useEffect(() => {
    handlerRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    if (!enabled) return;

    let es: EventSource | null = null;

    function connect() {
      es = new EventSource(`${API_BASE_URL}/sse/v1/student`, { withCredentials: true });

      es.addEventListener("profile_updated", (event) => {
        try {
          handlerRef.current("profile_updated", JSON.parse((event as MessageEvent).data));
        } catch {
          handlerRef.current("profile_updated", {});
        }
      });

      es.addEventListener("service_request_updated", (event) => {
        try {
          handlerRef.current("service_request_updated", JSON.parse((event as MessageEvent).data));
        } catch {
          handlerRef.current("service_request_updated", {});
        }
      });

      // Ping events are intentionally ignored — they just keep the connection alive.

      es.onerror = () => {
        // EventSource reconnects automatically; no manual retry needed.
      };
    }

    connect();

    return () => {
      es?.close();
    };
  }, [enabled]);
}

