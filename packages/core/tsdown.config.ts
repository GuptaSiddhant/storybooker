import { argv } from "node:process";
import { defineConfig } from "tsdown";

export default defineConfig({
  clean: !argv.includes("-w"),
  dts: { tsgo: true },
  entry: ["./src/index.ts"],
  exports: true,
  inputOptions: { jsx: "react-jsx" },
  onSuccess: generateOpenApiSpec,
  platform: "node",
  sourcemap: true,
  treeshake: true,
});

async function generateOpenApiSpec(): Promise<void> {
  const { router, SERVICE_NAME } = await import("./dist/index.js");
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
