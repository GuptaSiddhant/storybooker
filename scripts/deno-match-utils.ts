import type { ResolvedOptions } from "tsdown";

export async function updateDenoJsonToMatchPkgJson(
  config: ResolvedOptions,
  signal?: AbortSignal,
): Promise<void> {
  const { readFile, writeFile } = await import("node:fs/promises");
  const pkgJsonPath = "./package.json";
  const pkgJson = JSON.parse(
    await readFile(pkgJsonPath, { encoding: "utf8", signal }),
  );
  const exports: Record<string, string | { source: string }> =
    pkgJson["exports"] || {};

  const denoExports: Record<string, string> = {};
  for (const [key, value] of Object.entries(exports)) {
    const source = typeof value === "string" ? value : value.source;
    if (source !== pkgJsonPath) {
      denoExports[key] = source;
    }
  }

  const denoJsonPath = "./deno.json";
  const denoJson = JSON.parse(
    await readFile(denoJsonPath, { encoding: "utf8", signal }),
  );
  denoJson["exports"] = denoExports;
  denoJson["version"] = pkgJson["version"];

  // oxlint-disable-next-line prefer-template
  await writeFile(denoJsonPath, JSON.stringify(denoJson, null, 2) + "\n", {
    encoding: "utf8",
    signal,
  });
  config.logger.success("Updated deno.json");

  return;
}
