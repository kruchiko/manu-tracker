// vitest/config re-exports Vite's defineConfig augmented with the `test` key.
// This is the documented single-file config pattern for Vite + Vitest.
import { defineConfig } from "vitest/config";
import type { IncomingMessage } from "node:http";
import type { ProxyOptions } from "vite";
import react from "@vitejs/plugin-react";

const API_TARGET = process.env.API_TARGET ?? "http://localhost:3000";

/** Same path prefix is used for React Router (browser) and REST (fetch). Only proxy API traffic. */
function wantsDocumentShell(req: IncomingMessage): boolean {
  if (req.method !== "GET" && req.method !== "HEAD") return false;
  const accept = req.headers.accept ?? "";
  return accept.includes("text/html");
}

function apiProxy(): ProxyOptions {
  return {
    target: API_TARGET,
    bypass(req) {
      if (wantsDocumentShell(req)) {
        return "/index.html";
      }
    },
    configure: (proxy) => {
      if (process.env.NODE_ENV !== "development") return;
      proxy.on("proxyReq", (_proxyReq, req) => {
        console.log(`[proxy] → ${req.method} ${req.url}`);
      });
      proxy.on("proxyRes", (proxyRes, req) => {
        console.log(`[proxy] ← ${proxyRes.statusCode} ${req.method} ${req.url}`);
      });
    },
  };
}

export default defineConfig({
  plugins: [react()],
  server: {
    watch: {
      usePolling: true,
      interval: 1000,
    },
    proxy: {
      "/jobs": apiProxy(),
      "/customer-orders": apiProxy(),
      "/stations": apiProxy(),
      "/analytics": apiProxy(),
      "/pipelines": apiProxy(),
      "/events": apiProxy(),
      "/eyes": apiProxy(),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test-setup.ts"],
  },
});
