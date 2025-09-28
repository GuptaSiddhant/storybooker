import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      exclude: ["src/**/*.type.ts"],
      include: ["src/**/*.ts"],
      provider: "v8",
      reporter: ["text", "text-summary"],
    },
    environment: "node",
    exclude: ["node_modules", "dist"],
    include: ["src/**/*.test.ts"],
  },
});
