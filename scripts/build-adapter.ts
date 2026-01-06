import path from "node:path";
import { build } from "tsdown";

const isWatchMode = process.argv.includes("-w") || process.argv.includes("--watch");

const pkgJsonPath = process.env["npm_package_json"] ?? path.join(process.cwd(), "package.json");
const { default: pkgJson } = await import(pkgJsonPath, { with: { type: "json" } });
const tsdownEntry = pkgJson["tsdown-entry"];

if (!tsdownEntry) {
  throw new Error("No 'tsdown-entry' field found in package.json");
}

await build({
  clean: !isWatchMode,
  cjsDefault: false,
  dts: { tsgo: true },
  entry: tsdownEntry,
  exports: {},
  failOnWarn: true,
  format: ["esm"],
  platform: "node",
  sourcemap: true,
  treeshake: true,
  unbundle: true,
  watch: isWatchMode,
});
