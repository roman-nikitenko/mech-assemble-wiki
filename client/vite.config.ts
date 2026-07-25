/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Dev proxy: with VITE_API_URL empty, the app makes same-origin requests
  // (relative /api, /uploads) and Vite forwards them to the API on :3000.
  // Same-origin matters for the session cookie — the browser only sends it
  // back to the origin that set it.
  server: {
    proxy: {
      "/api": "http://localhost:3000",
      "/uploads": "http://localhost:3000",
    },
  },
  test: {
    environment: "jsdom", // components need a DOM; jsdom fakes one in Node
    setupFiles: "./src/test-setup.ts",
    // globals gives Testing Library an afterEach to hook auto-cleanup onto
    // (unmount components between tests). We still import describe/it/expect
    // explicitly in test files for clarity.
    globals: true,
  },
});
