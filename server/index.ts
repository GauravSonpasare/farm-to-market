import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import http from "http";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import passport from "./auth";
import authRoutes from "./routes/auth";
import cropRoutes from "./routes/crops";
import orderRoutes from "./routes/orders";
import chatRoutes from "./routes/chat";
import paymentRoutes from "./routes/payments";
import adminRoutes from "./routes/admin";
import analyticsRoutes from "./routes/analytics";
import notificationRoutes from "./routes/notifications";
import marketPricesRoutes from "./routes/market-prices";
import aiRoutes from "./routes/ai";
import complaintsRoutes from "./routes/complaints";
import { setupVite, serveStatic } from "./vite-dev";
import { attachWebSocketServer } from "./websocket";


const app = express();
const PORT = Number(process.env.PORT) || 3000;

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize());

// Serve uploaded crop images as static files
// __dirname = server/ at runtime → server/public/uploads/
// e.g. GET /uploads/crops/filename.jpg → server/public/uploads/crops/filename.jpg
app.use("/uploads", express.static(path.join(__dirname, "public", "uploads")));

// ─── API Routes ──────────────────────────────────────────────────────────────

app.use("/api/auth", authRoutes);
app.use("/api/crops", cropRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/admin/analytics", analyticsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/market-prices", marketPricesRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/complaints", complaintsRoutes);

// Health Check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── Start Server ─────────────────────────────────────────────────────────────

async function startServer() {
  // Wrap Express in a raw HTTP server so WebSocket can share the same port
  const httpServer = http.createServer(app);

  // Attach WebSocket server to the same HTTP server
  attachWebSocketServer(httpServer);

  // Listen FIRST so API routes are immediately reachable.
  // setupVite (which can take a few seconds) is called after.
  await new Promise<void>((resolve) => {
    httpServer.listen(PORT, () => {
      console.log(`🌾 Farm-to-Market server running on http://localhost:${PORT} or http://127.0.0.1:${PORT}`);
      console.log(`🔌 WebSocket server ready on ws://localhost:${PORT}`);
      resolve();
    });
  });

  // In development, the client runs as a separate Vite dev server (port 5173)
  // that proxies /api/* to this server. We do NOT need Vite middleware here.
  // Only add static serving in production.
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  }
}

startServer();

export default app;
