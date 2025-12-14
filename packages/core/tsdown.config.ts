import { spawnSync } from "node:child_process";
import { defineConfig } from "tsdown";
import { updateDenoJsonToMatchPkgJson } from "../../scripts/jsr-utils.ts";

export default defineConfig({
  dts: { tsgo: true },
  entry: {
    adapter: "./src/adapters/index.ts",
    "adapter/fs": "./src/adapters/_fs-adapters.ts",
    "adapter/auth": "./src/adapters/auth.ts",
    "adapter/database": "./src/adapters/database.ts",
    "adapter/logger": "./src/adapters/logger.ts",
    "adapter/storage": "./src/adapters/storage.ts",
    "adapter/ui": "./src/adapters/ui.ts",
    index: "./src/index.ts",
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
  onSuccess: async (config, signal) => {
    spawnSync("node", ["./scripts/gen-openapi-json.ts"], { stdio: "inherit" });
    await updateDenoJsonToMatchPkgJson(config.logger, signal);
  },
});
