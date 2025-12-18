// oxlint-disable prefer-template
import fs from "node:fs";

const pkgJsonPath = process.argv[2] || "./package.json";

const rawPkgJson = fs.readFileSync(pkgJsonPath, "utf8");
const pkgJson = JSON.parse(rawPkgJson) as Record<string, unknown>;

const prunedPkgJson: Record<string, unknown> = {
  ...pkgJson,
  workspaces: ["./packages/*"],
};

fs.writeFileSync(pkgJsonPath, JSON.stringify(prunedPkgJson, null, 2) + "\n", "utf8");
