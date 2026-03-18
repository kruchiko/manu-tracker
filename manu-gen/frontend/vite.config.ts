// vitest/config re-exports Vite's defineConfig augmented with the `test` key.
// This is the documented single-file config pattern for Vite + Vitest.
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const API_TARGET = process.env.API_TARGET ?? "http://localhost:3000";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/orders": {
        target: API_TARGET,
        configure: (proxy) => {
          proxy.on("proxyReq", (_, req) => {
            console.log(`[proxy] → ${req.method} ${req.url}`);
          });
          proxy.on("proxyRes", (res, req) => {
            console.log(`[proxy] ← ${res.statusCode} ${req.method} ${req.url}`);
          });
        },
      },
      "/stations": {
        target: API_TARGET,
        configure: (proxy) => {
          proxy.on("proxyReq", (_, req) => {
            console.log(`[proxy] → ${req.method} ${req.url}`);
          });
          proxy.on("proxyRes", (res, req) => {
            console.log(`[proxy] ← ${res.statusCode} ${req.method} ${req.url}`);
          });
        },
      },
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test-setup.ts"],
  },
});
