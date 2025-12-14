// oxlint-disable no-console

import type { OpenAPIHono } from "@hono/zod-openapi";

if (import.meta.main) {
  await generateOpenApiSpecFile();
}

async function generateOpenApiSpecFile(): Promise<void> {
  const { appRouter, openapiConfig } = await import("../src/routers/_app-router.ts");
  const spec = (appRouter as OpenAPIHono).getOpenAPI31Document(openapiConfig);

  const { readFile, writeFile } = await import("node:fs/promises");

  const outputJSONFilepath = "./openapi.json";
  const specJSONContent = JSON.stringify(spec, null, 2);
  await writeFile(outputJSONFilepath, specJSONContent, { encoding: "utf8" });
  console.log(`✔ Generated OpenAPI spec files (${outputJSONFilepath})`);

  const pkgJsonPath = "./package.json";
  const pkgJson = JSON.parse(await readFile(pkgJsonPath, { encoding: "utf8" }));
  pkgJson["exports"]["./openapi.json"] = outputJSONFilepath;

  // oxlint-disable-next-line prefer-template
  await writeFile(pkgJsonPath, JSON.stringify(pkgJson, null, 2) + "\n", {
    encoding: "utf8",
  });
  console.log("✔ Updated package.json with spec files exports.");
}
