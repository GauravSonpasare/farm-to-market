import { WebSocket, WebSocketServer } from "ws";
import http from "http";
import { verifyToken } from "./middleware/auth";
import { db } from "./db";
import { messages } from "../shared/schema";

// ─── Connection Registry ───────────────────────────────────────────────────────
const clients = new Map<number, WebSocket>();

export function registerClient(userId: number, ws: WebSocket) {
  clients.set(userId, ws);
  console.log(`[WS] Client connected: userId=${userId}. Total=${clients.size}`);
}

function removeClient(userId: number) {
  clients.delete(userId);
  console.log(`[WS] Client disconnected: userId=${userId}. Total=${clients.size}`);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Send a JSON payload to a specific user (if online). */
export function notifyUser(userId: number, payload: object) {
  const ws = clients.get(userId);
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}

/** Check if a user is currently connected. */
export function isOnline(userId: number): boolean {
  const ws = clients.get(userId);
  return !!ws && ws.readyState === WebSocket.OPEN;
}

// ─── Broadcast presence to a target user ──────────────────────────────────────
function broadcastPresence(fromUserId: number, toUserId: number, online: boolean) {
  notifyUser(toUserId, { type: "PRESENCE", userId: fromUserId, online });
}

// ─── Incoming message handler ─────────────────────────────────────────────────
async function handleChatMessage(
  senderId: number,
  data: {
    type: string;
    orderId?: number;
    content?: string;
    receiverId?: number;
  }
) {
  const { orderId, content, receiverId } = data;

  if (!orderId || !content?.trim() || !receiverId) {
    console.warn("[WS] CHAT_MESSAGE missing fields, ignored");
    return;
  }

  try {
    // Persist the message to DB safely without .returning()
    const result = await db
      .insert(messages)
      .values({
        orderId,
        senderId,
        receiverId,
        content: content.trim(),
      });

    // We can confidently broadcast the message properties immediately
    // without doing an extra query if we don't strictly need the precise autoincrement ID
    // for just displaying it on the frontend. We'll use a local synthetic ID until reload.
    const payload = {
      type: "CHAT_MESSAGE",
      message: {
        id: Date.now(), // Synthetic ID for UI deduplication
        orderId,
        content: content.trim(),
        receiverId,
        senderId,
        createdAt: new Date().toISOString(),
      },
    };

    // Deliver to receiver (if online) and echo back to sender
    notifyUser(receiverId, payload);
    notifyUser(senderId, payload);
  } catch (err) {
    console.error("[WS] Failed to save chat message:", err);
  }
}

// ─── Attach WS server to existing HTTP server ─────────────────────────────────
export function attachWebSocketServer(server: http.Server) {
  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws, req) => {
    const cookieHeader = req.headers.cookie || "";
    const tokenMatch = cookieHeader.match(/(?:^|;\s*)token=([^;]+)/);

    if (!tokenMatch) {
      ws.close(1008, "Unauthorized: no token");
      return;
    }

    let userId: number;
    let onlineNotifyTargets: number[] = [];

    try {
      const payload = verifyToken(tokenMatch[1]);
      userId = payload.id;

      registerClient(userId, ws);
      ws.send(JSON.stringify({ type: "CONNECTED", userId }));

      // Broadcast presence to any clients who may be chatting with this user
      // (simple approach: broadcast to all; clients filter by relevance)
      wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: "PRESENCE", userId, online: true }));
        }
      });

      // ── Incoming message router ───────────────────────────────────────────
      ws.on("message", async (raw) => {
        try {
          const data = JSON.parse(raw.toString());
          if (data.type === "CHAT_MESSAGE") {
            await handleChatMessage(userId, data);
          }
        } catch {
          // ignore invalid JSON
        }
      });

      ws.on("close", () => {
        removeClient(userId);
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: "PRESENCE", userId, online: false }));
          }
        });
      });

      ws.on("error", () => removeClient(userId));
    } catch {
      ws.close(1008, "Unauthorized: invalid token");
    }
  });

  console.log("[WS] WebSocket server attached to HTTP server");
  return wss;
}
