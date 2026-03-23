import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { plugin as markdown } from "vite-plugin-markdown";

export default defineConfig({
  plugins: [react(), markdown()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
  },
});
