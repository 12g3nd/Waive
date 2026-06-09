import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
  },
  resolve: {
    // Mirror the tsconfig "@/*" -> "./*" alias so tests import the same way the app does.
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
