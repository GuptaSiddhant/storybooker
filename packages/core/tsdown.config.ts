import { argv } from "node:process";
import { defineConfig, type ResolvedOptions } from "tsdown";

export default defineConfig({
  clean: !argv.includes("-w"),
  dts: { tsgo: true },
  entry: {
    index: "./src/index.ts",
    mimetype: "./src/utils/mime-utils.ts",
    router: "./src/routers/_app-router.ts",
    translations: "./src/ui/translations/index.ts",
    "translations/en-gb": "./src/ui/translations/en-gb.ts",
    types: "./src/types.ts",
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
  const { appRouter } = await import("./dist/router.js");
  const { SERVICE_NAME } = await import("./dist/index.js");
  const pkgJson = await import("./package.json", {
    with: { type: "json" },
  });

  await generateOpenApiSpec(config, appRouter, {
    title: SERVICE_NAME,
    version: pkgJson.default.version,
  });

  const { updateDenoJsonToMatchPkgJson } = await import(
    "../../scripts/jsr-utils.ts"
  );
  await updateDenoJsonToMatchPkgJson(config);
}
