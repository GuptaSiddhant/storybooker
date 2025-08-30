import { defineConfig } from "tsdown";

export default defineConfig({
  dts: { tsgo: true },
  entry: ["./src/index.ts", "./src/blob-storage.ts", "./src/data-tables.ts"],
  exports: true,
  platform: "node",
  sourcemap: true,
  treeshake: true,
  unbundle: true,
});
