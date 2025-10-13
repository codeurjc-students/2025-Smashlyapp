import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./test/setupTests.ts"],
    coverage: {
      provider: "v8",
      reporter: ["lcov", "text", "json"],
      reportsDirectory: "./coverage",
    },
  },
});
