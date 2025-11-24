import { argv } from "node:process";
import { defineConfig } from "tsdown";

export default defineConfig({
  clean: !argv.includes("-w"),
  dts: { tsgo: true },
  entry: "src/index.tsx",
  exports: { devExports: "source" },
  format: ["esm"],
  platform: "node",
  sourcemap: true,
  treeshake: true,
  unbundle: false,
});
