import { argv } from "node:process";
import { defineConfig } from "tsdown";

export default defineConfig({
  clean: !argv.includes("-w"),
  dts: { tsgo: true },
  entry: ["./src/index.ts"],
  exports: true,
  inputOptions: { jsx: "react-jsx" },
  platform: "node",
  sourcemap: true,
  treeshake: true,
});
