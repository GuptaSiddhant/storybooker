import { spawnSync } from "node:child_process";
import { defineConfig } from "tsdown";
import { updateDenoJsonToMatchPkgJson } from "../../scripts/jsr-utils.ts";

const isWatchMode = process.argv.includes("--watch") || process.argv.includes("-w");

export default defineConfig({
  dts: { tsgo: true },
  entry: {
    index: "./src/index.ts",
    adapter: "./src/adapters/_internal/index.ts",
    "adapter/~auth": "./src/adapters/_internal/auth.ts",
    "adapter/~database": "./src/adapters/_internal/database.ts",
    "adapter/~logger": "./src/adapters/_internal/logger.ts",
    "adapter/~storage": "./src/adapters/_internal/storage.ts",
    "adapter/~ui": "./src/adapters/_internal/ui.ts",
    "adapter/aws-s3": "./src/adapters/aws-s3.ts",
    "adapter/aws-dynamodb": "./src/adapters/aws-dynamodb.ts",
    "adapter/azure-blob-storage": "./src/adapters/azure-blob-storage.ts",
    "adapter/azure-cosmos-db": "./src/adapters/azure-cosmos-db.ts",
    "adapter/azure-data-tables": "./src/adapters/azure-data-tables.ts",
    "adapter/azure-easy-auth": "./src/adapters/azure-easy-auth.ts",
    "adapter/azure-functions": "./src/adapters/azure-functions.ts",
    "adapter/fs": "./src/adapters/fs.ts",
    "adapter/gcp-big-table": "./src/adapters/gcp-big-table.ts",
    "adapter/gcp-firestore": "./src/adapters/gcp-firestore.ts",
    "adapter/gcp-storage": "./src/adapters/gcp-storage.ts",
    "adapter/mysql": "./src/adapters/mysql.ts",
    "adapter/redis": "./src/adapters/redis.ts",
    constants: "./src/utils/constants.ts",
    mimes: "./src/utils/mime-utils.ts",
    router: "./src/routers/_app-router.ts",
    types: "./src/types.ts",
    url: "./src/urls.ts",
    utils: "./src/utils/index.ts",
  },
  exports: { devExports: "source" },
  platform: "node",
  sourcemap: true,
  target: "node22",
  treeshake: true,
  unbundle: false,
  cjsDefault: false,
  skipNodeModulesBundle: true,
  failOnWarn: true,
  shims: true,
  onSuccess: async (config) => {
    if (isWatchMode) {
      return;
    }
    spawnSync("node", ["./scripts/gen-openapi-json.ts"], { stdio: "inherit" });
    await updateDenoJsonToMatchPkgJson(config.logger);
  },
});
