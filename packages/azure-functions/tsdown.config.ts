import { defineConfig } from "tsdown";

export default defineConfig({
  dts: { tsgo: true },
  entry: ["./src/index.ts"],
  inputOptions: { jsx: "react-jsx" },
  platform: "node",
  sourcemap: true,
  treeshake: true,
});
