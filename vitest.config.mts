import path from "node:path";
import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": dirname,
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.dom.ts"],
    include: ["tests/unit/**/*.test.ts", "tests/ui/**/*.test.tsx"],
    exclude: ["e2e/**", "node_modules/**"],
  },
});
