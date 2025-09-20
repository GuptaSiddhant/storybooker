import { argv } from "node:process";
import { defineConfig } from "tsdown";

export default defineConfig({
  clean: !argv.includes("-w"),
  dts: { tsgo: true },
  entry: {
    constants: "./src/utils/constants.ts",
    index: "./src/index.ts",
    translations: "./src/translations/index.ts",
    "translations/en-gb": "./src/translations/en-gb.ts",
    types: "./src/types.ts",
    utils: "./src/utils/index.ts",
  },
  exports: { devExports: "source" },
  format: ["esm", "cjs"],
  inputOptions: { jsx: "react-jsx" },
  onSuccess: generateOpenApiSpec,
  platform: "node",
  sourcemap: true,
  treeshake: true,
  unbundle: true,
});

async function generateOpenApiSpec(): Promise<void> {
  const { router } = await import("./dist/index.js");
  const { SERVICE_NAME } = await import("./dist/constants.js");

  const { createDocument } = await import("zod-openapi");
  const { writeFile } = await import("node:fs/promises");

  const openAPISpec = createDocument({
    components: {},
    info: { title: SERVICE_NAME, version: "" },
    openapi: "3.1.0",
    paths: router.paths,
    security: [],
    tags: [],
  });

  await writeFile("./dist/openapi.json", JSON.stringify(openAPISpec, null, 2), {
    encoding: "utf8",
  });

  return;
}
