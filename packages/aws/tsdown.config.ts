import { defineConfig, type ResolvedOptions } from "tsdown";

export default defineConfig({
  dts: { tsgo: true },
  entry: ["./src/dynamo-db.ts", "./src/lambda.ts", "./src/s3.ts"],
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
