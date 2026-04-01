import type { Express } from "express";
import fs from "fs";
import path from "path";
import { type ViteDevServer, createServer as createViteServer } from "vite";

/**
 * Sets up the Vite development server as a middleware within Express.
 * Handles React Hot Module Replacement (HMR) and serving client source files.
 */
export async function setupVite(app: Express) {
  const root = path.resolve(__dirname, "..");
  const clientRoot = path.resolve(root, "client");

  const vite = await createViteServer({
    root: clientRoot,
    server: {
      middlewareMode: true,
      hmr: {
        server: app.listen(0, () => {}).close(), // Dummy call to let Vite setup HMR correctly
      },
    },
    appType: "custom",
  });

  // Use Vite's connect instance as middleware
  app.use(vite.middlewares);

  // Serve index.html with Vite's HTML transform (for HMR scripts)
  app.use(async (req, res, next) => {
    // Only intercept traditional unhandled page requests
    if (req.method !== "GET" || req.headers.accept?.indexOf("text/html") === -1) {
      return next();
    }

    const url = req.originalUrl;

    try {
      let template = fs.readFileSync(
        path.resolve(clientRoot, "index.html"),
        "utf-8"
      );

      // Transform the template to inject Vite's HMR scripts
      template = await vite.transformIndexHtml(url, template);

      res.status(200).set({ "Content-Type": "text/html" }).end(template);
    } catch (e) {
      if (e instanceof Error) {
        vite.ssrFixStacktrace(e);
      }
      next(e);
    }
  });

  return vite;
}

/**
 * Serves the pre-built React application from the /dist directory.
 * Used for production simulation or simpler single-port access.
 */
export function serveStatic(app: Express) {
  const root = path.resolve(__dirname, "..");
  const distPath = path.resolve(root, "client", "dist");

  if (!fs.existsSync(distPath)) {
    console.error(
      "❌ Client build folder not found! Have you run `npm run build` in the client folder?"
    );
    return;
  }

  // Serve static assets from the build folder
  app.use(require("express").static(distPath));

  // Catch-all for React Router to serve index.html
  app.use((req, res, next) => {
    if (req.method !== "GET" || req.headers.accept?.indexOf("text/html") === -1) {
      return next();
    }
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
