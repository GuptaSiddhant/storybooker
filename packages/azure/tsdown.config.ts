import { defineConfig, type ResolvedOptions } from "tsdown";

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
  format: ["esm"],
  onSuccess,
  platform: "node",
  sourcemap: true,
  treeshake: true,
  unbundle: true,
});

async function onSuccess(config: ResolvedOptions): Promise<void> {
  const { updateDenoJsonToMatchPkgJson } = await import(
    "../../scripts/deno-match-utils.ts"
  );
  await updateDenoJsonToMatchPkgJson(config);
}
