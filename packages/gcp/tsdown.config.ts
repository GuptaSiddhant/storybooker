import { defineConfig, type ResolvedOptions } from "tsdown";

export default defineConfig({
  dts: { tsgo: true },
  entry: ["./src/big-table.ts", "./src/firestore.ts", "./src/storage.ts"],
  exports: { devExports: "source" },
  format: ["esm", "cjs"],
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
