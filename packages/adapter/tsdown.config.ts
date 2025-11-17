import { argv } from "node:process";
import { defineConfig, type ResolvedOptions } from "tsdown";

export default defineConfig({
  clean: !argv.includes("-w"),
  dts: { tsgo: true },
  entry: {
    auth: "./src/auth.ts",
    database: "./src/database.ts",
    index: "./src/index.ts",
    logger: "./src/logger.ts",
    queue: "./src/queue.ts",
    storage: "./src/storage.ts",
  },
  exports: { devExports: "source" },
  format: ["esm"],
  onSuccess,
  platform: "node",
  sourcemap: true,
  treeshake: true,
  unbundle: false,
});

async function onSuccess(config: ResolvedOptions): Promise<void> {
  const { updateDenoJsonToMatchPkgJson } = await import(
    "../../scripts/jsr-utils.ts"
  );
  await updateDenoJsonToMatchPkgJson(config);
}
