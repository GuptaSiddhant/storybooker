import { defineConfig } from "tsdown";

export default defineConfig({
  dts: { tsgo: true },
  entry: ["./src/index.ts"],
  format: ["esm", "cjs"],
  inputOptions: { jsx: "react-jsx" },
  platform: "node",
  sourcemap: true,
  treeshake: true,
});
