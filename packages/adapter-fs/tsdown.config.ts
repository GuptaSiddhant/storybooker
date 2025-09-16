import { defineConfig } from "tsdown";

export default defineConfig({
  dts: { tsgo: true },
  entry: ["./src/index.ts"],
  exports: true,
  platform: "node",
  sourcemap: true,
  treeshake: true,
  unbundle: true,
});
