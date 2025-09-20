import { defineConfig } from "tsdown";

export default defineConfig({
  dts: { tsgo: true },
  entry: ["./src/index.ts"],
  exports: { devExports: "source" },
  platform: "node",
  sourcemap: true,
  treeshake: true,
  unbundle: true,
});
