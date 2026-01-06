export async function updateDenoJsonToMatchPkgJson(
  entry: Record<string, string>,
  options?: {
    logger?: { success: (message: string) => void };
    signal?: AbortSignal;
    additionalExports?: Record<string, string>;
  },
): Promise<void> {
  const { logger, signal, additionalExports } = options || {};
  const { readFile, writeFile } = await import("node:fs/promises");
  const pkgJsonPath = "./package.json";
  const pkgJson = JSON.parse(await readFile(pkgJsonPath, { encoding: "utf8", signal }));

  const denoExports: Record<string, string> = { ...additionalExports };
  for (const [key, value] of Object.entries(entry)) {
    if (key === "index") {
      denoExports["."] = value;
    }
    denoExports[`./${key}`] = value;
  }

  const denoJsonPath = "./deno.json";
  const denoJson = JSON.parse(await readFile(denoJsonPath, { encoding: "utf8", signal }));
  denoJson["exports"] = denoExports;
  denoJson["version"] = pkgJson["version"];

  // oxlint-disable-next-line prefer-template
  await writeFile(denoJsonPath, JSON.stringify(denoJson, null, 2) + "\n", {
    encoding: "utf8",
    signal,
  });
  logger?.success("Updated deno.json");
}

export interface JsrPackageMeta {
  /** The package's scope or namespace on jsr.io */
  scope: string;
  /** The package's name */
  name: string;
  /** The latest available version of the package */
  latest: string;
  /** A map of available versions and their metadata */
  versions: Record<string, unknown>;
}

export async function fetchJsrPackageMeta(packageName: string): Promise<JsrPackageMeta | null> {
  const url = `https://jsr.io/${packageName}/meta.json`;
  const headers = new Headers({ Accept: "application/json" });
  const response = await fetch(url, { headers });
  if (response.ok) {
    return (await response.json()) as JsrPackageMeta;
  }
  return null;
}

export async function checkJsrRepublish(
  packageName: string,
  packageVersion: string,
): Promise<boolean | undefined> {
  const meta = await fetchJsrPackageMeta(packageName);
  if (!meta) {
    return undefined;
  }
  const versions = Object.keys(meta.versions);
  return versions.includes(packageVersion);
}
