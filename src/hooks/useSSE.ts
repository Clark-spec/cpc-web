import { useEffect, useRef } from "react";
import { API_BASE_URL, readAccessToken } from "@/lib/apiClient";
import { getSessionApi } from "@/services/auth";

type SseEventHandler = (type: string, data: unknown) => void;

const EVENT_TYPES = new Set([
  "connected",
  "profile_updated",
  "service_request_updated",
  "notification_updated",
  "notification_created",
  "complaint_updated",
  "academic_calendar_updated",
  "enrollment_queue_updated",
]);

/** Reads one SSE block and delivers its named event to the current handler. */
function dispatchEventBlock(block: string, handler: SseEventHandler) {
  let type = "message";
  const data: string[] = [];
  for (const line of block.split(/\r?\n/)) {
    if (line.startsWith("event:")) type = line.slice(6).trim();
    else if (line.startsWith("data:")) data.push(line.slice(5).trimStart());
  }
  if (!EVENT_TYPES.has(type)) return;
  try {
    handler(type, JSON.parse(data.join("\n")));
  } catch {
    handler(type, {});
  }
}

/**
 * Authenticated SSE stream. Fetch is used instead of EventSource so each tab
 * sends its own bearer token; auth cookies are shared between student and
 * registrar tabs and can belong to the other account.
 */
export function useSSE(onEvent: SseEventHandler, enabled = true, identity?: string, tokenResolver?: () => Promise<string>) {
  const handlerRef = useRef(onEvent);

  useEffect(() => {
    handlerRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    if (!enabled) return;

    const controller = new AbortController();
    let retryDelay = 1_000;

    const connect = async () => {
      while (!controller.signal.aborted) {
        try {
          let token = tokenResolver ? await tokenResolver() : readAccessToken();
          let response = await fetch(`${API_BASE_URL}/sse/v1/student`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            credentials: "include",
            signal: controller.signal,
          });

          // Refresh this tab's access token through the normal API client, then
          // retry the stream. This avoids relying on the shared auth cookie.
          if (response.status === 401 && !tokenResolver) {
            await getSessionApi();
            token = readAccessToken();
            response = await fetch(`${API_BASE_URL}/sse/v1/student`, {
              headers: token ? { Authorization: `Bearer ${token}` } : {},
              credentials: "include",
              signal: controller.signal,
            });
          }

          if (!response.ok || !response.body) throw new Error("SSE connection failed");
          retryDelay = 1_000;
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";

          while (!controller.signal.aborted) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const blocks = buffer.split(/\r?\n\r?\n/);
            buffer = blocks.pop() ?? "";
            for (const block of blocks) dispatchEventBlock(block, handlerRef.current);
          }
          await reader.cancel().catch(() => undefined);
        } catch {
          if (controller.signal.aborted) return;
        }

        if (controller.signal.aborted) return;
        await new Promise<void>((resolve) => {
          const timer = window.setTimeout(resolve, retryDelay);
          controller.signal.addEventListener(
            "abort",
            () => {
              window.clearTimeout(timer);
              resolve();
            },
            { once: true },
          );
        });
        retryDelay = Math.min(retryDelay * 2, 15_000);
      }
    };

    void connect();
    return () => controller.abort();
  }, [enabled, identity, tokenResolver]);
}
