import { argv } from "node:process";
import { defineConfig, type ResolvedOptions } from "tsdown";

export default defineConfig({
  clean: !argv.includes("-w"),
  dts: { tsgo: true },
  entry: {
    adapters: "./src/adapters.ts",
    index: "./src/index.ts",
    translations: "./src/translations/index.ts",
    "translations/en-gb": "./src/translations/en-gb.ts",
    types: "./src/types/index.ts",
    utils: "./src/utils/index.ts",
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
  const { generateOpenApiSpec } = await import(
    "../../scripts/gen-openapi-json.ts"
  );
  const { router, SERVICE_NAME } = await import("./dist/index.js");
  await generateOpenApiSpec(config, router.paths, SERVICE_NAME);

  const { updateDenoJsonToMatchPkgJson } = await import(
    "../../scripts/jsr-utils.ts"
  );
  await updateDenoJsonToMatchPkgJson(config);
}
