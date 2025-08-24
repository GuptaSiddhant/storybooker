import { defineConfig } from "tsdown";
import { argv } from "node:process";

const isWatchMode = argv.includes("-w") || argv.includes("--watch");

export default defineConfig({
  clean: !isWatchMode,
  dts: { tsgo: true },
  entry: ["./src/index.ts"],
  format: isWatchMode ? ["esm"] : ["esm", "cjs"],
  inputOptions: {
    jsx: "react-jsx",
  },
  name: "Azure",
  platform: "node",
  sourcemap: true,
  treeshake: true,
});
