import { defineConfig } from "tsdown";

export default defineConfig({
  dts: { tsgo: true },
  entry: ["./src/storage.ts"],
  exports: { devExports: "source" },
  format: ["esm", "cjs"],
  platform: "node",
  sourcemap: true,
  treeshake: true,
  unbundle: true,
});
