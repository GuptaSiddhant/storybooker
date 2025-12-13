import { argv } from "node:process";
import { defineConfig } from "tsdown";
import { postBuildSuccess } from "./scripts/post-build.ts";

export default defineConfig({
  clean: !argv.includes("-w"),
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
  format: ["esm"],
  onSuccess: postBuildSuccess,
  platform: "node",
  sourcemap: true,
  target: "node22",
  treeshake: true,
  unbundle: false,
});
