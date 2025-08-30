import { argv } from "node:process";
import { defineConfig } from "tsdown";

const isWatchMode = argv.includes("-w") || argv.includes("--watch");

export default defineConfig({
  clean: !isWatchMode,
  dts: { tsgo: true },
  entry: ["./src/index.ts"],
  exports: true,
  inputOptions: { jsx: "react-jsx" },
  name: "Router",
  platform: "node",
  sourcemap: true,
  treeshake: true,
});
