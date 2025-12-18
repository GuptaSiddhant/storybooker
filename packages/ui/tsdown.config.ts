import { argv } from "node:process";
import { defineConfig } from "tsdown";
import Raw from "unplugin-raw/rolldown";

export default defineConfig({
  clean: !argv.includes("-w"),
  dts: { tsgo: true },
  entry: { index: "./src/index.tsx" },
  exports: { devExports: "source" },
  format: ["esm"],
  platform: "node",
  sourcemap: true,
  treeshake: true,
  unbundle: false,
  plugins: [Raw()],
});
