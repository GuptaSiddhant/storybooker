import type { oas31 } from "openapi3-ts";
import type { ResolvedConfig } from "tsdown";

export async function generateOpenApiSpecFiles(
  config: ResolvedConfig | undefined,
  spec: oas31.OpenAPIObject,
): Promise<void> {
  const logger = config?.logger;
  const { readFile, writeFile } = await import("node:fs/promises");

  const outputJSONFilepath = "./openapi.json";
  const specJSONContent = JSON.stringify(spec, null, 2);
  await writeFile(outputJSONFilepath, specJSONContent, { encoding: "utf8" });
  logger?.success(`Generated OpenAPI spec files (${outputJSONFilepath})`);

  const pkgJsonPath = "./package.json";
  const pkgJson = JSON.parse(await readFile(pkgJsonPath, { encoding: "utf8" }));
  pkgJson["exports"]["./openapi.json"] = outputJSONFilepath;

  // oxlint-disable-next-line prefer-template
  await writeFile(pkgJsonPath, JSON.stringify(pkgJson, null, 2) + "\n", {
    encoding: "utf8",
  });
  logger?.success("Updated package.json with spec files exports.");
}
