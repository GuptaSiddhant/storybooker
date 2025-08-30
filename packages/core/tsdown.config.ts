import { defineConfig } from "tsdown";

export default defineConfig({
  dts: { tsgo: true },
  entry: ["./src/index.ts"],
  exports: true,
  inputOptions: { jsx: "react-jsx" },
  name: "Core",
  platform: "node",
  sourcemap: true,
  treeshake: true,
});
