import { defineConfig } from "tsdown";

export default defineConfig({
  dts: { tsgo: true },
  entry: {
    index: "./src/index.ts",
    mysql: "./src/mysql.ts",
  },
  exports: { devExports: "source" },
  format: ["esm"],
  platform: "node",
  sourcemap: true,
  treeshake: true,
  unbundle: true,
});
