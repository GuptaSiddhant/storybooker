import { defineConfig } from "tsdown";

const isWatchMode =
  process.argv.includes("-w") || process.argv.includes("--watch");

export default defineConfig({
  name: "Azure",
  entry: ["./src/index.ts"],
  format: isWatchMode ? ["esm"] : ["esm", "cjs"],
  dts: { tsgo: true },
  treeshake: true,
  sourcemap: true,
  clean: !isWatchMode,
});
