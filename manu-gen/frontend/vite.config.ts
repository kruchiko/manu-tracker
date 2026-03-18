// vitest/config re-exports Vite's defineConfig augmented with the `test` key.
// This is the documented single-file config pattern for Vite + Vitest.
import { defineConfig } from "vitest/config";
import type { ProxyOptions } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const API_TARGET = process.env.API_TARGET ?? "http://localhost:3000";

function apiProxy(): ProxyOptions {
  return {
    target: API_TARGET,
    configure: (proxy) => {
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
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/orders": apiProxy(),
      "/stations": apiProxy(),
      "/analytics": apiProxy(),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test-setup.ts"],
  },
});
