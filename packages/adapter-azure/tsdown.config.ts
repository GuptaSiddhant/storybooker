import { defineConfig } from "tsdown";

export default defineConfig({
  dts: { tsgo: true },
  entry: [
    "./src/blob-storage.ts",
    "./src/cosmosdb.ts",
    "./src/data-tables.ts",
    "./src/easy-auth.ts",
  ],
  exports: { devExports: "source" },
  format: ["esm", "cjs"],
  platform: "node",
  sourcemap: true,
  treeshake: true,
  unbundle: true,
});
