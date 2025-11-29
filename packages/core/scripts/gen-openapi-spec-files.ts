import YAML from "js-yaml";
import type { oas31 } from "openapi3-ts";
import type { ResolvedOptions } from "tsdown";

export async function generateOpenApiSpecFiles(
  config: ResolvedOptions | undefined,
  spec: oas31.OpenAPIObject,
): Promise<void> {
  const { readFile, writeFile } = await import("node:fs/promises");

  const outputJSONFilepath = "./dist/openapi.json";
  const outputYAMLFilepath = "./dist/openapi.yaml";

  const specJSONContent = JSON.stringify(spec, null, 2);
  const specYAMLContent = YAML.dump(spec, { forceQuotes: true });

  await Promise.allSettled([
    writeFile(outputJSONFilepath, specJSONContent, { encoding: "utf8" }),
    writeFile(outputYAMLFilepath, specYAMLContent, { encoding: "utf8" }),
  ]);
  config?.logger.success(
    `Generated OpenAPI spec files (${outputJSONFilepath},${outputYAMLFilepath})`,
  );

  const pkgJsonPath = "./package.json";
  const pkgJson = JSON.parse(await readFile(pkgJsonPath, { encoding: "utf8" }));
  pkgJson["exports"]["./openapi.json"] = outputJSONFilepath;
  pkgJson["exports"]["./openapi.yaml"] = outputYAMLFilepath;
  // oxlint-disable-next-line prefer-template
  await writeFile(pkgJsonPath, JSON.stringify(pkgJson, null, 2) + "\n", {
    encoding: "utf8",
  });
  config?.logger.success("Updated package.json with spec files exports.");

  return;
}
