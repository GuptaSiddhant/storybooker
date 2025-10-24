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
  format: ["esm", "cjs"],
  inputOptions: { jsx: "react-jsx" },
  onSuccess,
  platform: "node",
  sourcemap: true,
  treeshake: true,
  unbundle: false,
});

async function onSuccess(config: ResolvedOptions): Promise<void> {
  await generateOpenApiSpec(config);

  const { updateDenoJsonToMatchPkgJson } = await import(
    "../../scripts/deno-match-utils.ts"
  );
  await updateDenoJsonToMatchPkgJson(config);
}

async function generateOpenApiSpec(config: ResolvedOptions): Promise<void> {
  const { router, SERVICE_NAME } = await import("./dist/index.js");
  const { createDocument } = await import("zod-openapi");
  const { readFile, writeFile } = await import("node:fs/promises");

  const openAPISpec = createDocument({
    components: {},
    info: { title: SERVICE_NAME, version: "" },
    openapi: "3.1.0",
    paths: router.paths,
    security: [],
    tags: [],
  });

  const outputFilepath = "./dist/openapi.json";
  await writeFile(outputFilepath, JSON.stringify(openAPISpec, null, 2), {
    encoding: "utf8",
  });
  config.logger.success(`Generated OpenAPI spec (${outputFilepath})`);

  const pkgJsonPath = "./package.json";
  const pkgJson = JSON.parse(await readFile(pkgJsonPath, { encoding: "utf8" }));
  pkgJson["exports"]["./openapi.json"] = outputFilepath;
  // oxlint-disable-next-line prefer-template
  await writeFile(pkgJsonPath, JSON.stringify(pkgJson, null, 2) + "\n", {
    encoding: "utf8",
  });
  config.logger.success("Updated package.json");

  return;
}
