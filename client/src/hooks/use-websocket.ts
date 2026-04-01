import { useEffect, useRef } from "react";

type WsMessage = {
  type: string;
  [key: string]: any;
};

/**
 * Connects to the WebSocket server on the same host/port as the app.
 * Calls `onMessage` whenever a message arrives.
 * Automatically reconnects on unexpected close (exponential backoff).
 */
export function useOrderWebSocket(onMessage: (data: WsMessage) => void) {
  const wsRef = useRef<WebSocket | null>(null);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retriesRef = useRef(0);
  const MAX_RETRIES = 5;

  useEffect(() => {
    let destroyed = false;

    function connect() {
      if (destroyed) return;

      // Use wss:// in production, ws:// in development
      const protocol = window.location.protocol === "https:" ? "wss" : "ws";
      const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
      const host = isLocal ? "localhost:3000" : window.location.host;
      const url = `${protocol}://${host}/api/ws`;

      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.addEventListener("open", () => {
        console.log("[WS] Connected");
        retriesRef.current = 0;
      });

      ws.addEventListener("message", (event) => {
        try {
          const data = JSON.parse(event.data) as WsMessage;
          onMessage(data);
        } catch {
          // ignore malformed messages
        }
      });

      ws.addEventListener("close", (e) => {
        if (destroyed) return;
        // Normal closure (1000) or policy violation (1008) – don't retry
        if (e.code === 1000 || e.code === 1008) return;

        if (retriesRef.current < MAX_RETRIES) {
          const delay = Math.min(1000 * 2 ** retriesRef.current, 16000);
          retriesRef.current++;
          console.log(`[WS] Disconnected (${e.code}). Retrying in ${delay}ms…`);
          retryRef.current = setTimeout(connect, delay);
        }
      });

      ws.addEventListener("error", () => {
        ws.close();
      });
    }

    connect();

    return () => {
      destroyed = true;
      if (retryRef.current) clearTimeout(retryRef.current);
      wsRef.current?.close(1000, "component unmounted");
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
