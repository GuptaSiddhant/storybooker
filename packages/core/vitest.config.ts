import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      enabled: true,
      exclude: ["src/**/*.type.ts"],
      include: ["src/**/*.ts"],
      reporter: ["text", "text-summary"],
    },
    environment: "node",
    exclude: ["node_modules", "dist"],
    include: ["src/**/*.test.ts"],
  },
});
