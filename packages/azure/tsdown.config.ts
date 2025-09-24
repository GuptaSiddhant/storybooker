import { defineConfig } from "tsdown";

export default defineConfig({
  dts: { tsgo: true },
  entry: [
    "./src/blob-storage.ts",
    "./src/cosmos-db.ts",
    "./src/data-tables.ts",
    "./src/easy-auth.ts",
    "./src/functions.ts",
  ],
  exports: { devExports: "source" },
  format: ["esm", "cjs"],
  platform: "node",
  sourcemap: true,
  treeshake: true,
  unbundle: true,
});
