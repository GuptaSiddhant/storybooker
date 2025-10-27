import type { ResolvedOptions } from "tsdown";
import type { ZodOpenApiPathItemObject } from "zod-openapi";

export async function generateOpenApiSpec(
  config: ResolvedOptions | undefined,
  paths: Record<string, ZodOpenApiPathItemObject>,
  SERVICE_NAME: string,
): Promise<void> {
  const { createDocument } = await import("zod-openapi");
  const { readFile, writeFile } = await import("node:fs/promises");

  const openAPISpec = createDocument({
    components: {},
    info: { title: SERVICE_NAME, version: "" },
    openapi: "3.1.0",
    paths,
    security: [],
    tags: [],
  });

  const outputFilepath = "./dist/openapi.json";
  await writeFile(outputFilepath, JSON.stringify(openAPISpec, null, 2), {
    encoding: "utf8",
  });
  config?.logger.success(`Generated OpenAPI spec (${outputFilepath})`);

  const pkgJsonPath = "./package.json";
  const pkgJson = JSON.parse(await readFile(pkgJsonPath, { encoding: "utf8" }));
  pkgJson["exports"]["./openapi.json"] = outputFilepath;
  // oxlint-disable-next-line prefer-template
  await writeFile(pkgJsonPath, JSON.stringify(pkgJson, null, 2) + "\n", {
    encoding: "utf8",
  });
  config?.logger.success("Updated package.json");

  return;
}
