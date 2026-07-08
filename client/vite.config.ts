/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: "jsdom", // components need a DOM; jsdom fakes one in Node
    setupFiles: "./src/test-setup.ts",
    // globals gives Testing Library an afterEach to hook auto-cleanup onto
    // (unmount components between tests). We still import describe/it/expect
    // explicitly in test files for clarity.
    globals: true,
  },
});
