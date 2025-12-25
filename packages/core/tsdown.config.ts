import { spawnSync } from "node:child_process";
import { defineConfig } from "tsdown";
import { updateDenoJsonToMatchPkgJson } from "../../scripts/jsr-utils.ts";

const isWatchMode = process.argv.includes("--watch") || process.argv.includes("-w");

export default defineConfig({
  dts: { tsgo: true },
  entry: {
    index: "./src/index.ts",
    "~internal/adapter": "./src/adapters/_internal/index.ts",
    "~internal/adapter/auth": "./src/adapters/_internal/auth.ts",
    "~internal/adapter/database": "./src/adapters/_internal/database.ts",
    "~internal/adapter/logger": "./src/adapters/_internal/logger.ts",
    "~internal/adapter/storage": "./src/adapters/_internal/storage.ts",
    "~internal/adapter/ui": "./src/adapters/_internal/ui.ts",
    "~internal/constants": "./src/utils/constants.ts",
    "~internal/mimes": "./src/utils/mime-utils.ts",
    "~internal/router": "./src/routers/_app-router.ts",
    "~internal/types": "./src/types.ts",
    "~internal/utils": "./src/utils/index.ts",
    "aws-s3": "./src/adapters/aws-s3.ts",
    "aws-dynamodb": "./src/adapters/aws-dynamodb.ts",
    "azure-blob-storage": "./src/adapters/azure-blob-storage.ts",
    "azure-cosmos-db": "./src/adapters/azure-cosmos-db.ts",
    "azure-data-tables": "./src/adapters/azure-data-tables.ts",
    "azure-easy-auth": "./src/adapters/azure-easy-auth.ts",
    "azure-functions": "./src/adapters/azure-functions.ts",
    fs: "./src/adapters/fs.ts",
    "gcp-big-table": "./src/adapters/gcp-big-table.ts",
    "gcp-firestore": "./src/adapters/gcp-firestore.ts",
    "gcp-storage": "./src/adapters/gcp-storage.ts",
    mysql: "./src/adapters/mysql.ts",
    redis: "./src/adapters/redis.ts",
  },
  exports: { devExports: "source" },
  platform: "node",
  sourcemap: true,
  target: "node22",
  treeshake: true,
  unbundle: true,
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
