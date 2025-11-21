import type { OpenAPIHono } from "@hono/zod-openapi";
import type { Hono } from "hono";
import type { oas31 } from "openapi3-ts";
import type { ResolvedOptions } from "tsdown";

export async function generateOpenApiSpec(
  config: ResolvedOptions | undefined,
  router: Hono,
  info: oas31.InfoObject,
): Promise<void> {
  const { readFile, writeFile } = await import("node:fs/promises");

  const openAPISpec = (router as OpenAPIHono).getOpenAPI31Document({
    info,
    openapi: "3.1.0",
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
