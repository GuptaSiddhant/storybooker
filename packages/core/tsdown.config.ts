import { spawnSync } from "node:child_process";
import { defineConfig } from "tsdown";
import { updateDenoJsonToMatchPkgJson } from "../../scripts/jsr-utils.ts";

const isWatchMode = process.argv.includes("--watch") || process.argv.includes("-w");

export default defineConfig({
  dts: { tsgo: true },
  entry: {
    index: "./src/index.ts",
    adapter: "./src/adapters/_internal/index.ts",
    "adapter/auth": "./src/adapters/_internal/auth.ts",
    "adapter/database": "./src/adapters/_internal/database.ts",
    "adapter/logger": "./src/adapters/_internal/logger.ts",
    "adapter/storage": "./src/adapters/_internal/storage.ts",
    "adapter/ui": "./src/adapters/_internal/ui.ts",
    constants: "./src/utils/constants.ts",
    router: "./src/routers/_app-router.ts",
    types: "./src/types.ts",
    utils: "./src/utils/index.ts",
    // "aws-s3": "./src/adapters/aws-s3.ts",
    // "aws-dynamodb": "./src/adapters/aws-dynamodb.ts",
    // fs: "./src/adapters/fs.ts",
    // "gcp-big-table": "./src/adapters/gcp-big-table.ts",
    // "gcp-firestore": "./src/adapters/gcp-firestore.ts",
    // "gcp-storage": "./src/adapters/gcp-storage.ts",
    // mysql: "./src/adapters/mysql.ts",
    // redis: "./src/adapters/redis.ts",
  },
  exports: {},
  platform: "node",
  sourcemap: true,
  target: "node22",
  treeshake: true,
  unbundle: true,
  cjsDefault: false,
  skipNodeModulesBundle: true,
  failOnWarn: true,
  shims: true,
  clean: !isWatchMode,
  onSuccess: async (config) => {
    if (isWatchMode) {
      return;
    }
    spawnSync("node", ["./scripts/gen-openapi-json.ts"], { stdio: "inherit" });
    await updateDenoJsonToMatchPkgJson(config.logger);
  },
});
